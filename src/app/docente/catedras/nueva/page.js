'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { ArrowLeft, ArrowRight, Check, BookOpen, Calendar, Settings, ClipboardList, Plus, Trash2, Printer } from 'lucide-react'
import { DIAS_SEMANA } from '@/lib/constants'
import Link from 'next/link'

const STEPS = [
  { id: 1, label: 'Datos académicos', icon: BookOpen },
  { id: 2, label: 'Calendario', icon: Calendar },
  { id: 3, label: 'Condiciones', icon: Settings },
  { id: 4, label: 'Evaluaciones', icon: ClipboardList },
]

const PALETTE = [
  '#4F46E5', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4', '#6366F1'
]

const initialForm = {
  nombre: '',
  codigo: '',
  carrera: '',
  facultad: '',
  institucion: 'UNRC',
  anio: '',
  cuatrimestre: '1',
  comision: '',
  tipo_clase: ['teorica', 'practica'],
  fecha_inicio: '',
  fecha_fin: '',
  dias_clase: [],
  es_promocional: false,
  nota_promocion_minima: 6,
  nota_promocion_promedio: 7,
  nota_regularizacion: 5,
  porcentaje_asistencia: 80,
  cant_parciales: 2,
  cant_recuperatorios: 1,
  tiene_tp_evaluable: false,
  cant_tps: 0,
  tipo_promocion: 'directa',
  criterio_promocion: 'ambos',
  permite_recuperatorio_promocion: false,
  metodo_tp: ['separado'], // array para soporte múltiple
  cant_tps_separados: 0,
  cant_tps_con_parciales: 0,
  split_asistencia: false,
  asistencia_teoria: 70,
  asistencia_practica: 80,
  comisiones_division: [],
  agenda_rota_practicas: false,
  fecha_inicio_practica: '',
  fecha_fin_practica: '',
  dias_practica: [],
  planificacion_pendiente: false,
  bloques_semanales: {},
}

