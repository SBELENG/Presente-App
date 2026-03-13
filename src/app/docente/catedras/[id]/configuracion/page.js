'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { ArrowLeft, Save, Loader2, Trash2, AlertCircle } from 'lucide-react'
import { DIAS_SEMANA, TIPO_CLASE } from '@/lib/constants'
import Link from 'next/link'

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

  const toggleDia = (dia) => {
    setForm((prev) => ({
      ...prev,
      dias_clase: prev.dias_clase.includes(dia)
        ? prev.dias_clase.filter((d) => d !== dia)
        : [...prev.dias_clase, dia],
    }))
  }

  const handleSave = async () => {
    setSaving(true)
    setError(null)
    const { error: err } = await supabase
      .from('catedras')
      .update(form)
      .eq('id', id)
    
    if (err) setError(err.message)
    else {
      router.refresh()
      router.push(`/docente/catedras/${id}`)
    }
    setSaving(false)
  }

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

      <div className="space-y-8">
        {/* Section: Basic Info */}
        <section className="bg-surface border border-border rounded-3xl p-6 md:p-8">
          <h2 className="text-lg font-bold text-foreground mb-6">Información General</h2>
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Nombre</label>
              <input type="text" value={form.nombre} onChange={(e) => updateForm('nombre', e.target.value)} className="w-full px-4 py-2.5 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary outline-none" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Código</label>
                <input type="text" value={form.codigo} onChange={(e) => updateForm('codigo', e.target.value)} className="w-full px-4 py-2.5 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary outline-none" />
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
                <input type="number" step="0.5" value={form.nota_promocion} onChange={(e) => updateForm('nota_promocion', e.target.value)} className="w-full px-4 py-2.5 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary outline-none" />
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
          <Link href={`/docente/catedras/${id}`} className="px-6 py-3 bg-white border border-border text-foreground font-bold rounded-2xl">Cancelar</Link>
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
    </div>
  )
}
