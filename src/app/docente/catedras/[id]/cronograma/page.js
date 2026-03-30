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
import { generarFechas } from '@/lib/academic-logic'

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
      .select('*, asistencias(id)')
      .eq('catedra_id', id)
      .order('fecha', { ascending: true })
    
    // FILTRAR CLASES: Solo mostrar si es día de clase O tiene asistencias O es estado normal
    const DIAS_MAP = { lunes: 1, martes: 2, miercoles: 3, jueves: 4, viernes: 5, sabado: 6, domingo: 0 }
    
    // Días de teoría
    const diasTeo = (cat.dias_clase || []).map(d => DIAS_MAP[d])
    
    // Días de práctica (si no hay definidos y es rotativa, son Lun-Sab)
    let diasPrac = (cat.dias_practica && cat.dias_practica.length > 0)
      ? cat.dias_practica.map(d => DIAS_MAP[d])
      : (cat.agenda_rota_practicas ? [1,2,3,4,5,6] : diasTeo)

    const diasValidos = [...new Set([...diasTeo, ...diasPrac])]

    const filteredClases = (cl || []).filter(c => {
      if (c.asistencias && c.asistencias.length > 0) return true
      if (c.estado_clase === 'normal') return true
      
      const d = new Date(c.fecha + 'T12:00:00').getDay()
      
      // Nunca mostrar domingos si no tienen asistencia o no es estado normal
      if (d === 0) return false
      
      // Mostrar solo si el día de la semana coincide con la planificación
      return diasValidos.includes(d)
    })
    
    setClases(filteredClases)
    setLoading(false)
  }

  const startEdit = (clase) => {
    setEditingId(clase.id)
    setEditForm({ ...clase })
  }

  const handleUpdate = async () => {
    setLoading(true)
    const { id: editId, fecha, tema, tipo, estado_clase } = editForm
    
    let error = null
    if (editId) {
      // Actualizar existente
      const { error: err } = await supabase
        .from('clases')
        .update({ tema, tipo, estado_clase })
        .eq('id', editId)
      error = err
    } else {
      // Crear nueva (Planificación)
      const { error: err } = await supabase
        .from('clases')
        .insert({
          catedra_id: id,
          fecha,
          tema,
          tipo: tipo || 'teorico_practica',
          estado_clase: 'normal'
        })
      error = err
    }

    if (!error) {
      setEditingId(null)
      fetchData()
    } else {
      console.error(error)
      setLoading(false)
    }
  }

  // Lógica de Render 
  const displayDates = (() => {
    if (!catedra) return []
    
    // 1. Generar todas las fechas del calendario programado
    const dTeo = generarFechas(catedra.fecha_inicio, catedra.fecha_fin, catedra.dias_clase || [])
    
    let dPrac = []
    if (catedra.agenda_rota_practicas) {
      dPrac = generarFechas(catedra.fecha_inicio_practica || catedra.fecha_inicio, catedra.fecha_fin_practica || catedra.fecha_fin, [1,2,3,4,5,6].map(n => ['domingo','lunes','martes','miercoles','jueves','viernes','sabado'][n]))
    } else if (catedra.dias_practica && catedra.dias_practica.length > 0) {
      dPrac = generarFechas(catedra.fecha_inicio_practica || catedra.fecha_inicio, catedra.fecha_fin_practica || catedra.fecha_fin, catedra.dias_practica)
    }

    const allPlanDates = [...new Set([...dTeo, ...dPrac].map(f => f.toISOString().split('T')[0]))].sort()

    // 2. Mezclar con clases reales en DB y filtrar feriados
    return allPlanDates.map(fStr => {
      const dbClase = clases.find(c => c.fecha === fStr)
      if (dbClase && dbClase.estado_clase !== 'normal') return null // OCULTAR FERIADOS/ASUETOS
      return {
        id: dbClase?.id || null,
        fecha: fStr,
        tema: dbClase?.tema || '',
        tipo: dbClase?.tipo || (dTeo.some(f => f.toISOString().split('T')[0] === fStr) ? 'teorica' : 'practica'),
        estado_clase: dbClase?.estado_clase || 'normal'
      }
    }).filter(d => d !== null)
  })()

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
        {displayDates.length === 0 ? (
          <div className="p-16 text-center bg-surface border border-dashed border-border rounded-3xl">
            <CalendarDays className="w-12 h-12 text-muted mx-auto mb-4" />
            <p className="text-muted">No se encontraron fechas de clase programadas.</p>
          </div>
        ) : (
          displayDates.map((clase, i) => {
            const isEditing = editingId === (clase.id || clase.fecha)
            return (
              <div 
                key={clase.id || clase.fecha} 
                className={`bg-surface border border-border rounded-2xl p-6 transition-all ${isEditing ? 'ring-2 ring-primary/50 border-primary/50' : 'hover:border-primary/20'}`}
              >
                {isEditing ? (
                  <div className="space-y-4 animate-fade-in">
                    <div className="flex items-center gap-4 text-sm font-bold text-primary mb-2">
                      <Clock className="w-4 h-4" />
                      Planificando clase del {new Date(clase.fecha + 'T12:00:00').toLocaleDateString()}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-muted uppercase mb-1.5">Tema de la clase</label>
                        <input 
                          type="text"
                          autoFocus
                          value={editForm.tema}
                          onChange={(e) => setEditForm({...editForm, tema: e.target.value})}
                          placeholder="Ej: Unidad 1: Introducción..."
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
                          <div className="px-4 py-2.5 bg-background border border-border rounded-xl opacity-60 text-sm">
                            Habilitada
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center justify-end gap-3 mt-4">
                      <button onClick={() => setEditingId(null)} className="px-4 py-2 text-sm font-medium text-muted hover:text-foreground">Cancelar</button>
                      <button onClick={handleUpdate} className="px-6 py-2 bg-primary text-white text-sm font-bold rounded-xl hover:shadow-lg transition-all">
                        {clase.id ? 'Actualizar Tema' : 'Guardar en Planificación'}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-xl bg-background flex flex-col items-center justify-center border border-border">
                        <span className="text-[10px] font-bold text-muted uppercase tracking-tighter leading-none">
                          {new Date(clase.fecha + 'T12:00:00').toLocaleDateString('es-AR', { month: 'short' })}
                        </span>
                        <span className="text-xl font-bold text-foreground leading-none mt-1">
                          {new Date(clase.fecha + 'T12:00:00').toLocaleDateString('es-AR', { day: 'numeric' })}
                        </span>
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className={`font-bold ${clase.tema ? 'text-foreground' : 'text-muted italic'}`}>
                            {clase.tema || `Cargar tema de clase...`}
                          </h3>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-muted">
                          <span className="capitalize">{clase.tipo.replace('_', '-')}</span>
                          <span>•</span>
                          <span className="capitalize">{new Date(clase.fecha + 'T12:00:00').toLocaleDateString('es-AR', { weekday: 'long' })}</span>
                          {!clase.id && <span className="px-2 py-0.5 rounded-full bg-primary/5 text-primary text-[10px] font-bold">Sin registrar</span>}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => {
                          setEditingId(clase.id || clase.fecha)
                          setEditForm({...clase})
                        }}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${clase.tema ? 'bg-surface border border-border text-muted hover:text-primary' : 'bg-primary/10 text-primary hover:bg-primary/20'}`}
                      >
                        <Edit3 className="w-4 h-4" />
                        {clase.tema ? 'Editar' : 'Cargar Plan'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )
          })
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