export default function NuevaCatedraPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [form, setForm] = useState(initialForm)
  const [paintColor, setPaintColor] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (paintColor === null && (form.comisiones_division || []).length > 0) {
      setPaintColor(0)
    }
  }, [form.comisiones_division])

  const updateForm = (field, value) =>
    setForm((prev) => ({ ...prev, [field]: value }))

  const toggleTipoClase = (tipo) => {
    setForm(prev => {
      let current = Array.isArray(prev.tipo_clase) ? prev.tipo_clase : [prev.tipo_clase]
      if (tipo === 'teorico_practica') return { ...prev, tipo_clase: ['teorico_practica'] }
      let next = current.includes('teorico_practica') ? [tipo] : (
        current.includes(tipo) 
          ? current.filter(t => t !== tipo) 
          : [...current, tipo]
      )
      if (next.length === 0) next = ['teorica']
      return { ...prev, tipo_clase: next }
    })
  }

  const toggleDia = (dia) => {
    if (form.agenda_rota_practicas && !form.tipo_clase.includes('teorica')) return
    setForm((prev) => ({
      ...prev,
      dias_clase: prev.dias_clase.includes(dia)
        ? prev.dias_clase.filter((d) => d !== dia)
        : [...prev.dias_clase, dia],
    }))
  }

  const addComision = () => {
    updateForm('comisiones_division', [
      ...form.comisiones_division,
      { 
        nombre: `Comisión ${form.comisiones_division.length + 1}`, 
        desde: 'A', 
        hasta: 'Z', 
        color: PALETTE[form.comisiones_division.length % PALETTE.length],
        dias: [],
        fechas: [],
        turno: 'mañana' // Opción de turno recuperada
      }
    ])
  }

  const removeComision = (index) => {
    updateForm('comisiones_division', form.comisiones_division.filter((_, i) => i !== index))
  }

  const updateComision = (index, field, value) => {
    const newComisiones = [...form.comisiones_division]
    newComisiones[index][field] = field === 'turno' ? value : value.toUpperCase()
    updateForm('comisiones_division', newComisiones)
  }

  const toggleComisionDia = (comIdx, dia) => {
    if (form.agenda_rota_practicas) return
    const newComisiones = [...form.comisiones_division]
    const currentDias = newComisiones[comIdx].dias || []
    newComisiones[comIdx].dias = currentDias.includes(dia)
      ? currentDias.filter(d => d !== dia)
      : [...currentDias, dia]
    updateForm('comisiones_division', newComisiones)
  }

  const getWeeks = () => {
    const useStart = form.fecha_inicio_practica || form.fecha_inicio
    const useEnd = form.fecha_fin_practica || form.fecha_fin
    if (!useStart || !useEnd) return []
    const start = new Date(useStart + 'T12:00:00')
    const end = new Date(useEnd + 'T12:00:00')
    const weeks = []
    let curr = new Date(start)
    curr.setDate(curr.getDate() - (curr.getDay() === 0 ? 6 : curr.getDay() - 1))
    while (curr <= end) {
      const year = curr.getFullYear()
      const firstDayOfYear = new Date(year, 0, 1)
      const pastDaysOfYear = (curr - firstDayOfYear) / 86400000
      const weekNum = Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7)
      const weekId = `${year}-W${weekNum.toString().padStart(2, '0')}`
      weeks.push({ id: weekId, start: new Date(curr), label: `Semana ${weekNum} (${curr.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit' })})` })
      curr.setDate(curr.getDate() + 7)
    }
    return weeks
  }

  const toggleBloque = (weekId, comIdx) => {
    const newBloques = { ...form.bloques_semanales }
    const current = Array.isArray(newBloques[weekId]) ? newBloques[weekId] : []
    if (comIdx === null) {
      delete newBloques[weekId]
    } else {
      if (current.includes(comIdx)) {
        const next = current.filter(id => id !== comIdx)
        if (next.length === 0) delete newBloques[weekId]
        else newBloques[weekId] = next
      } else {
        newBloques[weekId] = [...current, comIdx]
      }
    }
    setForm(prev => ({ ...prev, bloques_semanales: newBloques }))
  }

  const canGoNext = () => {
    if (step === 1) return form.nombre.trim() !== '' && form.codigo.trim() !== '' && form.carrera.trim() !== '' && form.anio.toString().trim() !== ''
    if (step === 2) return (form.fecha_inicio !== '' && form.fecha_fin !== '')
    return true
  }

  const handleSubmit = async () => {
    setLoading(true)
    setError(null)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    const getCookie = (name) => {
      const value = `; ${document.cookie}`;
      const parts = value.split(`; ${name}=`);
      if (parts.length === 2) return decodeURIComponent(parts.pop().split(';').shift());
      return null;
    }
    const isDemoBypass = getCookie('demo_bypass') === 'true'
    const demoEmail = getCookie('demo_user')
    
    let docenteId = user?.id || (isDemoBypass ? demoEmail : null)

    if (!docenteId) { 
      setError('No estás autenticado. Por favor, ingresá por el login.'); 
      setLoading(false); 
      return; 
    }
    const qrCode = crypto.randomUUID()
    let tipoClaseFinal = Array.isArray(form.tipo_clase) ? form.tipo_clase[0] : form.tipo_clase
    if (Array.isArray(form.tipo_clase)) {
      if (form.tipo_clase.includes('teorica') && form.tipo_clase.includes('practica')) tipoClaseFinal = 'teorico_practica'
      else tipoClaseFinal = form.tipo_clase[0]
    }
    const dataToSubmit = {
      ...form, 
      tipo_clase: tipoClaseFinal, 
      anio: form.anio ? parseInt(form.anio) : null,
      cuatrimestre: isNaN(parseInt(form.cuatrimestre)) ? 0 : parseInt(form.cuatrimestre),
      qr_code: qrCode, 
      docente_id: docenteId,
      metodo_tp: Array.isArray(form.metodo_tp) ? form.metodo_tp : [form.metodo_tp],
      dias_practica: Array.isArray(form.dias_practica) ? form.dias_practica : [],
      fecha_inicio_practica: form.fecha_inicio_practica || null,
      fecha_fin_practica: form.fecha_fin_practica || null,
      fecha_inicio: form.fecha_inicio || null,
      fecha_fin: form.fecha_fin || null,
    }

    // CHECK FOR DUPLICATES
    let duplicateQuery = supabase
      .from('catedras')
      .select('id')
      .eq('institucion', dataToSubmit.institucion)
      .eq('facultad', dataToSubmit.facultad)
      .eq('carrera', dataToSubmit.carrera)
      .eq('codigo', dataToSubmit.codigo)
      .eq('docente_id', dataToSubmit.docente_id)

    if (dataToSubmit.comision) {
      duplicateQuery = duplicateQuery.eq('comision', dataToSubmit.comision)
    } else {
      duplicateQuery = duplicateQuery.is('comision', null)
    }

    const { data: existingCatedra, error: checkError } = await duplicateQuery.maybeSingle();

    if (existingCatedra) {
      setError('Ya existe una cátedra idéntica registrada (mismo código, carrera y comisión).');
      setLoading(false);
      return;
    }

    const { error: insertError } = await supabase.from('catedras').insert(dataToSubmit)
    if (insertError) { setError(insertError.message); setLoading(false); return; }
    router.push('/docente/catedras'); router.refresh()
  }

  return (
    <div className="max-w-3xl mx-auto animate-fade-in wizard-container">
      {/* HEADER WIZARD */}
      <div className="mb-8 wizard-header no-print">
        <Link href="/docente/catedras" className="inline-flex items-center gap-2 text-sm text-muted hover:text-foreground transition-colors mb-4">
          <ArrowLeft className="w-4 h-4" /> Volver
        </Link>
        <h1 className="text-2xl font-bold text-foreground">Nueva Cátedra</h1>
        <p className="text-muted text-sm mt-1">Configurá tu materia paso a paso.</p>
      </div>

      {/* STEPPER */}
      <div className="flex items-center gap-2 mb-8 overflow-x-auto pb-2 wizard-nav no-print">
        {STEPS.map((s, i) => (
          <div key={s.id} className="flex items-center">
            <button onClick={() => s.id < step && setStep(s.id)} className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${s.id === step ? 'bg-primary text-white' : s.id < step ? 'bg-primary/10 text-primary' : 'bg-surface border border-border text-muted'}`}>
              <s.icon className="w-4 h-4" />
              <span className="hidden sm:inline">{s.label}</span>
            </button>
            {i < STEPS.length - 1 && <div className="w-6 h-px bg-border mx-1" />}
          </div>
        ))}
      </div>

      {/* CONTENT */}
      <div className="bg-surface border border-border rounded-2xl p-6 md:p-8 wizard-content">
        
        {/* PASO 1: DATOS */}
        {step === 1 && (
          <div className="space-y-6 animate-fade-in">
            <h2 className="text-lg font-semibold text-foreground">Datos académicos</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="col-span-full">
                <label className="block text-sm font-medium mb-1.5 uppercase text-[10px] text-muted">Nombre de la asignatura *</label>
                <input type="text" value={form.nombre} onChange={e=>updateForm('nombre', e.target.value)} className="w-full px-4 py-3 bg-background border rounded-xl" placeholder="Ej: Enfermería en Salud Comunitaria I" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5 uppercase text-[10px] text-muted">Código *</label>
                <input type="text" value={form.codigo} onChange={e=>updateForm('codigo', e.target.value)} className="w-full px-4 py-3 bg-background border rounded-xl" placeholder="103" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5 uppercase text-[10px] text-muted">Institución</label>
                <input type="text" value={form.institucion} onChange={e=>updateForm('institucion', e.target.value)} className="w-full px-4 py-3 bg-background border rounded-xl" placeholder="UNRC" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5 uppercase text-[10px] text-muted">Carrera *</label>
                <input type="text" value={form.carrera} onChange={e=>updateForm('carrera', e.target.value)} className="w-full px-4 py-3 bg-background border rounded-xl" placeholder="Lic. en Enfermería" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5 uppercase text-[10px] text-muted">Facultad</label>
                <input type="text" value={form.facultad} onChange={e=>updateForm('facultad', e.target.value)} className="w-full px-4 py-3 bg-background border rounded-xl" placeholder="Ciencias Humanas" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5 uppercase text-[10px] text-muted">Año del plan *</label>
                <input type="number" value={form.anio} onChange={e=>updateForm('anio', e.target.value)} className="w-full px-4 py-3 bg-background border rounded-xl" placeholder="1" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5 uppercase text-[10px] text-muted">Cuatrimestre</label>
                <select value={form.cuatrimestre} onChange={e=>updateForm('cuatrimestre', e.target.value)} className="w-full px-4 py-3 bg-background border rounded-xl">
                  <option value="1">1° Cuatrimestre</option>
                  <option value="2">2° Cuatrimestre</option>
                  <option value="3">Bimestral</option>
                  <option value="4">Semestral</option>
                  <option value="0">Anual</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5 uppercase text-[10px] text-muted">Comisión</label>
                <input type="text" value={form.comision} onChange={e=>updateForm('comision', e.target.value)} className="w-full px-4 py-3 bg-background border rounded-xl" placeholder="Única" />
              </div>
            </div>

            <div className="pt-6 border-t border-border">
              <label className="block text-sm font-bold text-foreground mb-3">Tipo de clase</label>
              <div className="flex gap-3 flex-wrap">
                {[{v:'teorica',l:'Teórica'},{v:'practica',l:'Práctica'},{v:'teorico_practica',l:'Teórico-práctica'}].map(opt=>(
                  <button key={opt.v} onClick={()=>toggleTipoClase(opt.v)} className={`px-4 py-2.5 rounded-xl text-sm font-bold border transition-all ${form.tipo_clase.includes(opt.v)?'bg-primary text-white border-primary shadow-lg':'bg-background text-muted border-border'}`}>{opt.l}</button>
                ))}
              </div>
              {form.tipo_clase.includes('practica') && (
                <div className="mt-4 p-4 bg-primary/5 border border-primary/20 rounded-2xl flex items-center justify-between">
                  <div><div className="text-sm font-black text-primary uppercase italic">¿Prácticas Rotativas?</div><div className="text-[10px] text-muted">Habilita asignar semanas a comisiones específicas</div></div>
                  <button onClick={()=>updateForm('agenda_rota_practicas', !form.agenda_rota_practicas)} className={`relative w-12 h-6 rounded-full transition-all ${form.agenda_rota_practicas?'bg-primary':'bg-border'}`}><div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full transition-all ${form.agenda_rota_practicas?'left-6.5':'left-0.5'}`} /></button>
                </div>
              )}
            </div>

            <div className="pt-6 border-t border-border">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-foreground">Comisiones por Apellido</h3>
                <button type="button" onClick={addComision} className="flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 text-primary text-[11px] font-bold rounded-lg"><Plus className="w-3 h-3" /> Agregar Comisión</button>
              </div>
              
              {/* ALERTA DE COMISIONES FALTANTES */}
              {form.comision && !isNaN(parseInt(form.comision)) && parseInt(form.comision) > form.comisiones_division.length && !form.planificacion_pendiente && (
                <div className="mb-6 p-6 bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-200 rounded-[2rem] shadow-sm animate-pulse-subtle">
                   <div className="flex gap-4">
                      <div className="bg-amber-500 text-white p-3 rounded-2xl h-fit shadow-lg shadow-amber-500/30">
                         <ClipboardList className="w-5 h-5"/>
                      </div>
                      <div className="flex-1">
                         <h4 className="text-xs font-black uppercase text-amber-700 mb-1 tracking-tight italic">Comisiones incompletas</h4>
                         <p className="text-[11px] text-amber-600 font-bold leading-normal">
                            Has indicado que la cátedra tiene <span className="text-amber-800 text-sm">{form.comision}</span> comisiones, pero solo has detallado <span className="text-amber-800 text-sm">{form.comisiones_division.length}</span>.
                         </p>
                         <div className="flex gap-3 mt-4">
                            <button onClick={addComision} className="flex-1 py-2.5 bg-amber-500 text-white text-[10px] font-black uppercase rounded-xl shadow-lg hover:scale-105 transition-all">Detallar la siguiente</button>
                            <button onClick={() => updateForm('planificacion_pendiente', true)} className="flex-1 py-2.5 bg-white border border-amber-200 text-amber-600 text-[10px] font-black uppercase rounded-xl hover:bg-amber-100 transition-all">Dejar para después</button>
                         </div>
                      </div>
                   </div>
                </div>
              )}

              <div className="space-y-3">
                {form.comisiones_division.map((com, idx) => (
                  <div key={idx} className="p-4 bg-background border border-border rounded-2xl grid grid-cols-1 md:grid-cols-6 gap-3 items-end">
                    <div className="md:col-span-2">
                       <label className="text-[9px] font-bold text-muted uppercase ml-1">Nombre</label>
                       <input type="text" value={com.nombre} onChange={e=>updateComision(idx, 'nombre', e.target.value)} className="w-full px-3 py-2 bg-surface border rounded-lg text-xs" />
                    </div>
                    <div>
                       <label className="text-[9px] font-bold text-muted uppercase ml-1">Desde</label>
                       <input type="text" maxLength={1} value={com.desde} onChange={e=>updateComision(idx, 'desde', e.target.value)} className="w-full px-3 py-2 bg-surface border rounded-lg text-xs text-center font-bold" />
                    </div>
                    <div>
                       <label className="text-[9px] font-bold text-muted uppercase ml-1">Hasta</label>
                       <input type="text" maxLength={1} value={com.hasta} onChange={e=>updateComision(idx, 'hasta', e.target.value)} className="w-full px-3 py-2 bg-surface border rounded-lg text-xs text-center font-bold" />
                    </div>
                    <div>
                       <label className="text-[9px] font-bold text-muted uppercase ml-1">Turno</label>
                       <select value={com.turno} onChange={e=>updateComision(idx, 'turno', e.target.value)} className="w-full px-2 py-2 bg-surface border rounded-lg text-[10px] font-bold">
                          <option value="mañana">Mañana</option>
                          <option value="tarde">Tarde</option>
                       </select>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                       <div className="flex gap-1">
                          {PALETTE.slice(0,4).map(c=>(<button key={c} onClick={()=>updateComision(idx,'color',c)} className={`w-3.5 h-3.5 rounded-full ${com.color === c ? 'ring-2 ring-primary scale-110' : 'opacity-40'}`} style={{backgroundColor:c}} />))}
                       </div>
                       <button onClick={()=>removeComision(idx)} className="text-muted hover:text-danger"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* PASO 2: CALENDARIO */}
        {step === 2 && (
          <div className="space-y-8 animate-fade-in">
            <h2 className="text-xl font-black text-foreground uppercase tracking-tight no-print">Configuración de Calendario</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 no-print">
              <div className="p-4 bg-background border border-border rounded-3xl">
                <label className="block text-[11px] font-black text-muted uppercase mb-4 tracking-widest">{form.agenda_rota_practicas ? 'Rango Teoría' : 'Rango General'} *</label>
                <div className="grid grid-cols-2 gap-3"><input type="date" value={form.fecha_inicio} onChange={e=>updateForm('fecha_inicio',e.target.value)} className="w-full p-3 bg-surface border rounded-xl text-xs" /><input type="date" value={form.fecha_fin} onChange={e=>updateForm('fecha_fin',e.target.value)} className="w-full p-3 bg-surface border rounded-xl text-xs" /></div>
              </div>
              {form.agenda_rota_practicas && (
                <div className="p-4 border-2 border-primary/20 bg-primary/5 rounded-3xl">
                  <label className="block text-[11px] font-black text-primary uppercase mb-4 tracking-widest">Rango PRÁCTICAS *</label>
                  <div className="grid grid-cols-2 gap-3">
                    <div><span className="text-[9px] font-bold text-muted ml-1">INICIO</span><input type="date" value={form.fecha_inicio_practica} onChange={e=>updateForm('fecha_inicio_practica',e.target.value)} className="w-full p-3 bg-surface border rounded-xl text-xs" /></div>
                    <div><span className="text-[9px] font-bold text-muted ml-1">FIN</span><input type="date" value={form.fecha_fin_practica} onChange={e=>updateForm('fecha_fin_practica',e.target.value)} className="w-full p-3 bg-surface border rounded-xl text-xs" /></div>
                  </div>
                </div>
              )}
            </div>

            {/* DÍAS DE TEORÍA */}
            {(form.tipo_clase.includes('teorica') || form.tipo_clase.includes('teorico_practica')) && (
              <div className="p-4 bg-background border border-border rounded-3xl no-print">
                <label className="block text-[11px] font-black text-muted uppercase mb-3 tracking-widest">
                  {form.agenda_rota_practicas ? 'Días de Teoría' : 'Días de Cursada'} *
                </label>
                <div className="flex flex-wrap gap-2">
                  {[{v:'lunes',l:'L'},{v:'martes',l:'M'},{v:'miercoles',l:'X'},{v:'jueves',l:'J'},{v:'viernes',l:'V'},{v:'sabado',l:'S'}].map(d => (
                    <button key={d.v} type="button"
                      onClick={() => toggleDia(d.v)}
                      className={`w-9 h-9 rounded-xl text-xs font-black transition-all border-2 ${
                        form.dias_clase.includes(d.v)
                          ? 'bg-primary text-white border-primary shadow-md'
                          : 'bg-surface text-muted border-border'
                      }`}
                    >{d.l}</button>
                  ))}
                </div>
                {form.dias_clase.length > 0 && (
                  <p className="text-[10px] text-muted mt-2">{form.dias_clase.map(d => d.charAt(0).toUpperCase() + d.slice(1)).join(', ')}</p>
                )}
              </div>
            )}

            {/* DÍAS DE PRÁCTICA — solo si agenda rotativa */}
            {form.agenda_rota_practicas && (
              <div className="p-4 border-2 border-accent/20 bg-accent/5 rounded-3xl no-print">
                <label className="block text-[11px] font-black text-accent uppercase mb-3 tracking-widest">
                  Días de Práctica *
                </label>
                <div className="flex flex-wrap gap-2">
                  {[{v:'lunes',l:'L'},{v:'martes',l:'M'},{v:'miercoles',l:'X'},{v:'jueves',l:'J'},{v:'viernes',l:'V'},{v:'sabado',l:'S'}].map(d => (
                    <button key={d.v} type="button"
                      onClick={() => setForm(prev => ({
                        ...prev,
                        dias_practica: prev.dias_practica.includes(d.v)
                          ? prev.dias_practica.filter(x => x !== d.v)
                          : [...prev.dias_practica, d.v]
                      }))}
                      className={`w-9 h-9 rounded-xl text-xs font-black transition-all border-2 ${
                        form.dias_practica.includes(d.v)
                          ? 'bg-accent text-white border-accent shadow-md'
                          : 'bg-surface text-muted border-border'
                      }`}
                    >{d.l}</button>
                  ))}
                </div>
                {form.dias_practica.length > 0 && (
                  <p className="text-[10px] text-muted mt-2">{form.dias_practica.map(d => d.charAt(0).toUpperCase() + d.slice(1)).join(', ')}</p>
                )}
              </div>
            )}

            {form.agenda_rota_practicas && form.comisiones_division.length > 0 && (
              <div className="space-y-6 pt-6 border-t border-border no-print:border-none">
                {/* INVITACIÓN A PLANIFICACIÓN */}
                <div className="bg-primary/5 border border-primary/20 rounded-3xl p-6 mb-2 no-print">
                   <div className="flex items-center gap-4">
                      <div className="bg-primary text-white p-3 rounded-2xl shadow-lg animate-bounce"><Calendar className="w-6 h-6"/></div>
                      <div>
                         <h3 className="text-sm font-black text-primary uppercase leading-tight italic">¡Es hora de planificar las rotaciones!</h3>
                         <p className="text-[11px] text-muted font-bold">Seleccioná una comisión y pintá las semanas correspondientes en la grilla de abajo.</p>
                      </div>
                   </div>
                </div>

                <div className="flex flex-wrap gap-2 mb-4 p-4 bg-surface rounded-3xl border shadow-inner no-print">
                  <span className="w-full text-[9px] font-black text-muted uppercase italic mb-2">Seleccioná comisión para pintar:</span>
                  {form.comisiones_division.map((c, i)=>(
                    <button key={i} onClick={()=>setPaintColor(i)} className={`flex items-center gap-2 px-4 py-2 rounded-xl border-2 transition-all ${paintColor === i ? 'border-primary bg-primary/10 shadow-md ring-2 ring-primary/20' : 'border-transparent bg-background opacity-60'}`}><div className="w-3 h-3 rounded-full" style={{backgroundColor:c.color}}/><span className="text-[10px] font-black uppercase">{c.nombre || i+1}</span></button>
                  ))}
                  <button onClick={()=>setPaintColor(null)} className={`px-4 py-2 rounded-xl border-2 border-dashed ${paintColor === null ? 'border-danger bg-danger/5' : 'border-border opacity-40'}`}><Trash2 className="w-3.5 h-3.5 text-danger" /></button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 no-print">
                   {getWeeks().map(w => {
                     const ids = Array.isArray(form.bloques_semanales[w.id]) ? form.bloques_semanales[w.id] : []
                     return (
                       <div key={w.id} onClick={()=>toggleBloque(w.id, paintColor)} className={`p-4 rounded-3xl border-2 min-h-[120px] cursor-pointer transition-all hover:scale-[1.02] flex flex-col ${ids.length > 0 ? 'bg-primary/5 border-primary/20 shadow-lg' : 'border-dashed border-border bg-background'}`}>
                         <div className="text-[9px] font-black text-muted uppercase mb-3 border-b border-border pb-1">{w.label}</div>
                         <div className="flex flex-col gap-1.5 flex-1 justify-center">
                            {ids.map(idx => (
                              <div key={idx} className="px-3 py-1.5 rounded-xl text-[9px] font-black border-l-4 shadow-sm" style={{backgroundColor:`${form.comisiones_division[idx]?.color}22`, borderLeftColor:form.comisiones_division[idx]?.color, color:form.comisiones_division[idx]?.color}}>
                                {form.comisiones_division[idx]?.nombre || idx+1} <span className="opacity-50 float-right">({form.comisiones_division[idx]?.turno?.slice(0,1)})</span>
                              </div>
                            ))}
                            {ids.length === 0 && <span className="text-[10px] text-muted text-center italic opacity-30">Vacío</span>}
                         </div>
                       </div>
                     )
                   })}
                </div>

                {/* VISUALIZACIÓN PDF / FINAL */}
                <div className="master-schedule-section pt-10 border-t border-dashed mt-10 print:border-none print:pt-0 print:mt-0">
                   {/* HEADER PDF */}
                   <div className="pdf-header mb-8 hidden print:block space-y-4">
                      <div className="flex justify-between items-start border-b-2 border-primary pb-4">
                         <div>
                            <h1 className="text-2xl font-black text-primary uppercase tracking-tighter">{form.nombre}</h1>
                            <p className="text-sm font-bold text-foreground">{form.carrera} | {form.facultad}</p>
                            <p className="text-xs font-bold text-muted">Cód: {form.codigo} | {form.institucion}</p>
                         </div>
                         <div className="text-right">
                            <p className="text-xs font-black uppercase text-muted">AÑO {form.anio}</p>
                            <p className="text-[10px] font-bold text-primary">{form.cuatrimestre}° CUATRIMESTRE</p>
                         </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4 p-4 bg-primary/5 rounded-2xl border border-primary/10">
                         <div className="space-y-1">
                            <span className="text-[9px] font-black text-primary uppercase">Referencias de Cátedra:</span>
                            <div className="flex flex-wrap gap-x-4 gap-y-2">
                               {form.comisiones_division.map((c, i)=>(
                                 <div key={i} className="flex items-center gap-2 text-[10px] font-black">
                                    <div className="w-2 h-2 rounded-full" style={{backgroundColor:c.color}}/>
                                    <span>{c.nombre || i+1}: Turno {c.turno} (Alumnos de {c.desde} a {c.hasta})</span>
                                 </div>
                               ))}
                            </div>
                         </div>
                         <div className="text-right text-[10px] font-bold text-muted">
                            <p>Cronograma de Clases Prácticas Rotativas</p>
                            <p>Rango: {form.fecha_inicio_practica} al {form.fecha_fin_practica}</p>
                         </div>
                      </div>
                   </div>

                   <div className="flex justify-between items-center mb-6 no-print">
                      <h4 className="text-sm font-black uppercase italic tracking-widest text-foreground">Cronograma Final</h4>
                      <button onClick={()=>window.print()} className="flex items-center gap-2 px-6 py-2.5 bg-primary text-white text-[10px] font-black uppercase rounded-2xl shadow-xl hover:scale-105 transition-all"><Printer className="w-4 h-4"/> Exportar PDF Profesional</button>
                   </div>

                   <div className="space-y-12">
                     {(() => {
                       const weeks = getWeeks(); const months = {};
                       weeks.forEach(w => { 
                         const mk = w.start.toLocaleDateString('es-AR',{month:'long',year:'numeric'}); 
                         if(!months[mk]) months[mk]=[]; 
                         months[mk].push(w); 
                       });
                       return Object.entries(months).map(([m, ws]) => {
                         const hasData = ws.some(w => Array.isArray(form.bloques_semanales[w.id]) && form.bloques_semanales[w.id].length > 0);
                         if (!hasData && form.agenda_rota_practicas) return null; // Only filter if rotative practices are enabled
                         return (
                           <div key={m} className="break-inside-avoid shadow-sm rounded-3xl p-6 border border-border/50 bg-surface/30">
                             <h5 className="text-xs font-black uppercase text-primary mb-6 border-l-8 border-primary pl-4 py-1 tracking-widest">{m}</h5>
                           <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                             {ws.map(w => {
                               const ids = Array.isArray(form.bloques_semanales[w.id]) ? form.bloques_semanales[w.id] : []
                               if(!ids.length && form.agenda_rota_practicas) return null // Only filter if rotative practices are enabled
                               return (
                                 <div key={w.id} className="p-5 border-2 border-border/40 rounded-3xl bg-white shadow-sm flex flex-col gap-4">
                                   <div className="text-[10px] font-black text-muted uppercase tracking-tighter border-b border-border/30 pb-2">{w.label}</div>
                                   <div className="flex flex-col gap-2">
                                     {ids.map(i => (
                                       <div key={i} className="flex justify-between items-center px-4 py-2 rounded-2xl text-[10px] font-black border-l-4" style={{backgroundColor:`${form.comisiones_division[i]?.color}11`, borderLeftColor:form.comisiones_division[i]?.color, color:form.comisiones_division[i]?.color}}>
                                          <span>{form.comisiones_division[i]?.nombre || i+1}</span>
                                          <span className="text-[8px] opacity-70 bg-white px-2 py-0.5 rounded-full border border-current/20">{form.comisiones_division[i]?.turno?.slice(0,1).toUpperCase()}</span>
                                       </div>
                                     ))}
                                   </div>
                                 </div>
                               )
                             })}
                           </div>
                         </div>
                       )})
                     })()}
                   </div>

                   {/* LEYENDA PIE (PARA NO PRINT / COMPLEMENTO) */}
                   <div className="mt-8 flex flex-wrap gap-4 no-print">
                      {form.comisiones_division.map((c, i)=>(<div key={i} className="flex items-center gap-2 text-[10px] font-black text-muted bg-surface px-4 py-2 rounded-2xl border"><div className="w-2.5 h-2.5 rounded-full" style={{backgroundColor:c.color}}/>{c.nombre || i+1} ({c.desde}-{c.hasta}) | {c.turno}</div>))}
                   </div>
                </div>
              </div>
            )}
            
            {/* SELECCIÓN DE DÍAS (TEORÍA Y COMISIONES FIJAS) */}
            <div className="pt-8 border-t border-border animate-fade-in space-y-8">
               {/* Teoría siempre visible si existe */}
               {form.tipo_clase.includes('teorica') && (
                 <div className="p-6 bg-primary/5 rounded-3xl border border-primary/10">
                    <label className="block text-[11px] font-black italic uppercase text-primary mb-4 tracking-widest">Días de Clase Teórica (Fijos):</label>
                    <div className="flex gap-2.5 flex-wrap">
                       {DIAS_SEMANA.map(d=>(<button key={d.value} onClick={()=>toggleDia(d.value)} className={`px-5 py-3 border-2 rounded-2xl text-[11px] font-black transition-all ${form.dias_clase.includes(d.value)?'bg-primary text-white border-primary shadow-lg scale-105':'bg-white border-border text-muted opacity-60'}`}>{d.label}</button>))}
                    </div>
                 </div>
               )}

               {/* Días de comisión solo si NO son rotativas */}
               {!form.agenda_rota_practicas && (
                 <div className="space-y-4">
                    <label className="block text-[11px] font-black text-muted uppercase ml-2 mb-2 tracking-widest">Días de Prácticos por Comisión:</label>
                    {form.comisiones_division.map((com, idx) => (
                      <div key={idx} className="p-6 bg-surface border border-border rounded-3xl group hover:border-primary/20 transition-all">
                        <div className="flex items-center gap-3 mb-4 text-[11px] font-black uppercase" style={{color:com.color}}>
                           <div className="w-3.5 h-3.5 rounded-full shadow-inner" style={{backgroundColor:com.color}}/>
                           {com.nombre || idx+1} <span className="text-muted opacity-50 ml-1">({com.turno})</span>
                        </div>
                        <div className="flex gap-2 flex-wrap">
                           {DIAS_SEMANA.map(d=>(<button key={d.value} onClick={()=>toggleComisionDia(idx,d.value)} className={`px-4 py-2.5 border-2 rounded-xl text-[10px] font-black transition-all ${(com.dias||[]).includes(d.value)?'bg-primary text-white border-primary shadow-sm':'bg-background border-border opacity-50'}`}>{d.label.slice(0,3)}</button>))}
                        </div>
                      </div>
                    ))}
                 </div>
               )}
            </div>
          </div>
        )}

        {/* PASO 3: CONDICIONES */}
        {step === 3 && (
          <div className="space-y-8 animate-fade-in">
            <h2 className="text-xl font-black text-foreground uppercase italic tracking-tight underline decoration-primary underline-offset-8">Condiciones de Aprobación</h2>
            <div className="flex items-center justify-between p-6 bg-primary/5 border-2 border-primary/20 rounded-3xl">
               <div><div className="text-base font-black text-primary uppercase">¿Es materia promocional?</div><div className="text-xs text-muted font-bold">Los alumnos pueden aprobar sin examen final si cumplen méritos.</div></div>
               <button onClick={()=>updateForm('es_promocional', !form.es_promocional)} className={`relative w-14 h-8 rounded-full shadow-inner transition-all ${form.es_promocional ? 'bg-primary' : 'bg-border'}`}><div className={`absolute top-1 w-6 h-6 bg-white rounded-full shadow-lg transition-all ${form.es_promocional ? 'left-7':'left-1'}`} /></button>
            </div>

            {form.es_promocional && (
              <div className="p-6 bg-surface border border-primary/10 rounded-3xl space-y-6 animate-fade-in">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div><label className="text-[10px] font-black uppercase text-muted mb-2 block ml-1">Nota Mínima Examen</label><input type="number" value={form.nota_promocion_minima} onChange={e=>updateForm('nota_promocion_minima',parseFloat(e.target.value))} className="w-full bg-background border rounded-2xl p-4 text-sm font-bold shadow-sm" /></div>
                    <div><label className="text-[10px] font-black uppercase text-muted mb-2 block ml-1">Promedio Requerido</label><input type="number" value={form.nota_promocion_promedio} onChange={e=>updateForm('nota_promocion_promedio',parseFloat(e.target.value))} className="w-full bg-background border rounded-2xl p-4 text-sm font-bold shadow-sm" /></div>
                 </div>
                 <div className="flex items-center justify-between pt-4 border-t border-border/50">
                    <span className="text-sm font-bold text-foreground">¿Permite recuperar un examen para promocionar?</span>
                    <button onClick={()=>updateForm('permite_recuperatorio_promocion', !form.permite_recuperatorio_promocion)} className={`relative w-12 h-6.5 rounded-full transition-all ${form.permite_recuperatorio_promocion ? 'bg-primary' : 'bg-border'}`}><div className={`absolute top-0.5 w-5.5 h-5.5 bg-white rounded-full transition-all ${form.permite_recuperatorio_promocion ? 'left-6':'left-0.5'}`} /></button>
                 </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div><label className="block text-[11px] font-black text-muted uppercase mb-2 tracking-widest">Nota mínima para regularizar</label><input type="number" value={form.nota_regularizacion} onChange={e=>updateForm('nota_regularizacion',parseFloat(e.target.value))} className="w-full px-6 py-4 bg-background border-2 border-border focus:border-primary rounded-3xl outline-none font-black text-lg text-primary shadow-inner" /></div>
              <div><label className="block text-[11px] font-black text-muted uppercase mb-2 tracking-widest">Asistencia requerida (%)</label><input type="number" value={form.porcentaje_asistencia} onChange={e=>updateForm('porcentaje_asistencia',parseInt(e.target.value))} className="w-full px-6 py-4 bg-background border-2 border-border focus:border-primary rounded-3xl outline-none font-black text-lg text-primary shadow-inner" placeholder="80" /></div>
            </div>
          </div>
        )}

        {/* PASO 4: EVALUACIONES */}
        {step === 4 && (
          <div className="space-y-8 animate-fade-in">
            <h2 className="text-xl font-black text-foreground uppercase italic tracking-tighter">Plan de Evaluaciones</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               <div className="p-6 bg-surface border rounded-3xl shadow-sm text-center">
                  <label className="text-[10px] font-black text-muted uppercase block mb-4">Parciales totales</label>
                  <input type="number" value={form.cant_parciales} onChange={e=>updateForm('cant_parciales',parseInt(e.target.value))} className="w-20 text-center text-2xl font-black bg-background border-b-4 border-primary p-2 outline-none" />
               </div>
               <div className="p-6 bg-surface border rounded-3xl shadow-sm text-center">
                  <label className="text-[10px] font-black text-muted uppercase block mb-4">Recuperatorios</label>
                  <input type="number" value={form.cant_recuperatorios} onChange={e=>updateForm('cant_recuperatorios',parseInt(e.target.value))} className="w-20 text-center text-2xl font-black bg-background border-b-4 border-primary p-2 outline-none" />
               </div>
            </div>

            <div className="pt-6 border-t border-border">
               <div className="flex items-center justify-between p-6 bg-primary/5 border border-primary/20 rounded-3xl mb-6">
                  <div><div className="text-base font-black text-primary uppercase mb-1">Trabajos Prácticos Evaluables</div><div className="text-xs text-muted font-bold">¿Se deben cargar notas de TPs en el sistema?</div></div>
                  <button onClick={()=>updateForm('tiene_tp_evaluable', !form.tiene_tp_evaluable)} className={`relative w-14 h-8 rounded-full transition-all ${form.tiene_tp_evaluable ? 'bg-primary' : 'bg-border'}`}><div className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-all ${form.tiene_tp_evaluable ? 'left-7':'left-1'}`} /></button>
               </div>

               {form.tiene_tp_evaluable && (
                       <div className="p-6 bg-surface border-2 border-dashed border-primary/20 rounded-3xl space-y-8 animate-fade-in">
                     <label className="block text-[10px] font-black uppercase text-muted mb-4 ml-1 italic tracking-widest">Configuración de TPs Evaluables:</label>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* OPCION 1: SEPARADOS */}
                        <div className={`p-5 rounded-3xl border-2 transition-all space-y-4 ${Array.isArray(form.metodo_tp) && form.metodo_tp.includes('separado') ? 'border-primary bg-primary/5 shadow-lg' : 'border-border bg-background/50 opacity-60'}`}>
                           <div className="flex items-center justify-between">
                              <span className="text-[11px] font-black uppercase text-foreground">Aprobación Independiente</span>
                              <button onClick={() => {
                                const current = Array.isArray(form.metodo_tp) ? form.metodo_tp : [form.metodo_tp]
                                const next = current.includes('separado') ? current.filter(t => t !== 'separado') : [...current, 'separado']
                                updateForm('metodo_tp', next)
                              }} className={`relative w-10 h-5 rounded-full shadow-inner transition-all ${Array.isArray(form.metodo_tp) && form.metodo_tp.includes('separado') ? 'bg-primary' : 'bg-border'}`}><div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow-lg transition-all ${Array.isArray(form.metodo_tp) && form.metodo_tp.includes('separado') ? 'left-5.5':'left-0.5'}`} /></button>
                           </div>
                           <p className="text-[9px] text-muted font-bold leading-tight">Los TPs se promedian por separado de los parciales.</p>
                           {(Array.isArray(form.metodo_tp) && form.metodo_tp.includes('separado')) && (
                             <div className="pt-2 animate-fade-in"><label className="text-[9px] font-black text-primary uppercase block mb-1">Cantidad de TPs:</label><input type="number" value={form.cant_tps_separados || 0} onChange={e=>updateForm('cant_tps_separados', parseInt(e.target.value))} className="w-full bg-white border border-primary/30 rounded-xl px-3 py-2 text-sm font-black text-primary" placeholder="0" /></div>
                           )}
                        </div>
                        {/* OPCION 2: CON PARCIALES */}
                        <div className={`p-5 rounded-3xl border-2 transition-all space-y-4 ${Array.isArray(form.metodo_tp) && form.metodo_tp.includes('con_parciales') ? 'border-primary bg-primary/5 shadow-lg' : 'border-border bg-background/50 opacity-60'}`}>
                           <div className="flex items-center justify-between">
                              <span className="text-[11px] font-black uppercase text-foreground">Equivalente a Parcial</span>
                              <button onClick={() => {
                                const current = Array.isArray(form.metodo_tp) ? form.metodo_tp : [form.metodo_tp]
                                const next = current.includes('con_parciales') ? current.filter(t => t !== 'con_parciales') : [...current, 'con_parciales']
                                updateForm('metodo_tp', next)
                              }} className={`relative w-10 h-5 rounded-full shadow-inner transition-all ${Array.isArray(form.metodo_tp) && form.metodo_tp.includes('con_parciales') ? 'bg-primary' : 'bg-border'}`}><div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow-lg transition-all ${Array.isArray(form.metodo_tp) && form.metodo_tp.includes('con_parciales') ? 'left-5.5':'left-0.5'}`} /></button>
                           </div>
                           <p className="text-[9px] text-muted font-bold leading-tight">Los TPs promedian junto con los parciales.</p>
                           {(Array.isArray(form.metodo_tp) && form.metodo_tp.includes('con_parciales')) && (
                             <div className="pt-2 animate-fade-in"><label className="text-[9px] font-black text-primary uppercase block mb-1">Cantidad de TPs:</label><input type="number" value={form.cant_tps_con_parciales || 0} onChange={e=>updateForm('cant_tps_con_parciales', parseInt(e.target.value))} className="w-full bg-white border border-primary/30 rounded-xl px-3 py-2 text-sm font-black text-primary" placeholder="0" /></div>
                           )}
                        </div>
                     </div>
                  </div>
               )}
            </div>
          </div>
        )}

        {/* ERROR / NAVIGATION */}
        {error && <div className="mt-6 p-4 bg-danger/10 border-2 border-danger/20 rounded-3xl text-danger text-sm font-bold flex items-center gap-3"><Settings className="w-4 h-4"/> {error}</div>}

        <div className="flex items-center justify-between mt-10 pt-8 border-t border-border no-print">
          <button onClick={() => setStep(step - 1)} disabled={step === 1} className="flex items-center gap-2 px-6 py-3 text-sm font-black uppercase text-muted disabled:opacity-30 hover:text-foreground transition-all"><ArrowLeft className="w-5 h-5" /> Anterior</button>
          {step < 4 ? (<button onClick={() => setStep(step + 1)} disabled={!canGoNext()} className="flex items-center gap-2 px-10 py-3.5 bg-primary text-white text-sm font-black uppercase rounded-2xl shadow-xl shadow-primary/30 hover:scale-105 active:scale-95 transition-all disabled:opacity-40 disabled:shadow-none">Siguiente <ArrowRight className="w-5 h-5" /></button>) : (<button onClick={handleSubmit} disabled={loading} className="px-12 py-4 bg-gradient-to-r from-primary to-primary-dark text-white text-sm font-black uppercase rounded-2xl shadow-2xl hover:scale-105 active:scale-95 transition-all">{loading ? 'Procesando...' : 'Finalizar y Crear'}</button>)}
        </div>

        {/* STYLES PRINT */}
        <style jsx global>{`
          @media print {
            .no-print { display: none !important; }
            body { background: white !important; color: black !important; padding: 0 !important; }
            .wizard-container { max-width: 100% !important; margin: 0 !important; }
            .wizard-content { border: none !important; background: transparent !important; padding: 0 !important; width: 100% !important; }
            
            ${form.agenda_rota_practicas ? `
              .wizard-header, .wizard-nav, .wizard-content > div:not(.master-schedule-section), .wizard-container > div:not(.wizard-content) { display: none !important; }
              .master-schedule-section { display: block !important; width: 100% !important; background: white !important; }
              .pdf-header { display: block !important; }
            ` : ''}
          }
        `}</style>
      </div>
    </div>
  )
}
