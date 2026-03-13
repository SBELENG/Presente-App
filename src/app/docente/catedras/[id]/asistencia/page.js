'use client'

import { useState, useEffect, use } from 'react'
import { createClient } from '@/lib/supabase/client'
import { 
  ArrowLeft, 
  Download, 
  Search, 
  Calendar, 
  Check, 
  X as XIcon, 
  Minus,
  Loader2,
  Filter,
  Users,
  MapPin
} from 'lucide-react'
import Link from 'next/link'
import * as XLSX from 'xlsx'

export default function AsistenciaDetallePage({ params }) {
  const unwrappedParams = use(params)
  const id = unwrappedParams.id
  const [catedra, setCatedra] = useState(null)
  const [clases, setClases] = useState([])
  const [alumnos, setAlumnos] = useState([])
  const [asistencias, setAsistencias] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterPending, setFilterPending] = useState(false)

  const supabase = createClient()

  useEffect(() => {
    fetchData()
  }, [id])

  const fetchData = async () => {
    setLoading(true)
    
    // 1. Fetch info
    const [catRes, classesRes, studentsRes, attendanceRes] = await Promise.all([
      supabase.from('catedras').select('*').eq('id', id).single(),
      supabase.from('clases').select('*').eq('catedra_id', id).order('fecha', { ascending: true }),
      supabase.from('inscripciones').select('*').eq('catedra_id', id).order('apellido_estudiante', { ascending: true }),
      supabase.from('asistencias').select('*').in('clase_id', (await supabase.from('clases').select('id').eq('catedra_id', id)).data?.map(c => c.id) || [])
    ])

    setCatedra(catRes.data)
    setClases(classesRes.data || [])
    setAlumnos(studentsRes.data || [])
    setAsistencias(attendanceRes.data || [])
    setLoading(false)
  }

  const getAsistenciaRecord = (alumnoId, claseId) => {
    return asistencias.find(a => a.inscripcion_id === alumnoId && a.clase_id === claseId)
  }

  const calculateStudentPercentage = (alumnoId) => {
    if (clases.length === 0) return 100
    // Exceptions like feriado, paro, etc. don't count for the total classes denominator
    const validClases = clases.filter(c => c.estado_clase === 'normal')
    if (validClases.length === 0) return 100
    
    const presents = asistencias.filter(a => a.inscripcion_id === alumnoId && a.estado === 'presente' && validClases.some(vc => vc.id === a.clase_id)).length
    return Math.round((presents / validClases.length) * 100)
  }

  const exportToExcel = () => {
    const data = alumnos.map(a => {
      const row = {
        'Apellido': a.apellido_estudiante,
        'Nombre': a.nombre_estudiante,
        'DNI': a.dni_estudiante,
        'Asistencia %': `${calculateStudentPercentage(a.id)}%`
      }
      clases.forEach(c => {
        const record = getAsistenciaRecord(a.id, c.id)
        const status = record?.estado || 'ausente'
        row[new Date(c.fecha).toLocaleDateString()] = status === 'presente' ? 'P' : status === 'ausente' ? 'A' : '?'
      })
      return row
    })

    const ws = XLSX.utils.json_to_sheet(data)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Asistencia')
    XLSX.writeFile(wb, `Asistencia_${catedra.nombre}_${new Date().toLocaleDateString()}.xlsx`)
  }

  const filteredAlumnos = alumnos.filter(a => 
    `${a.nombre_estudiante} ${a.apellido_estudiante} ${a.dni_estudiante}`
      .toLowerCase()
      .includes(searchTerm.toLowerCase())
  )

  if (loading) return <div className="p-12 text-center"><Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" /></div>

  return (
    <div className="max-w-[100vw] px-6 lg:px-8 py-8 animate-fade-in overflow-hidden">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link
            href={`/docente/catedras/${id}`}
            className="inline-flex items-center gap-2 text-sm text-muted hover:text-foreground transition-colors mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Volver a la cátedra
          </Link>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Matriz de Asistencia</h1>
              <p className="text-muted text-sm mt-1">
                {catedra?.nombre} · Visualizá y exportá el historial completo de firmas.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={exportToExcel}
                className="flex items-center gap-2 px-5 py-2.5 bg-surface border border-border rounded-xl text-sm font-semibold hover:border-primary/50 transition-all"
              >
                <Download className="w-4 h-4 text-primary" />
                Exportar Excel
              </button>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="flex flex-col sm:flex-row items-center gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted" />
            <input
              type="text"
              placeholder="Buscar alumno..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-surface border border-border rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>
          <div className="flex items-center gap-2 px-4 py-3 bg-surface border border-border rounded-2xl text-sm text-muted">
            <Users className="w-4 h-4" />
            <span>{filteredAlumnos.length} Alumnos</span>
            <span>•</span>
            <Calendar className="w-4 h-4" />
            <span>{clases.length} Clases</span>
          </div>
        </div>

        {/* Matrix Container */}
        <div className="bg-surface border border-border rounded-3xl overflow-hidden shadow-sm relative">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-surface-hover/50">
                  <th className="sticky left-0 z-20 bg-surface px-6 py-4 font-bold text-xs uppercase tracking-widest text-muted border-r border-border min-w-[250px]">
                    Alumno
                  </th>
                  <th className="px-6 py-4 font-bold text-xs uppercase tracking-widest text-muted text-center border-r border-border min-w-[80px]">
                    % Total
                  </th>
                  {clases.map((clase, i) => (
                    <th key={clase.id} className="px-4 py-4 min-w-[60px] text-center border-r border-border group relative">
                      <div className="flex flex-col items-center">
                        <span className="text-[10px] text-muted font-bold uppercase">{new Date(clase.fecha).toLocaleDateString('es-AR', { month: 'short' })}</span>
                        <span className="text-sm font-bold text-foreground leading-none">{new Date(clase.fecha).toLocaleDateString('es-AR', { day: 'numeric' })}</span>
                      </div>
                      {/* Tooltip for theme */}
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 p-2 bg-foreground text-background text-[10px] rounded pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-30">
                        {clase.tema || `Clase #${i+1}`}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredAlumnos.map((a) => (
                  <tr key={a.id} className="hover:bg-surface-hover/30 transition-colors">
                    <td className="sticky left-0 z-10 bg-surface px-6 py-4 border-r border-border">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary uppercase">
                          {a.apellido_estudiante?.[0]}{a.nombre_estudiante?.[0]}
                        </div>
                        <div className="truncate max-w-[150px]">
                          <p className="text-sm font-bold text-foreground truncate">
                            {a.apellido_estudiante}, {a.nombre_estudiante}
                          </p>
                          <p className="text-[10px] text-muted">{a.dni_estudiante}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center border-r border-border">
                      <span className={`text-xs font-bold ${
                        calculateStudentPercentage(a.id) >= (catedra.porcentaje_asistencia) 
                        ? 'text-success' 
                        : 'text-danger'
                      }`}>
                        {calculateStudentPercentage(a.id)}%
                      </span>
                    </td>
                    {clases.map((clase) => {
                      const record = getAsistenciaRecord(a.id, clase.id)
                      const status = record?.estado || 'ausente'
                      const isException = clase.estado_clase !== 'normal'
                      
                      return (
                        <td key={clase.id} className={`px-4 py-4 text-center border-r border-border group/cell relative ${isException ? 'bg-muted/5' : ''}`}>
                          {isException ? (
                            <div className="flex justify-center">
                              <Minus className="w-3 h-3 text-muted/30" />
                            </div>
                          ) : status === 'presente' ? (
                            <div className="flex flex-col items-center justify-center gap-1">
                              <div className="w-6 h-6 rounded-full bg-success/10 flex items-center justify-center text-success">
                                <Check className="w-3.5 h-3.5" />
                              </div>
                              {clase.latitud && (
                                <div className={`flex items-center gap-0.5 px-1 rounded-sm text-[8px] font-bold ${record.ubicacion_verificada ? 'text-success' : 'text-danger bg-danger/5 animate-pulse'}`}>
                                  <MapPin className="w-2 h-2" />
                                  {record.distancia_m ? `${Math.round(record.distancia_m)}m` : 'Error'}
                                </div>
                              )}
                            </div>
                          ) : status === 'pendiente_inscripcion' ? (
                            <div className="flex justify-center">
                              <div className="w-6 h-6 rounded-full bg-warning/10 flex items-center justify-center text-warning">
                                <Minus className="w-3.5 h-3.5" />
                              </div>
                            </div>
                          ) : (
                            <div className="flex justify-center">
                              <div className="w-6 h-6 rounded-full bg-danger/5 flex items-center justify-center text-danger/30">
                                <XIcon className="w-3.5 h-3.5" />
                              </div>
                            </div>
                          )}
                          
                          {/* Tooltip detail */}
                          {record && (
                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 p-3 bg-foreground text-background text-[10px] rounded-xl pointer-events-none opacity-0 group-hover/cell:opacity-100 transition-opacity whitespace-nowrap z-30 shadow-xl border border-white/10">
                              <p className="font-bold border-b border-white/10 pb-1 mb-1">Registro de Firma</p>
                              <p>Hora: {new Date(record.hora_registro).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}hs</p>
                              {record.distancia_m && <p>Distancia: {Math.round(record.distancia_m)} metros</p>}
                              <p>Estado: <span className={record.ubicacion_verificada ? 'text-success-light' : 'text-danger-light'}>{record.ubicacion_verificada ? '📍 Verificada' : '🚩 Ubicación Lejana'}</span></p>
                            </div>
                          )}
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Legend */}
        <div className="mt-8 flex flex-wrap items-center gap-6 p-4 bg-surface border border-border rounded-2xl text-xs text-muted">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-success/10 flex items-center justify-center text-success">
              <Check className="w-2.5 h-2.5" />
            </div>
            Presente
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-danger/5 flex items-center justify-center text-danger/30">
              <XIcon className="w-2.5 h-2.5" />
            </div>
            Ausente
          </div>
           <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-warning/10 flex items-center justify-center text-warning">
              <Minus className="w-2.5 h-2.5" />
            </div>
            Pendiente de Validación
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-muted/10" />
            Clase con Excepción (Feriado/Paro)
          </div>
        </div>
      </div>
    </div>
  )
}
