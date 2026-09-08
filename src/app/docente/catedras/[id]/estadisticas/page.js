'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { 
  ArrowLeft, 
  BarChart3, 
  TrendingUp, 
  Users, 
  AlertCircle,
  CheckCircle,
  XCircle,
  Loader2,
  PieChart as PieChartIcon
} from 'lucide-react'
import Link from 'next/link'
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie,
  ReferenceLine,
  LabelList
} from 'recharts'
import { ArrowUp, ArrowDown } from 'lucide-react'
import { TIPO_NOTA } from '@/lib/constants'
import { calculateAcademicStatus, generarFechas, getStudentExpectedDates } from '@/lib/academic-logic'

export default function EstadisticasCatedraPage({ params }) {
  const [id, setId] = useState(null)
  const scrollToTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });
  const scrollToBottom = () => window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const supabase = createClient()

  useEffect(() => {
    // Safely unwrap Next 15 async params Promise
    if (params) {
      Promise.resolve(params).then(p => {
        if (p.id) setId(p.id)
      })
    }
  }, [params])

  useEffect(() => {
    if (id) {
      fetchData()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  const fetchData = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const [catRes, classesRes, studentsRes, gradesRes] = await Promise.all([
        supabase.from('catedras').select('*').eq('id', id).single(),
        supabase.from('clases').select('*').eq('catedra_id', id).order('fecha', { ascending: true }),
        supabase.from('inscripciones').select('*').eq('catedra_id', id),
        supabase.from('notas').select('*').eq('catedra_id', id)
      ])

      if (catRes.error || !catRes.data) {
        throw new Error(catRes.error?.message || 'La cátedra no pudo ser cargada o no tenés acceso.')
      }

      const catedra = catRes.data
      const clases = classesRes.data || []
      const alumnos = studentsRes.data || []
      const notas = gradesRes.data || []

      // Fetch asistencias using class IDs
      const classIds = clases.map(c => c.id)
      const { data: asistencias, error: asistenciasError } = classIds.length > 0 
        ? await supabase.from('asistencias').select('*').in('clase_id', classIds)
        : { data: [], error: null }
      
      if (asistenciasError) {
        console.warn("No se pudieron cargar asistencias (ignorar si la tabla no existe):", asistenciasError)
      }

      // 1. Attendance by Topic/Date Chart
      const validClases = clases.filter(c => c.estado_clase === 'normal')
      const chartData = validClases.map(c => {
        const presentes = (asistencias || []).filter(a => a.clase_id === c.id && a.estado === 'presente').length
        const divider = Math.max(alumnos.length, 1)
        return {
          name: c.tema || c.fecha, // Using exact string date avoids Date parsing errors
          p: Math.round((presentes / divider) * 100),
          count: presentes
        }
      })

      // --- LÓGICA DE CONTADOR DE FALTAS (OPTIMIZADA) ---
      const attendanceThreshold = catedra?.porcentaje_asistencia || 80
      
      // 0. Calcular calendario real del semestre
      const allExpectedTeo = generarFechas(catedra.fecha_inicio, catedra.fecha_fin, catedra.dias_clase || [])
      let allExpectedPrac = []
      if (catedra.agenda_rota_practicas) {
        allExpectedPrac = generarFechas(catedra.fecha_inicio_practica || catedra.fecha_inicio, catedra.fecha_fin_practica || catedra.fecha_fin, [1,2,3,4,5,6].map(n => ['domingo','lunes','martes','miercoles','jueves','viernes','sabado'][n]))
      } else if (catedra.dias_practica && catedra.dias_practica.length > 0) {
        allExpectedPrac = generarFechas(catedra.fecha_inicio_practica || catedra.fecha_inicio, catedra.fecha_fin_practica || catedra.fecha_fin, catedra.dias_practica)
      }

      const totalScheduledDates = [...new Set([...allExpectedTeo, ...allExpectedPrac].map(f => f.toISOString().split('T')[0]))]
      const totalClassesCount = totalScheduledDates.length || 1
      const maxAbsencesAllowed = Math.floor(totalClassesCount * (1 - (attendanceThreshold / 100)))

      // --- OPTIMIZACIÓN: Mapa de Presencias ---
      const presenceMap = new Map() // Key: inscripcion_id-clase_id
      ;(asistencias || []).forEach(a => {
          if (a.estado === 'presente') {
              presenceMap.set(`${a.inscripcion_id}-${a.clase_id}`, true)
          }
      })

      const validClaseIds = validClases.map(vc => vc.id)

      const statusCounts = { promocion: 0, regular: 0, en_curso: 0, libre: 0 }
      const gradeChartData = []
      const riskStudents = []

      // Filtrar alumnos fantasma (sin nombre)
      const alumnosValidos = alumnos.filter(a => a.nombre_estudiante || a.apellido_estudiante)

      alumnosValidos.forEach(alumno => {
        const projectedDatesForStudent = getStudentExpectedDates(catedra, alumno, clases || [])
        
        const reqPct = catedra.porcentaje_asistencia || 70
        
        // Corte a hoy: solo clases dictadas hasta hoy se cuentan
        const hoy = new Date()
        const hoyStr = `${hoy.getFullYear()}-${String(hoy.getMonth()+1).padStart(2,'0')}-${String(hoy.getDate()).padStart(2,'0')}`
        
        let validasCount = 0
        let presents = 0
        projectedDatesForStudent.forEach(dDate => {
           const year = dDate.getFullYear()
           const month = String(dDate.getMonth() + 1).padStart(2, '0')
           const day = String(dDate.getDate()).padStart(2, '0')
           const fs = `${year}-${month}-${day}`
           
           if (fs > hoyStr) return // Ignorar clases futuras
           
           const dbClase = (clases || []).find(c => c.fecha === fs)
           if (dbClase && (!dbClase.estado_clase || dbClase.estado_clase === 'normal')) {
               validasCount++
               if (presenceMap.has(`${alumno.id}-${dbClase.id}`)) {
                   presents++
               }
           }
        })
        
        const absences = validasCount - presents
        const maxAllowed = Math.round(validasCount * (1 - (reqPct / 100)))
        const attPct = validasCount > 0 ? Math.round((presents / validasCount) * 100) : 100
        
        const isPredictiveRisk = validasCount > 0 && absences === maxAllowed && maxAllowed > 0
        const isAlreadyLibreByAbsences = validasCount > 0 && absences > maxAllowed
        
        // Para la tabla: mostrar faltas/permitidas de teoría (son todas las clases en este caso)
        const absTeo = absences
        const maxTeo = maxAllowed
        const absPrac = 0
        const maxPrac = 0
        
        const maxAbsencesAllowedPerStudent = maxAllowed

        // Notas
        const studentGrades = {}
        notas.filter(n => n.inscripcion_id === alumno.id).forEach(n => {
          studentGrades[n.tipo] = n.valor
        })
        
        const status = calculateAcademicStatus(catedra, studentGrades, attPct) || { label: 'EN CURSO', key: 'EN_CURSO' }

        // Totales para el Pie Chart / KPIs
        if (status.key === 'PROMOCION') statusCounts.promocion++
        else if (status.key === 'REGULAR') statusCounts.regular++
        else if (status.key === 'EN_CURSO') statusCounts.en_curso++
        else statusCounts.libre++

        // Identificar riesgo crítico
        if (isAlreadyLibreByAbsences || isPredictiveRisk) {
          riskStudents.push({
            id: alumno.id,
            nombre: alumno.nombre_estudiante || '',
            apellido: alumno.apellido_estudiante || '',
            absTeo,
            maxTeo,
            absPrac,
            maxPrac,
            type: isAlreadyLibreByAbsences ? 'libre' : 'alerta'
          })
        }
      })

      const pieData = [
        { name: 'En Curso', value: statusCounts.en_curso, color: '#94a3b8' },
        { name: 'Promoción', value: statusCounts.promocion, color: '#6366f1' },
        { name: 'Regular', value: statusCounts.regular, color: '#22c55e' },
        { name: 'Libre', value: statusCounts.libre, color: '#ef4444' }
      ].filter(d => d.value > 0)

      // Histogram Data for Grades
      const histogramDataRaw = [
        { key: '0-4', name: '0-4 (Insuf.)', p1: 0, p2: 0 },
        { key: '5', name: '5 (Aprob.)', p1: 0, p2: 0 },
        { key: '6-7', name: '6-7 (Bueno)', p1: 0, p2: 0 },
        { key: '8-9', name: '8-9 (Muy Bueno)', p1: 0, p2: 0 },
        { key: '10', name: '10 (Excelente)', p1: 0, p2: 0 }
      ]
      
      let p1Takers = 0, p1Passed = 0
      let p2Takers = 0, p2Passed = 0

      alumnosValidos.forEach(alumno => {
        const studentGrades = {}
        notas.filter(n => n.inscripcion_id === alumno.id).forEach(n => {
          studentGrades[n.tipo] = parseFloat(n.valor) || null
        })

        const p1 = studentGrades.parcial_1 || studentGrades.P1 || null
        const p2 = studentGrades.parcial_2 || studentGrades.P2 || null

        const assignBin = (val, key) => {
          if (val === null) return
          if (val < 5) histogramDataRaw[0][key]++
          else if (val < 6) histogramDataRaw[1][key]++
          else if (val < 8) histogramDataRaw[2][key]++
          else if (val < 10) histogramDataRaw[3][key]++
          else histogramDataRaw[4][key]++
        }

        if (p1 !== null) {
          assignBin(p1, 'p1')
          p1Takers++
          if (p1 >= 5) p1Passed++ // Nota mínima de aprobación
        }
        if (p2 !== null) {
          assignBin(p2, 'p2')
          p2Takers++
          if (p2 >= 5) p2Passed++
        }
      })

      const histogramData = histogramDataRaw.map(bin => ({
        ...bin,
        p1Label: p1Takers > 0 && bin.p1 > 0 ? `${Math.round((bin.p1 / p1Takers) * 100)}%` : '',
        p2Label: p2Takers > 0 && bin.p2 > 0 ? `${Math.round((bin.p2 / p2Takers) * 100)}%` : ''
      }))

      const kpiData = {
        activos: alumnosValidos.length - statusCounts.libre,
        libres: statusCounts.libre,
        libresPorFalta: riskStudents.filter(r => r.type === 'libre').length,
        enRiesgo: riskStudents.filter(r => r.type === 'alerta').length,
        p1PassRate: p1Takers > 0 ? Math.round((p1Passed / p1Takers) * 100) : null,
        p2PassRate: p2Takers > 0 ? Math.round((p2Passed / p2Takers) * 100) : null,
      }

      // Check what classes are being imparted
      const tipoClase = Array.isArray(catedra.tipo_clase) ? catedra.tipo_clase : [catedra.tipo_clase || 'teorico_practica']
      const hasTeo = tipoClase.includes('teorica') || tipoClase.includes('teorico_practica')
      const hasPrac = tipoClase.includes('practica') || tipoClase.includes('teorico_practica')

      setData({ 
        chartData, 
        pieData, 
        histogramData,
        kpiData,
        riskStudents: riskStudents.sort((a,b) => a.apellido.localeCompare(b.apellido)),
        stats: { totalAlumnos: alumnosValidos.length, totalClases: totalClassesCount, attendancePct: attendanceThreshold, hasTeo, hasPrac } 
      })
    } catch (err) {
      console.error('Error fetching analytics:', err)
      setError(err?.message || 'No se pudo conectar con el servidor.')
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <div className="p-12 text-center flex flex-col items-center justify-center"><Loader2 className="w-8 h-8 animate-spin mx-auto text-primary mb-2" /><p className="text-sm text-primary font-medium animate-pulse">Conectando métricas...</p></div>
  
  if (error) return (
    <div className="p-8 text-center mb-8 max-w-lg mx-auto mt-20 bg-danger/10 border-2 border-danger/30 rounded-3xl shadow-xl">
      <AlertCircle className="w-16 h-16 text-danger mx-auto mb-4 animate-bounce" />
      <h3 className="text-2xl font-black text-danger mb-2 tracking-tight">Error de Analítica</h3>
      <p className="text-danger/80 text-sm font-medium mb-8 leading-relaxed px-4">{error}</p>
      <button onClick={() => { setLoading(true); setError(null); fetchData(); }} className="px-8 py-3 bg-danger text-white rounded-xl font-bold hover:shadow-lg hover:shadow-danger/30 transition-all hover:bg-danger/90">
        Reintentar Conexión
      </button>
    </div>
  )

  return (
    <div className="max-w-6xl mx-auto animate-fade-in pb-20">
      <div className="mb-8">
        <Link
          href={`/docente/catedras/${id}`}
          className="inline-flex items-center gap-2 text-sm text-muted hover:text-foreground transition-colors mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver a la cátedra
        </Link>
        <h1 className="text-3xl font-bold text-foreground">Gabinete de Analítica</h1>
        <p className="text-muted text-sm mt-1">
          Visualizá el rendimiento y compromiso de tu clase en tiempo real.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Attendance chart */}
        <div className="bg-surface border border-border rounded-3xl p-8 shadow-sm">
          <h2 className="text-lg font-bold text-foreground mb-6 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary" />
            Evolución de Asistencia (% de presentes)
          </h2>
          <div className="h-[300px] w-full mt-4 flex items-center justify-center">
            {data?.chartData && data.chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.chartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis 
                    dataKey="name" 
                    tick={{ fontSize: 10 }} 
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 12 }}
                    domain={[0, 100]}
                  />
                  <Tooltip 
                    cursor={{ fill: 'var(--surface-hover)' }}
                    contentStyle={{ 
                      borderRadius: '12px', 
                      border: 'none', 
                      boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                      fontSize: '12px'
                    }}
                  />
                  <Bar dataKey="p" name="Asistencia %" fill="var(--primary)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center text-muted flex flex-col items-center">
                <BarChart3 className="w-10 h-10 mb-2 opacity-20" />
                <p className="text-sm font-medium">Aún no hay clases registradas para mostrar asistencia.</p>
              </div>
            )}
          </div>
        </div>

        <div className="bg-surface border border-border rounded-3xl p-8 shadow-sm flex flex-col justify-center">
           <h2 className="text-lg font-bold text-foreground mb-6 flex items-center gap-2">
            <PieChartIcon className="w-5 h-5 text-accent" />
            Estado de la Cursada (KPIs)
          </h2>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="p-5 bg-surface-hover/50 rounded-2xl border border-border">
              <p className="text-xs font-bold text-muted uppercase">Alumnos Activos</p>
              <p className="text-4xl font-black text-foreground mt-2">{data?.kpiData?.activos || 0}</p>
              <p className="text-[10px] font-bold text-warning mt-2">{data?.kpiData?.enRiesgo || 0} en riesgo de quedar libres</p>
            </div>
            
            <div className="p-5 bg-danger/5 rounded-2xl border border-danger/20">
              <p className="text-xs font-bold text-danger/80 uppercase">Libres por Faltas</p>
              <p className="text-4xl font-black text-danger mt-2">{data?.kpiData?.libresPorFalta || 0}</p>
              <p className="text-[10px] font-bold text-danger/60 mt-2">Superaron el límite de inasistencias</p>
            </div>

            <div className="p-5 bg-success/5 rounded-2xl border border-success/20">
              <p className="text-xs font-bold text-success/80 uppercase flex items-center gap-1.5">
                <CheckCircle className="w-3.5 h-3.5" />
                Aprobación Parcial 1
              </p>
              <p className="text-4xl font-black text-success mt-2">
                {data?.kpiData?.p1PassRate !== null ? `${data.kpiData.p1PassRate}%` : '-'}
              </p>
            </div>

            <div className="p-5 bg-primary/5 rounded-2xl border border-primary/20">
              <p className="text-xs font-bold text-primary/80 uppercase flex items-center gap-1.5">
                <CheckCircle className="w-3.5 h-3.5" />
                Aprobación Parcial 2
              </p>
              <p className="text-4xl font-black text-primary mt-2">
                {data?.kpiData?.p2PassRate !== null ? `${data.kpiData.p2PassRate}%` : '-'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Grades Performance Chart (Histogram) */}
      <div className="mt-8 bg-surface border border-border rounded-3xl p-8 shadow-sm">
        <h2 className="text-lg font-bold text-foreground mb-6 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-success" />
          Distribución de Calificaciones (Histograma)
        </h2>
        <div className="h-[350px] w-full flex items-center justify-center">
          {data?.histogramData && (data.kpiData.p1PassRate !== null || data.kpiData.p2PassRate !== null) ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.histogramData} margin={{ top: 30, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fontWeight: 'bold' }} axisLine={false} tickLine={false} interval={0} />
                <YAxis allowDecimals={false} axisLine={false} tickLine={false} />
                <Tooltip 
                  cursor={{ fill: 'var(--surface-hover)' }}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="p1" name="Parcial 1" fill="#6366f1" radius={[4, 4, 0, 0]}>
                  <LabelList dataKey="p1Label" position="top" style={{ fontSize: '10px', fill: '#6366f1', fontWeight: 'bold' }} />
                </Bar>
                <Bar dataKey="p2" name="Parcial 2" fill="#8b5cf6" radius={[4, 4, 0, 0]}>
                  <LabelList dataKey="p2Label" position="top" style={{ fontSize: '10px', fill: '#8b5cf6', fontWeight: 'bold' }} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="text-center text-muted flex flex-col items-center">
              <TrendingUp className="w-10 h-10 mb-2 opacity-20" />
              <p className="text-sm font-medium">Aún no hay notas de parciales cargadas para mostrar la distribución.</p>
            </div>
          )}
        </div>
        <p className="text-[10px] text-muted mt-4 text-center">
          * Muestra la cantidad de alumnos que obtuvieron calificaciones dentro de cada rango para analizar el rendimiento general.
        </p>
      </div>

       {/* Critical Students / Risk */}
       <div className="mt-12 bg-surface border border-border rounded-3xl p-8 shadow-sm print:shadow-none print:border-none print:p-0">
        <div className="flex items-center justify-between mb-8 print:mb-4">
          <h2 className="text-xl font-black text-foreground flex items-center gap-2">
            <AlertCircle className="w-6 h-6 text-warning" />
            Reporte de Asistencia Crítica
          </h2>
          <button onClick={() => window.print()} className="print:hidden px-4 py-2 bg-surface-hover border border-border rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-border transition-colors">
            🖨️ Imprimir A4
          </button>
        </div>

        {/* Alertas Tempranas */}
        <div className="mb-10">
          <h3 className="text-md font-bold text-warning mb-4 flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-warning animate-pulse" />
            Alertas Tempranas (Al límite de faltas)
          </h3>
          <div className="overflow-x-auto rounded-xl border border-border print:border-black/20">
            <table className="w-full text-sm text-left">
              <thead className="bg-surface-hover/50 text-xs uppercase text-muted print:bg-transparent print:text-black">
                <tr>
                  <th className="px-5 py-3">Alumno</th>
                  {data?.stats?.hasTeo && <th className="px-5 py-3 text-center">Teoría (Faltas/Permitidas)</th>}
                  {data?.stats?.hasPrac && <th className="px-5 py-3 text-center">Práctica (Faltas/Permitidas)</th>}
                  <th className="px-5 py-3 text-center">Acción Sugerida</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border print:divide-black/10">
                {data?.riskStudents?.filter(r => r.type === 'alerta').map(s => (
                  <tr key={s.id} className="bg-background print:bg-transparent">
                    <td className="px-5 py-4 font-bold text-foreground">{s.apellido}, {s.nombre}</td>
                    {data?.stats?.hasTeo && <td className="px-5 py-4 text-center font-medium text-warning">{s.absTeo} de {s.maxTeo}</td>}
                    {data?.stats?.hasPrac && <td className="px-5 py-4 text-center font-medium text-warning">{s.absPrac} de {s.maxPrac}</td>}
                    <td className="px-5 py-4 text-center">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-warning/10 text-[10px] font-black text-warning uppercase border border-warning/20">
                        Próxima falta libre
                      </span>
                    </td>
                  </tr>
                ))}
                {(!data?.riskStudents || data.riskStudents.filter(r => r.type === 'alerta').length === 0) && (
                  <tr>
                    <td colSpan={4} className="px-5 py-8 text-center text-muted font-medium">No hay alumnos en alerta temprana.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Libres por faltas */}
        <div>
          <h3 className="text-md font-bold text-danger mb-4 flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-danger animate-pulse" />
            Libres por Faltas
          </h3>
          <div className="overflow-x-auto rounded-xl border border-danger/30 print:border-black/20">
            <table className="w-full text-sm text-left">
              <thead className="bg-danger/5 text-xs uppercase text-danger/80 print:bg-transparent print:text-black">
                <tr>
                  <th className="px-5 py-3">Alumno</th>
                  {data?.stats?.hasTeo && <th className="px-5 py-3 text-center">Teoría (Faltas/Permitidas)</th>}
                  {data?.stats?.hasPrac && <th className="px-5 py-3 text-center">Práctica (Faltas/Permitidas)</th>}
                  <th className="px-5 py-3 text-center">Acción Sugerida</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-danger/20 print:divide-black/10">
                {data?.riskStudents?.filter(r => r.type === 'libre').map(s => (
                  <tr key={s.id} className="bg-background print:bg-transparent">
                    <td className="px-5 py-4 font-bold text-foreground">{s.apellido}, {s.nombre}</td>
                    {data?.stats?.hasTeo && <td className="px-5 py-4 text-center font-black text-danger">{s.absTeo} de {s.maxTeo}</td>}
                    {data?.stats?.hasPrac && <td className="px-5 py-4 text-center font-black text-danger">{s.absPrac} de {s.maxPrac}</td>}
                    <td className="px-5 py-4 text-center">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-danger/10 text-[10px] font-black text-danger uppercase border border-danger/20">
                        Hablar con titular
                      </span>
                    </td>
                  </tr>
                ))}
                {(!data?.riskStudents || data.riskStudents.filter(r => r.type === 'libre').length === 0) && (
                  <tr>
                    <td colSpan={4} className="px-5 py-8 text-center text-muted font-medium">No hay alumnos libres por faltas.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Floating Scroll Buttons */}
      <div className="fixed bottom-6 right-6 flex flex-col gap-2 z-50">
        <button onClick={scrollToTop} className="w-10 h-10 bg-surface border border-border rounded-full flex items-center justify-center hover:bg-surface-hover shadow-lg transition-all" title="Ir arriba">
          <ArrowUp className="w-5 h-5 text-muted" />
        </button>
        <button onClick={scrollToBottom} className="w-10 h-10 bg-surface border border-border rounded-full flex items-center justify-center hover:bg-surface-hover shadow-lg transition-all" title="Ir abajo">
          <ArrowDown className="w-5 h-5 text-muted" />
        </button>
      </div>
    </div>
  )
}
