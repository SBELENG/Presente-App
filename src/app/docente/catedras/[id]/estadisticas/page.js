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
  Pie
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

    // 2. Student Status Distribution
    const statusCounts = { promocion: 0, regular: 0, libre: 0 }
    const riskStudents = []
    const attendanceThreshold = catedra?.porcentaje_asistencia || 80
    
    alumnos.forEach(alumno => {
      const presents = (asistencias || []).filter(a => a.inscripcion_id === alumno.id && a.estado === 'presente' && validClases.some(vc => vc.id === a.clase_id)).length
      const attPct = (presents / Math.max(validClases.length, 1)) * 100
      
      const studentGrades = {}
      notas.filter(n => n.inscripcion_id === alumno.id).forEach(n => {
        studentGrades[n.tipo] = n.valor
      })
      
      const status = calculateAcademicStatus(catedra, studentGrades, attPct)

      if (status.key === 'PROMOCION') statusCounts.promocion++
      else if (status.key === 'REGULAR') statusCounts.regular++
      else statusCounts.libre++

      // Identificar riesgo
      if (status.key === 'LIBRE' || attPct < attendanceThreshold) {
        riskStudents.push({
          nombre: alumno.nombre_estudiante,
          apellido: alumno.apellido_estudiante,
          att: attPct,
          status: status
        })
      }
    })

    const pieData = [
      { name: 'Promoción', value: statusCounts.promocion, color: '#6366f1' },
      { name: 'Regular', value: statusCounts.regular, color: '#22c55e' },
      { name: 'Libre', value: statusCounts.libre, color: '#ef4444' }
    ].filter(d => d.value > 0)

    setData({ 
      chartData, 
      pieData, 
      riskStudents,
      stats: { totalAlumnos: alumnos.length, totalClases: validClases.length, attendancePct: attendanceThreshold } 
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

        {/* Status Distribution */}
        <div className="bg-surface border border-border rounded-3xl p-8 shadow-sm">
           <h2 className="text-lg font-bold text-foreground mb-6 flex items-center gap-2">
            <PieChartIcon className="w-5 h-5 text-accent" />
            Distribución de Estado Académico
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

       {/* Critical Students / Risk */}
       <div className="mt-12 bg-surface border border-border rounded-3xl p-8 shadow-sm">
        <h2 className="text-lg font-bold text-foreground mb-6 flex items-center gap-2 text-danger">
          <AlertCircle className="w-5 h-5" />
          Alumnos en situación crítica (Baja Asistencia o Libres)
        </h2>
        
        {data?.riskStudents?.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {data.riskStudents.map((s, i) => (
              <div key={i} className="p-4 bg-background border border-danger/20 rounded-2xl flex items-center justify-between">
                <div>
                  <div className="text-sm font-bold text-foreground">{s.apellido}, {s.nombre}</div>
                  <div className="text-[10px] text-muted flex items-center gap-2">
                    <span className={s.att < data.stats.attendancePct ? 'text-danger font-bold' : ''}>Asistencia: {Math.round(s.att)}%</span>
                    <span>•</span>
                    <span className={s.status.key === 'LIBRE' ? 'text-danger font-bold' : ''}>{s.status.label}</span>
                  </div>
                </div>
                <div className={`w-2 h-2 rounded-full ${s.status.key === 'LIBRE' || s.att < data.stats.attendancePct ? 'bg-danger animate-pulse' : 'bg-warning'}`} />
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
