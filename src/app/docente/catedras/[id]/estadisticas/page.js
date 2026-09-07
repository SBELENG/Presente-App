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
  const unwrappedParams = use(params)
  const id = unwrappedParams.id
  const scrollToTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });
  const scrollToBottom = () => window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const supabase = createClient()

  useEffect(() => {
    if (id) {
      fetchData()
    }
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

      alumnos.forEach(alumno => {
        // 1. Asistencia real (Cálculo exacto por calendario de alumno)
        const projectedDatesForStudent = getStudentExpectedDates(catedra, alumno, clases || [])
        let validasTomadasCount = 0
        let presents = 0

        projectedDatesForStudent.forEach(dDate => {
           const fs = dDate.toISOString().split('T')[0]
           const dbClase = (clases || []).find(c => c.fecha === fs)
           if (dbClase && dbClase.estado_clase === 'normal') {
               validasTomadasCount++
               if (presenceMap.has(`${alumno.id}-${dbClase.id}`)) {
                   presents++
               }
           }
        })
        
        const absences = validasTomadasCount - presents
        const studentTotalExpected = projectedDatesForStudent.length || 1
        const maxAbsencesAllowedPerStudent = Math.round(studentTotalExpected * (1 - (attendanceThreshold / 100)))
        const attPct = Math.round((presents / studentTotalExpected) * 100)
        
        // Guard: Solo alertar si ya hubo al menos 1 clase dictada
        const canAlert = validasTomadasCount > 0
        const isPredictiveRisk = canAlert && absences === maxAbsencesAllowedPerStudent && maxAbsencesAllowedPerStudent > 0
        const isAlreadyLibreByAbsences = canAlert && absences > maxAbsencesAllowedPerStudent

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
        if (status.key === 'LIBRE' || isAlreadyLibreByAbsences || isPredictiveRisk) {
          riskStudents.push({
            id: alumno.id,
            nombre: alumno.nombre_estudiante || '',
            apellido: alumno.apellido_estudiante || '',
            att: attPct,
            absences: absences,
            maxAbs: maxAbsencesAllowedPerStudent,
            status: isAlreadyLibreByAbsences ? { label: 'LIBRE POR FALTA', key: 'LIBRE' } : (isPredictiveRisk ? { label: 'LÍMITE DE FALTAS', key: 'REGULAR' } : status),
            isPredictive: isPredictiveRisk
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
      const histogramObj = {
        '0-3': { name: '0-3 (Insuf.)', p1: 0, p2: 0 },
        '4-5': { name: '4-5 (Aprob.)', p1: 0, p2: 0 },
        '6-7': { name: '6-7 (Bueno)', p1: 0, p2: 0 },
        '8-10': { name: '8-10 (Muy Bueno)', p1: 0, p2: 0 }
      }
      
      let p1Takers = 0, p1Passed = 0
      let p2Takers = 0, p2Passed = 0

      alumnos.forEach(alumno => {
        const studentGrades = {}
        notas.filter(n => n.inscripcion_id === alumno.id).forEach(n => {
          studentGrades[n.tipo] = parseFloat(n.valor) || null
        })

        const p1 = studentGrades.parcial_1 || studentGrades.P1 || null
        const p2 = studentGrades.parcial_2 || studentGrades.P2 || null

        const assignBin = (val, key) => {
          if (val === null) return
          if (val < 4) histogramObj['0-3'][key]++
          else if (val < 6) histogramObj['4-5'][key]++
          else if (val < 8) histogramObj['6-7'][key]++
          else histogramObj['8-10'][key]++
        }

        if (p1 !== null) {
          assignBin(p1, 'p1')
          p1Takers++
          if (p1 >= 4) p1Passed++ // Nota mínima de aprobación
        }
        if (p2 !== null) {
          assignBin(p2, 'p2')
          p2Takers++
          if (p2 >= 4) p2Passed++
        }
      })

      const histogramData = Object.values(histogramObj).map(bin => ({
        ...bin,
        p1Label: p1Takers > 0 && bin.p1 > 0 ? `${Math.round((bin.p1 / p1Takers) * 100)}%` : '',
        p2Label: p2Takers > 0 && bin.p2 > 0 ? `${Math.round((bin.p2 / p2Takers) * 100)}%` : ''
      }))

      const kpiData = {
        activos: alumnos.length - statusCounts.libre,
        libres: statusCounts.libre,
        enRiesgo: riskStudents.filter(r => r.status.key !== 'LIBRE').length,
        p1PassRate: p1Takers > 0 ? Math.round((p1Passed / p1Takers) * 100) : null,
        p2PassRate: p2Takers > 0 ? Math.round((p2Passed / p2Takers) * 100) : null,
      }

      setData({ 
        chartData, 
        pieData, 
        histogramData,
        kpiData,
        riskStudents,
        stats: { totalAlumnos: alumnos.length, totalClases: totalClassesCount, attendancePct: attendanceThreshold } 
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
              <p className="text-xs font-bold text-danger/80 uppercase">Alumnos Libres</p>
              <p className="text-4xl font-black text-danger mt-2">{data?.kpiData?.libres || 0}</p>
              <p className="text-[10px] font-bold text-danger/60 mt-2">Por inasistencia o notas</p>
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
                <XAxis dataKey="name" tick={{ fontSize: 12, fontWeight: 'bold' }} axisLine={false} tickLine={false} />
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
       <div className="mt-8 bg-surface border border-border rounded-3xl p-8 shadow-sm">
        <h2 className="text-lg font-bold text-foreground mb-6 flex items-center gap-2 text-danger">
          <AlertCircle className="w-5 h-5" />
          Alumnos en situación crítica (Alertas Tempranas)
        </h2>
        
        {data?.riskStudents?.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {data.riskStudents.map((s, i) => (
              <div key={s.id || i} className="p-4 bg-background border border-danger/20 rounded-2xl flex items-center justify-between">
                <div className="space-y-1">
                  <div className="text-sm font-bold text-foreground">{s.apellido}, {s.nombre}</div>
                  <div className="text-[10px] text-muted flex flex-col gap-1">
                    <span className={s.absences >= s.maxAbs ? 'text-danger font-bold' : ''}>Faltas: {s.absences} de {s.maxAbs} permitidas</span>
                    <span className={s.status.key === 'LIBRE' ? 'text-danger font-bold' : ''}>Estado: {s.status.label}</span>
                  </div>
                    <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-danger/10 text-[9px] font-black text-danger uppercase animate-pulse">
                      <AlertCircle className="w-3 h-3" />
                      {s.status.key === 'LIBRE' ? 'Hablar con profesor titular' : 'Próxima falta Libre'}
                    </div>
                </div>
                <div className={`w-3 h-3 rounded-full ${s.status.key === 'LIBRE' || s.isPredictive ? 'bg-danger animate-ping' : 'bg-warning'}`} />
              </div>
            ))}
          </div>
        ) : (
          <div className="p-12 text-center text-muted border-2 border-dashed border-border rounded-2xl">
            <CheckCircle className="w-8 h-8 text-success mx-auto mb-3 opacity-20" />
            <p className="text-sm">No hay alumnos en situación de riesgo crítico por el momento.</p>
          </div>
        )}
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
