'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { ArrowLeft, Save, Loader2, Trash2, AlertCircle, Plus, ArrowUp, ArrowDown } from 'lucide-react'
import { DIAS_SEMANA, TIPO_CLASE } from '@/lib/constants'
import Link from 'next/link'

const PALETTE = [
  '#4F46E5', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4', '#6366F1'
]

export default function ConfigCatedraPage({ params }) {
  const unwrappedParams = use(params)
  const id = unwrappedParams.id
  const router = useRouter()
  const [form, setForm] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  const supabase = createClient()

  useEffect(() => {
    fetchData()
  }, [id])

  const fetchData = async () => {
    const { data } = await supabase
      .from('catedras')
      .select('*')
      .eq('id', id)
      .single()
    if (data) setForm(data)
    setLoading(false)
  }

  const updateForm = (field, value) =>
    setForm((prev) => ({ ...prev, [field]: value }))

  const toggleDia = (dia) =>
    setForm((prev) => ({
      ...prev,
      dias_clase: prev.dias_clase.includes(dia)
        ? prev.dias_clase.filter((d) => d !== dia)
        : [...prev.dias_clase, dia],
    }))

  const toggleDiaPractica = (dia) =>
    setForm((prev) => ({
      ...prev,
      dias_practica: (prev.dias_practica || []).includes(dia)
        ? (prev.dias_practica || []).filter((d) => d !== dia)
        : [...(prev.dias_practica || []), dia],
    }))

  const handleSave = async () => {
    setSaving(true)
    setError(null)
    
    // Sanitize dates: convert empty strings to null to avoid postgres date cast errors
    const dataToSave = { ...form }
    if (dataToSave.fecha_inicio === '') dataToSave.fecha_inicio = null
    if (dataToSave.fecha_fin === '') dataToSave.fecha_fin = null
    if (dataToSave.fecha_inicio_practica === '') dataToSave.fecha_inicio_practica = null
    if (dataToSave.fecha_fin_practica === '') dataToSave.fecha_fin_practica = null

    const { error: err } = await supabase
      .from('catedras')
      .update(dataToSave)
      .eq('id', id)
    
    if (err) {
      console.error("Save error:", err)
      setError(err.message)
    } else {
      router.refresh()
      router.push(`/docente/catedras/${id}`)
    }
    setSaving(false)
  }

  const addComision = () => {
    updateForm('comisiones_division', [
      ...(form.comisiones_division || []),
      { 
        nombre: `Comisión ${(form.comisiones_division || []).length + 1}`, 
        desde: 'A', 
        hasta: 'Z', 
        color: PALETTE[(form.comisiones_division || []).length % PALETTE.length],
        dias: [],
        fechas: [],
        turno: 'mañana'
      }
    ])
  }

  const removeComision = (index) => {
    updateForm('comisiones_division', (form.comisiones_division || []).filter((_, i) => i !== index))
  }

  const updateComision = (index, field, value) => {
    const newComisiones = [...(form.comisiones_division || [])]
    newComisiones[index][field] = field === 'turno' ? value : value.toUpperCase()
    updateForm('comisiones_division', newComisiones)
  }

  const scrollToTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });
  const scrollToBottom = () => window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });

  const handleDelete = async () => {
    if (!confirm('¿Seguro quieres eliminar esta cátedra? Se perderán todos los datos, clases, alumnos y notas asociados.')) return
    const { error: err } = await supabase.from('catedras').delete().eq('id', id)
    if (!err) router.push('/docente/catedras')
  }

  if (loading || !form) return <div className="p-12 text-center"><Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" /></div>

  return (
    <div className="max-w-3xl mx-auto animate-fade-in pb-20">
      <div className="mb-8">
        <Link
          href={`/docente/catedras/${id}`}
          className="inline-flex items-center gap-2 text-sm text-muted hover:text-foreground transition-colors mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver a la cátedra
        </Link>
        <h1 className="text-2xl font-bold text-foreground">Configuración de Cátedra</h1>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-danger/10 border border-danger/20 rounded-2xl flex items-center gap-3 text-danger">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <p className="text-sm font-medium">{error}</p>
        </div>
      )}

      <div className="space-y-8">
        {/* Section: Basic Info */}
        <section className="bg-surface border border-border rounded-3xl p-6 md:p-8">
          <h2 className="text-lg font-bold text-foreground mb-6">Información General</h2>
          <div className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Institución</label>
                <input type="text" value={form.institucion || ''} onChange={(e) => updateForm('institucion', e.target.value)} className="w-full px-4 py-2.5 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Facultad</label>
                <input type="text" value={form.facultad || ''} onChange={(e) => updateForm('facultad', e.target.value)} className="w-full px-4 py-2.5 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary outline-none" />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Carrera</label>
                <input type="text" value={form.carrera || ''} onChange={(e) => updateForm('carrera', e.target.value)} className="w-full px-4 py-2.5 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Comisión <span className="text-muted font-normal text-xs">(general)</span></label>
                <input type="text" value={form.comision || ''} onChange={(e) => updateForm('comision', e.target.value)} className="w-full px-4 py-2.5 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary outline-none" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Nombre (Materia)</label>
              <input type="text" value={form.nombre || ''} onChange={(e) => updateForm('nombre', e.target.value)} className="w-full px-4 py-2.5 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary outline-none" />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Código</label>
                <input type="text" value={form.codigo || ''} onChange={(e) => updateForm('codigo', e.target.value)} className="w-full px-4 py-2.5 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Cuatrimestre</label>
                <select value={form.cuatrimestre} onChange={(e) => updateForm('cuatrimestre', e.target.value)} className="w-full px-4 py-2.5 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary outline-none">
                  <option value="1">1° Cuatrimestre</option>
                  <option value="2">2° Cuatrimestre</option>
                  <option value="0">Anual</option>
                </select>
              </div>
            </div>
          </div>
        </section>

        {/* Section: Calendario y Días */}
        <section className="bg-surface border border-border rounded-3xl p-6 md:p-8">
          <h2 className="text-lg font-bold text-foreground mb-6">Calendario y Días de Cursada</h2>
          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-muted uppercase mb-2">Fecha Inicio</label>
                <input type="date" value={form.fecha_inicio || ''} onChange={e => updateForm('fecha_inicio', e.target.value)} className="w-full px-4 py-2.5 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary outline-none text-sm" />
              </div>
              <div>
                <label className="block text-xs font-bold text-muted uppercase mb-2">Fecha Fin</label>
                <input type="date" value={form.fecha_fin || ''} onChange={e => updateForm('fecha_fin', e.target.value)} className="w-full px-4 py-2.5 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary outline-none text-sm" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-muted uppercase mb-2">Días de Teoría</label>
              <div className="flex flex-wrap gap-2">
                {[{v:'lunes',l:'L'},{v:'martes',l:'M'},{v:'miercoles',l:'X'},{v:'jueves',l:'J'},{v:'viernes',l:'V'},{v:'sabado',l:'S'}].map(d => (
                  <button key={d.v} type="button" onClick={() => toggleDia(d.v)}
                    className={`w-9 h-9 rounded-xl text-xs font-black transition-all border-2 ${form.dias_clase?.includes(d.v) ? 'bg-primary text-white border-primary shadow-md' : 'bg-background text-muted border-border'}`}
                  >{d.l}</button>
                ))}
              </div>
            </div>
            {form.agenda_rota_practicas && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-muted uppercase mb-2">Inicio Práctica</label>
                    <input type="date" value={form.fecha_inicio_practica || ''} onChange={e => updateForm('fecha_inicio_practica', e.target.value)} className="w-full px-4 py-2.5 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary outline-none text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-muted uppercase mb-2">Fin Práctica</label>
                    <input type="date" value={form.fecha_fin_practica || ''} onChange={e => updateForm('fecha_fin_practica', e.target.value)} className="w-full px-4 py-2.5 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary outline-none text-sm" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-accent uppercase mb-2">
                    Días de Práctica
                    <span className="text-muted normal-case font-normal ml-2">(vacío = semana completa Lun–Sab)</span>
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {[{v:'lunes',l:'L'},{v:'martes',l:'M'},{v:'miercoles',l:'X'},{v:'jueves',l:'J'},{v:'viernes',l:'V'},{v:'sabado',l:'S'}].map(d => (
                      <button key={d.v} type="button" onClick={() => toggleDiaPractica(d.v)}
                        className={`w-9 h-9 rounded-xl text-xs font-black transition-all border-2 ${(form.dias_practica || []).includes(d.v) ? 'bg-accent text-white border-accent shadow-md' : 'bg-background text-muted border-border'}`}
                      >{d.l}</button>
                    ))}
                  </div>
                  <p className="text-[10px] text-muted mt-1.5">
                    {(form.dias_practica || []).length === 0
                      ? '⚡ Con prácticas de semana completa, dejá esto vacío (Lun-Sab habilitados automáticamente)'
                      : (form.dias_practica || []).map(d => d.charAt(0).toUpperCase() + d.slice(1)).join(', ')
                    }
                  </p>
                </div>
              </>
            )}
          </div>
        </section>

        {/* Section: Comisiones de Prácticas */}
        {(form.tipo_clase?.includes('practica') || form.tipo_clase?.includes('teorico_practica') || form.tipo_clase === 'practica' || form.tipo_clase === 'teorico_practica') && (
          <section className="bg-surface border border-border rounded-3xl p-6 md:p-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-foreground">Comisiones de Prácticas</h2>
              <button type="button" onClick={addComision} className="flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 text-primary text-[11px] font-bold rounded-lg"><Plus className="w-3 h-3" /> Agregar Comisión</button>
            </div>
            <div className="space-y-3">
              {(form.comisiones_division || []).map((com, idx) => (
                <div key={idx} className="p-4 bg-background border border-border rounded-2xl grid grid-cols-1 md:grid-cols-6 gap-3 items-end">
                  <div className="md:col-span-2">
                     <label className="text-[9px] font-bold text-muted uppercase ml-1">Nombre</label>
                     <input type="text" value={com.nombre} onChange={e=>updateComision(idx, 'nombre', e.target.value)} className="w-full px-3 py-2 bg-surface border rounded-lg text-xs focus:ring-1 focus:ring-primary outline-none" />
                  </div>
                  <div>
                     <label className="text-[9px] font-bold text-muted uppercase ml-1">Desde</label>
                     <input type="text" maxLength={1} value={com.desde} onChange={e=>updateComision(idx, 'desde', e.target.value)} className="w-full px-3 py-2 bg-surface border rounded-lg text-xs text-center font-bold focus:ring-1 focus:ring-primary outline-none" />
                  </div>
                  <div>
                     <label className="text-[9px] font-bold text-muted uppercase ml-1">Hasta</label>
                     <input type="text" maxLength={1} value={com.hasta} onChange={e=>updateComision(idx, 'hasta', e.target.value)} className="w-full px-3 py-2 bg-surface border rounded-lg text-xs text-center font-bold focus:ring-1 focus:ring-primary outline-none" />
                  </div>
                  <div>
                     <label className="text-[9px] font-bold text-muted uppercase ml-1">Turno</label>
                     <select value={com.turno} onChange={e=>updateComision(idx, 'turno', e.target.value)} className="w-full px-2 py-2 bg-surface border rounded-lg text-[10px] font-bold focus:ring-1 focus:ring-primary outline-none">
                        <option value="mañana">Mañana</option>
                        <option value="tarde">Tarde</option>
                     </select>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                     <div className="flex gap-1">
                        {PALETTE.slice(0,4).map(c=>(<button type="button" key={c} onClick={()=>updateComision(idx,'color',c)} className={`w-3.5 h-3.5 rounded-full ${com.color === c ? 'ring-2 ring-primary scale-110' : 'opacity-40'}`} style={{backgroundColor:c}} />))}
                     </div>
                     <button type="button" onClick={()=>removeComision(idx)} className="text-muted hover:text-danger p-1"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </div>
              ))}
              {(form.comisiones_division || []).length === 0 && (
                <p className="text-sm text-muted italic">No hay comisiones configuradas. Los alumnos no serán divididos por apellido.</p>
              )}
            </div>
          </section>
        )}

        {/* Section: Rules */}
        <section className="bg-surface border border-border rounded-3xl p-6 md:p-8">
          <h2 className="text-lg font-bold text-foreground mb-6">Reglas Académicas</h2>
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-foreground text-sm">¿Es promocional?</p>
                <p className="text-xs text-muted">Aprobación sin final</p>
              </div>
              <button 
                onClick={() => updateForm('es_promocional', !form.es_promocional)}
                className={`w-10 h-5 rounded-full transition-colors relative ${form.es_promocional ? 'bg-primary' : 'bg-muted/30'}`}
              >
                <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-all ${form.es_promocional ? 'right-0.5' : 'left-0.5'}`} />
              </button>
            </div>
            {form.es_promocional && (
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Nota Promoción</label>
                <input type="number" step="0.5" value={form.nota_promocion_minima || ''} onChange={(e) => updateForm('nota_promocion_minima', parseFloat(e.target.value) || 0)} className="w-full px-4 py-2.5 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary outline-none" />
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">% Asistencia Requerida</label>
              <input type="range" min="0" max="100" step="5" value={form.porcentaje_asistencia} onChange={(e) => updateForm('porcentaje_asistencia', e.target.value)} className="w-full accent-primary" />
              <p className="text-right font-bold text-primary mt-1">{form.porcentaje_asistencia}%</p>
            </div>
          </div>
        </section>

        {/* Section: Danger Zone */}
        <section className="bg-danger/5 border border-danger/20 rounded-3xl p-6 md:p-8">
          <h2 className="text-lg font-bold text-danger mb-2">Zona de Peligro</h2>
          <p className="text-sm text-danger/70 mb-6">Estas acciones son irreversibles.</p>
          <button 
            onClick={handleDelete}
            className="flex items-center gap-2 px-6 py-3 bg-danger text-white text-sm font-bold rounded-xl hover:opacity-90 transition-all"
          >
            <Trash2 className="w-4 h-4" />
            Eliminar Cátedra
          </button>
        </section>

        {/* Save Bar */}
        <div className="flex items-center justify-end gap-3 sticky bottom-8 z-20">
          <Link href={`/docente/catedras/${id}`} className="px-6 py-3 bg-surface border border-border hover:bg-surface-hover text-foreground font-bold rounded-2xl transition-all">Cancelar</Link>
          <button 
            onClick={handleSave} 
            disabled={saving}
            className="px-8 py-3 bg-primary text-white font-bold rounded-2xl shadow-xl shadow-primary/20 hover:-translate-y-0.5 transition-all flex items-center gap-2"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Guardar Cambios
          </button>
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
