'use client'

import { useState, useEffect, use } from 'react'
import { createClient } from '@/lib/supabase/client'
import { 
  ArrowLeft, 
  Calendar, 
  Edit3, 
  Trash2, 
  AlertTriangle,
  Info,
  CheckCircle,
  Loader2,
  CalendarDays,
  Clock
} from 'lucide-react'
import Link from 'next/link'
import { ESTADO_CLASE, TIPO_CLASE } from '@/lib/constants'

export default function CronogramaPage({ params }) {
  const unwrappedParams = use(params)
  const id = unwrappedParams.id
  const [clases, setClases] = useState([])
  const [catedra, setCatedra] = useState(null)
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState(null)
  const [editForm, setEditForm] = useState({})
  
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

    const { data: cl } = await supabase
      .from('clases')
      .select('*')
      .eq('catedra_id', id)
      .order('fecha', { ascending: true })
    
    setClases(cl || [])
    setLoading(false)
  }

  const startEdit = (clase) => {
    setEditingId(clase.id)
    setEditForm({ ...clase })
  }

  const handleUpdate = async () => {
    const { error } = await supabase
      .from('clases')
      .update({
        tema: editForm.tema,
        tipo: editForm.tipo,
        estado_clase: editForm.estado_clase
      })
      .eq('id', editingId)

    if (!error) {
      setEditingId(null)
      fetchData()
    }
  }

  const getStatusBadge = (status) => {
    switch (status) {
      case 'feriado': return <span className="px-2 py-1 rounded-md bg-warning/10 text-warning text-xs font-bold uppercase">Feriado</span>
      case 'asueto': return <span className="px-2 py-1 rounded-md bg-warning/10 text-warning text-xs font-bold uppercase">Asueto</span>
      case 'paro': return <span className="px-2 py-1 rounded-md bg-danger/10 text-danger text-xs font-bold uppercase">Paro</span>
      case 'suspension': return <span className="px-2 py-1 rounded-md bg-danger/10 text-danger text-xs font-bold uppercase">Suspendida</span>
      default: return null
    }
  }

  if (loading) return <div className="p-12 text-center"><Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" /></div>

  return (
    <div className="max-w-5xl mx-auto animate-fade-in pb-20">
      <div className="mb-8">
        <Link
          href={`/docente/catedras/${id}`}
          className="inline-flex items-center gap-2 text-sm text-muted hover:text-foreground transition-colors mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver a la cátedra
        </Link>
        <h1 className="text-3xl font-bold text-foreground">Cronograma de Clases</h1>
        <p className="text-muted text-sm mt-1">
          {catedra?.nombre} · Gestioná temas y excepciones del calendario.
        </p>
      </div>

      <div className="space-y-4">
        {clases.length === 0 ? (
          <div className="p-16 text-center bg-surface border border-dashed border-border rounded-3xl">
            <CalendarDays className="w-12 h-12 text-muted mx-auto mb-4" />
            <p className="text-muted">No hay clases registradas aún. Se crean automáticamente al proyectar el QR.</p>
          </div>
        ) : (
          clases.map((clase, i) => (
            <div 
              key={clase.id} 
              className={`bg-surface border border-border rounded-2xl p-6 transition-all ${editingId === clase.id ? 'ring-2 ring-primary/50 border-primary/50' : 'hover:border-primary/20'}`}
            >
              {editingId === clase.id ? (
                <div className="space-y-4 animate-fade-in">
                  <div className="flex items-center gap-4 text-sm font-bold text-primary mb-2">
                    <Clock className="w-4 h-4" />
                    Editando clase del {new Date(clase.fecha).toLocaleDateString()}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-muted uppercase mb-1.5">Tema de la clase</label>
                      <input 
                        type="text"
                        value={editForm.tema}
                        onChange={(e) => setEditForm({...editForm, tema: e.target.value})}
                        className="w-full px-4 py-2.5 bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-muted uppercase mb-1.5">Tipo</label>
                        <select 
                          value={editForm.tipo}
                          onChange={(e) => setEditForm({...editForm, tipo: e.target.value})}
                          className="w-full px-4 py-2.5 bg-background border border-border rounded-xl focus:outline-none"
                        >
                          {Object.entries(TIPO_CLASE).map(([k, v]) => <option key={k} value={v}>{v}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-muted uppercase mb-1.5">Estado</label>
                        <select 
                          value={editForm.estado_clase}
                          onChange={(e) => setEditForm({...editForm, estado_clase: e.target.value})}
                          className="w-full px-4 py-2.5 bg-background border border-border rounded-xl focus:outline-none"
                        >
                          {Object.entries(ESTADO_CLASE).map(([k, v]) => <option key={k} value={v}>{v}</option>)}
                        </select>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-end gap-3 mt-4">
                    <button onClick={() => setEditingId(null)} className="px-4 py-2 text-sm font-medium text-muted hover:text-foreground">Cancelar</button>
                    <button onClick={handleUpdate} className="px-6 py-2 bg-primary text-white text-sm font-bold rounded-xl hover:shadow-lg transition-all">Guardar Cambios</button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-background flex flex-col items-center justify-center border border-border">
                      <span className="text-[10px] font-bold text-muted uppercase tracking-tighter leading-none">
                        {new Date(clase.fecha).toLocaleDateString('es-AR', { month: 'short' })}
                      </span>
                      <span className="text-xl font-bold text-foreground leading-none mt-1">
                        {new Date(clase.fecha).toLocaleDateString('es-AR', { day: 'numeric' })}
                      </span>
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-bold text-foreground">
                          {clase.tema || `Clase #${i + 1}`}
                        </h3>
                        {getStatusBadge(clase.estado_clase)}
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted">
                        <span className="capitalize">{clase.tipo.replace('_', '-')}</span>
                        <span>•</span>
                        <span>{new Date(clase.fecha).toLocaleDateString('es-AR', { weekday: 'long' })}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => startEdit(clase)}
                      className="p-2.5 text-muted hover:text-primary hover:bg-primary/5 rounded-xl transition-all"
                    >
                      <Edit3 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      <div className="mt-12 p-6 bg-surface border-2 border-dashed border-border rounded-3xl text-center">
        <Info className="w-6 h-6 text-muted mx-auto mb-3" />
        <h3 className="font-bold text-foreground mb-1">Sobre las excepciones</h3>
        <p className="text-sm text-muted max-w-md mx-auto">
          Marcar una clase como Feriado, Asueto o Paro evitará que las inasistencias de ese día cuenten negativamente para el porcentaje de los alumnos.
        </p>
      </div>
    </div>
  )
}
