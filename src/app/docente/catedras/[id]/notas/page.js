'use client'

import { useState, useEffect, use } from 'react'
import { createClient } from '@/lib/supabase/client'
import { 
  ArrowLeft, 
  Search, 
  Save, 
  Loader2, 
  ChevronRight,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  GraduationCap
} from 'lucide-react'
import Link from 'next/link'
import { TIPO_NOTA } from '@/lib/constants'

export default function NotasPage({ params }) {
  const unwrappedParams = use(params)
  const id = unwrappedParams.id
  const [catedra, setCatedra] = useState(null)
  const [alumnos, setAlumnos] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedAlumno, setSelectedAlumno] = useState(null)
  const [notasAlumno, setNotasAlumno] = useState([])
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState(null)

  const supabase = createClient()

  useEffect(() => {
    fetchData()
  }, [id])

  const fetchData = async () => {
    setLoading(true)
    const { data: cat } = await supabase
      .from('catedras')
      .select('*')
      .eq('id', id)
      .single()
    setCatedra(cat)

    const { data: insc } = await supabase
      .from('inscripciones')
      .select('*')
      .eq('catedra_id', id)
      .order('apellido_estudiante', { ascending: true })
    
    setAlumnos(insc || [])
    setLoading(false)
  }

  const selectAlumno = async (alumno) => {
    setSelectedAlumno(alumno)
    setMessage(null)
    const { data: notas } = await supabase
      .from('notas')
      .select('*')
      .eq('inscripcion_id', alumno.id)
    
    setNotasAlumno(notas || [])
  }

  const handleUpdateNota = (tipo, valor) => {
    setNotasAlumno(prev => {
      const exists = prev.find(n => n.tipo === tipo)
      if (exists) {
        return prev.map(n => n.tipo === tipo ? { ...n, valor: parseFloat(valor) } : n)
      } else {
        return [...prev, { inscripcion_id: selectedAlumno.id, catedra_id: id, tipo, valor: parseFloat(valor) }]
      }
    })
  }

  const saveNotas = async () => {
    setSaving(true)
    setMessage(null)

    const { error } = await supabase
      .from('notas')
      .upsert(notasAlumno.map(n => ({
        ...n,
        inscripcion_id: selectedAlumno.id,
        catedra_id: id
      })), { onConflict: 'inscripcion_id, catedra_id, tipo' })

    if (error) {
      setMessage({ type: 'error', text: 'Error al guardar las notas.' })
    } else {
      setMessage({ type: 'success', text: 'Notas guardadas con éxito.' })
      setTimeout(() => setMessage(null), 3000)
    }
    setSaving(false)
  }

  const filteredAlumnos = alumnos.filter(a => 
    `${a.nombre_estudiante} ${a.apellido_estudiante} ${a.dni_estudiante}`
      .toLowerCase()
      .includes(searchTerm.toLowerCase())
  )

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
        <h1 className="text-3xl font-bold text-foreground">Carga de Notas</h1>
        <p className="text-muted text-sm mt-1">
          {catedra?.nombre} · Gestioná las calificaciones de tus estudiantes.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: List of students */}
        <div className="lg:col-span-1 space-y-4">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted" />
            <input
              type="text"
              placeholder="Buscar alumno..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-surface border border-border rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
            />
          </div>
          <div className="bg-surface border border-border rounded-3xl overflow-hidden max-h-[600px] overflow-y-auto">
            <div className="divide-y divide-border">
              {filteredAlumnos.map((a) => (
                <button
                  key={a.id}
                  onClick={() => selectAlumno(a)}
                  className={`w-full text-left p-4 hover:bg-surface-hover transition-colors flex items-center justify-between group ${
                    selectedAlumno?.id === a.id ? 'bg-primary/5 border-l-4 border-l-primary' : ''
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${
                      selectedAlumno?.id === a.id ? 'bg-primary text-white' : 'bg-primary/10 text-primary'
                    }`}>
                      {a.apellido_estudiante?.[0]}{a.nombre_estudiante?.[0]}
                    </div>
                    <div>
                      <p className="font-bold text-foreground text-sm leading-tight">
                        {a.apellido_estudiante}, {a.nombre_estudiante}
                      </p>
                      <p className="text-xs text-muted mt-1">{a.dni_estudiante}</p>
                    </div>
                  </div>
                  <ChevronRight className={`w-4 h-4 transition-all ${
                    selectedAlumno?.id === a.id ? 'text-primary translate-x-1' : 'text-muted group-hover:translate-x-1'
                  }`} />
                </button>
              ))}
              {filteredAlumnos.length === 0 && (
                <div className="p-8 text-center text-muted text-sm">No se encontraron alumnos.</div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Grade input area */}
        <div className="lg:col-span-2">
          {selectedAlumno ? (
            <div className="bg-surface border border-border rounded-3xl p-8 shadow-sm animate-fade-in">
              <div className="flex items-center justify-between mb-8 pb-6 border-b border-border">
                <div className="flex items-center gap-4">
                   <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary text-2xl font-bold">
                    {selectedAlumno.apellido_estudiante?.[0]}{selectedAlumno.nombre_estudiante?.[0]}
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-foreground">
                      {selectedAlumno.apellido_estudiante}, {selectedAlumno.nombre_estudiante}
                    </h2>
                    <p className="text-muted">DNI: {selectedAlumno.dni_estudiante}</p>
                  </div>
                </div>
                {message && (
                  <div className={`px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-2 animate-fade-in ${
                    message.type === 'success' ? 'bg-success/10 text-success' : 'bg-danger/10 text-danger'
                  }`}>
                    {message.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                    {message.text}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Partial Grades */}
                <div className="space-y-6">
                  <h3 className="text-sm font-bold text-muted uppercase tracking-widest flex items-center gap-2">
                    <GraduationCap className="w-4 h-4" />
                    Parciales
                  </h3>
                  {[...Array(catedra.cant_parciales || 2)].map((_, i) => {
                    const tipo = `parcial_${i + 1}`
                    const nota = notasAlumno.find(n => n.tipo === tipo)?.valor || ''
                    return (
                      <div key={tipo}>
                        <label className="block text-sm font-medium text-foreground mb-2">
                          Parcial {i + 1}
                        </label>
                        <input
                          type="number"
                          min="0"
                          max="10"
                          step="0.01"
                          value={nota}
                          onChange={(e) => handleUpdateNota(tipo, e.target.value)}
                          placeholder="Nota (0-10)"
                          className="w-full px-4 py-3 bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary transition-all text-lg font-mono"
                        />
                      </div>
                    )
                  })}
                </div>

                {/* Others */}
                <div className="space-y-6">
                  <h3 className="text-sm font-bold text-muted uppercase tracking-widest flex items-center gap-2">
                    <Save className="w-4 h-4" />
                    Complementarias
                  </h3>
                  {catedra.cant_recuperatorios > 0 && [...Array(catedra.cant_recuperatorios)].map((_, i) => {
                    const tipo = `recuperatorio_${i + 1}`
                    return (
                      <div key={tipo}>
                        <label className="block text-sm font-medium text-foreground mb-2">
                          Recuperatorio {catedra.cant_recuperatorios > 1 ? i + 1 : ''}
                        </label>
                        <input
                          type="number"
                          min="0"
                          max="10"
                          step="0.01"
                          value={notasAlumno.find(n => n.tipo === tipo)?.valor || ''}
                          onChange={(e) => handleUpdateNota(tipo, e.target.value)}
                          placeholder="Nota (0-10)"
                          className="w-full px-4 py-3 bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary transition-all text-lg font-mono"
                        />
                      </div>
                    )
                  })}
                  {catedra.tiene_tp_evaluable && [...Array(Math.max(1, catedra.cant_tps || 0))].map((_, i) => {
                    const tipo = `tp_${i + 1}`
                    return (
                      <div key={tipo}>
                        <label className="block text-sm font-medium text-foreground mb-2">
                          Trabajo Práctico {catedra.cant_tps > 1 ? i + 1 : ''}
                        </label>
                        <input
                          type="number"
                          min="0"
                          max="10"
                          step="0.01"
                          value={notasAlumno.find(n => n.tipo === tipo)?.valor || ''}
                          onChange={(e) => handleUpdateNota(tipo, e.target.value)}
                          placeholder="Nota (0-10)"
                          className="w-full px-4 py-3 bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary transition-all text-lg font-mono"
                        />
                      </div>
                    )
                  })}
                </div>
              </div>

              <div className="mt-12 flex justify-end">
                <button
                  onClick={saveNotas}
                  disabled={saving}
                  className="px-8 py-4 bg-primary text-white font-bold rounded-2xl hover:shadow-xl hover:shadow-primary/25 transition-all flex items-center gap-3 disabled:opacity-50"
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Guardando...
                    </>
                  ) : (
                    <>
                      <Save className="w-5 h-5" />
                      Guardar Notas
                    </>
                  )}
                </button>
              </div>
            </div>
          ) : (
            <div className="h-full min-h-[400px] flex flex-col items-center justify-center bg-surface border-2 border-dashed border-border rounded-3xl p-12 text-center text-muted">
              <GraduationCap className="w-16 h-16 mb-4 opacity-20" />
              <p className="text-lg font-medium mb-1">Ningún alumno seleccionado</p>
              <p className="text-sm max-w-xs">Seleccioná un alumno de la lista de la izquierda para cargar o editar sus calificaciones.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
