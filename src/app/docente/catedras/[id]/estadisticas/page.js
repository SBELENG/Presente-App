'use client'

import { useState, useEffect, use } from 'react'
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
  ReferenceLine
} from 'recharts'
import { TIPO_NOTA } from '@/lib/constants'
import { calculateAcademicStatus } from '@/lib/academic-logic'

export default function EstadisticasCatedraPage({ params }) {
  const unwrappedParams = use(params)
  const id = unwrappedParams.id
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    fetchData()
  }, [id])

  const fetchData = async () => {
    setLoading(true)
    
    const [catRes, classesRes, studentsRes, gradesRes] = await Promise.all([
      supabase.from('catedras').select('*').eq('id', id).single(),
      supabase.from('clases').select('*').eq('catedra_id', id).order('fecha', { ascending: true }),
      supabase.from('inscripciones').select('*').eq('catedra_id', id),
      supabase.from('notas').select('*').eq('catedra_id', id)
    ])

    const catedra = catRes.data
    const clases = classesRes.data || []
    const alumnos = studentsRes.data || []
    const notas = gradesRes.data || []

    // Fetch asistencias using class IDs
    const classIds = clases.map(c => c.id)
    const { data: asistencias } = classIds.length > 0 
      ? await supabase.from('asistencias').select('*').in('clase_id', classIds)
      : { data: [] }

    // 1. Attendance by Topic/Date Chart
    const validClases = clases.filter(c => c.estado_clase === 'normal')
    const chartData = validClases.map(c => {
      const presentes = (asistencias || []).filter(a => a.clase_id === c.id && a.estado === 'presente').length
      return {
        name: c.tema || new Date(c.fecha + 'T12:00:00').toLocaleDateString('es-AR', {day:'2-digit', month:'2-digit'}),
        p: Math.round((presentes / Math.max(alumnos.length, 1)) * 100),
        count: presentes
      }
    })

    // --- LÓGICA DE CONTADOR DE FALTAS (MARGEN 0) ---
    const attendanceThreshold = catedra?.porcentaje_asistencia || 80
    
    // 0. Calcular TODAS las fechas de clase del semestre real
    const allExpectedTeo = generarFechas(catedra.fecha_inicio, catedra.fecha_fin, catedra.dias_clase || [])
    let allExpectedPrac = []
    if (catedra.agenda_rota_practicas) {
      allExpectedPrac = generarFechas(catedra.fecha_inicio_practica || catedra.fecha_inicio, catedra.fecha_fin_practica || catedra.fecha_fin, [1,2,3,4,5,6].map(n => ['domingo','lunes','martes','miercoles','jueves','viernes','sabado'][n]))
    } else if (catedra.dias_practica && catedra.dias_practica.length > 0) {
      allExpectedPrac = generarFechas(catedra.fecha_inicio_practica || catedra.fecha_inicio, catedra.fecha_fin_practica || catedra.fecha_fin, catedra.dias_practica)
    }

    const totalScheduledDates = [...new Set([...allExpectedTeo, ...allExpectedPrac].map(f => f.toISOString().split('T')[0]))]
    const totalClassesCount = totalScheduledDates.length || 1
    
    // Límite de faltas permitido (Faltas = Total * (1 - %Exigencia))
    const maxAbsencesAllowed = Math.floor(totalClassesCount * (1 - (attendanceThreshold / 100)))

    alumnos.forEach(alumno => {
      // 1. Asistencia real (Presentes)
      const presents = (asistencias || []).filter(a => a.inscripcion_id === alumno.id && a.estado === 'presente' && validClases.some(vc => vc.id === a.clase_id)).length
      
      // 2. Faltas reales (Cualquier clase dada que NO tenga presente al alumno)
      const absences = (validClases || []).filter(vc => {
        const assistRecord = (asistencias || []).find(a => a.clase_id === vc.id && a.inscripcion_id === alumno.id)
        return !assistRecord || assistRecord.estado !== 'presente'
      }).length

      const attPct = (presents / Math.max(validClases.length, 1)) * 100
      
      // DETECTOR MARGEN 0: Si ya tiene el máximo de faltas permitido
      const isPredictiveRisk = absences === maxAbsencesAllowed && maxAbsencesAllowed > 0
      const isAlreadyLibreByAbsences = absences > maxAbsencesAllowed

      // Notas
      const studentGrades = {}
      notas.filter(n => n.inscripcion_id === alumno.id).forEach(n => {
        studentGrades[n.tipo] = n.valor
      })
      
      const status = calculateAcademicStatus(catedra, studentGrades, attPct)

      // Totales para el Pie Chart
      if (status.key === 'PROMOCION') statusCounts.promocion++
      else if (status.key === 'REGULAR') statusCounts.regular++
      else if (status.key === 'EN_CURSO') statusCounts.en_curso++
      else statusCounts.libre++

      // Data para el gráfico de notas
      gradeChartData.push({
        name: alumno.apellido_estudiante,
        p1: studentGrades.parcial_1 || studentGrades.P1 || 0,
        p2: studentGrades.parcial_2 || studentGrades.P2 || 0
      })

      // Identificar riesgo crítico
      if (status.key === 'LIBRE' || isAlreadyLibreByAbsences || isPredictiveRisk) {
        riskStudents.push({
          id: alumno.id,
          nombre: alumno.nombre_estudiante,
          apellido: alumno.apellido_estudiante,
          att: attPct,
          absences: absences,
          maxAbs: maxAbsencesAllowed,
          status: isAlreadyLibreByAbsences ? { label: 'LIBRE POR FALTAS', key: 'LIBRE' } : status,
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

    setData({ 
      chartData, 
      pieData, 
      riskStudents,
      gradeChartData,
      stats: { totalAlumnos: alumnos.length, totalClases: totalClassesCount, attendancePct: attendanceThreshold } 
    })
    setLoading(false)
  }

  if (loading) return <div className="p-12 text-center"><Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" /></div>

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
          <div className="h-[300px] w-full mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data?.chartData}>
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
          </div>
        </div>

        <div className="bg-surface border border-border rounded-3xl p-8 shadow-sm">
           <h2 className="text-lg font-bold text-foreground mb-6 flex items-center gap-2">
            <PieChartIcon className="w-5 h-5 text-accent" />
            Distribución de Estado Académico (Pie)
          </h2>
          <div className="flex flex-col md:flex-row items-center justify-center gap-8">
             <div className="h-[250px] w-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data?.pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {data?.pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-4">
              {data?.pieData.map((d, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: d.color }} />
                  <span className="text-sm font-bold text-foreground">{d.name}:</span>
                  <span className="text-sm text-muted">{d.value} alumnos ({Math.round(d.value / data.stats.totalAlumnos * 100)}%)</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Grades Performance Chart */}
      <div className="mt-8 bg-surface border border-border rounded-3xl p-8 shadow-sm">
        <h2 className="text-lg font-bold text-foreground mb-6 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-success" />
          Rendimiento por Parciales (Comparativa)
        </h2>
        <div className="h-[400px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data?.gradeChartData} margin={{ top: 20, right: 30, left: 20, bottom: 40 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis dataKey="name" angle={-45} textAnchor="end" interval={0} tick={{ fontSize: 10 }} />
              <YAxis domain={[0, 10]} ticks={[0,2,4,5,6,7,8,10]} />
              <Tooltip />
              <ReferenceLine y={5} label={{ position: 'right', value: 'REGULAR (5)', fill: '#22c55e', fontSize: 10, fontWeight: 'bold' }} stroke="#22c55e" strokeDasharray="3 3" />
              <ReferenceLine y={7} label={{ position: 'right', value: 'PROMOCIÓN (7)', fill: '#6366f1', fontSize: 10, fontWeight: 'bold' }} stroke="#6366f1" strokeDasharray="3 3" />
              <Bar dataKey="p1" name="Primer Parcial" fill="#6366f1" radius={[4, 4, 0, 0]} />
              <Bar dataKey="p2" name="Segundo Parcial" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <p className="text-[10px] text-muted mt-4 text-center">
          * Las barras muestran el desempeño actual. Las líneas horizontales indican los umbrales para regularizar (5) y promocionar (7).
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
                  {s.isPredictive && (
                    <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-danger/10 text-[9px] font-black text-danger uppercase animate-pulse">
                      <AlertCircle className="w-3 h-3" />
                      Margen 0: Próxima falta Libre
                    </div>
                  )}
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
    </div>
  )
}
