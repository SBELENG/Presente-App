'use client'

import { useState, useEffect, use, useMemo, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  ArrowLeft,
  Download,
  Search,
  Check,
  X as XIcon,
  Minus,
  Loader2,
  Users,
  BookOpen,
  FlaskConical,
  AlertTriangle,
  CalendarOff,
  Save,
  Pencil,
  Shield,
  ArrowUp,
  ArrowDown
} from 'lucide-react'
import Link from 'next/link'
import * as XLSX from 'xlsx'

// ─── Helpers ──────────────────────────────────────────────────────────────────

const DIAS_MAP = { lunes: 1, martes: 2, miercoles: 3, jueves: 4, viernes: 5, sabado: 6, domingo: 0 }

function generarFechas(fechaInicio, fechaFin, diasSemana = []) {
  if (!fechaInicio || !fechaFin || diasSemana.length === 0) return []
  const resultado = []
  const inicio = new Date(fechaInicio + 'T12:00:00')
  const fin = new Date(fechaFin + 'T12:00:00')
  const diasNums = diasSemana.map(d => DIAS_MAP[d]).filter(n => n !== undefined)
  const cur = new Date(inicio)
  while (cur <= fin) {
    if (diasNums.includes(cur.getDay())) resultado.push(new Date(cur))
    cur.setDate(cur.getDate() + 1)
  }
  return resultado
}

function fmtCorto(d) {
  return d.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit' })
}

function fmtLargo(d) {
  return d.toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
}

function letraDia(d) {
  return d.toLocaleDateString('es-AR', { weekday: 'short' })[0].toUpperCase()
}

// ─── Tipos de excepción ─────────────────────────────────────────────────────

const EXCEPCIONES = [
  { value: 'normal',     label: 'Clase normal',  color: 'text-success',  bg: 'bg-success/10',  desc: '' },
  { value: 'feriado',    label: 'Feriado',        color: 'text-danger',   bg: 'bg-danger/10',   desc: 'Día no laborable por ley' },
  { value: 'asueto',     label: 'Asueto',         color: 'text-warning',  bg: 'bg-warning/10',  desc: 'Día de descanso otorgado' },
  { value: 'paro',       label: 'Paro / Huelga',  color: 'text-accent',   bg: 'bg-accent/10',   desc: 'Medida de fuerza docente' },
  { value: 'suspension', label: 'Suspensión',    color: 'text-muted',    bg: 'bg-muted/10',    desc: 'Suspensión por otro motivo' },
]

// ─── Exceptions Panel ─────────────────────────────────────────────────────────

function ExceptionsPanel({ open, onClose, allFechas, clases, catedraId, onSaved }) {
  const supabase = createClient()
  const [changes, setChanges] = useState({})   // { 'YYYY-MM-DD': { estado_clase, descripcion } }
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  // Build current state from clases
  const getClase = useCallback((fecha) => {
    const fs = typeof fecha === 'string' ? fecha : fecha.toISOString().split('T')[0]
    return clases.find(c => c.fecha === fs)
  }, [clases])

  const getEstado = (fecha) => {
    const fs = fecha.toISOString().split('T')[0]
    if (changes[fs]) return changes[fs].estado_clase
    return getClase(fecha)?.estado_clase || 'normal'
  }

  const getDesc = (fecha) => {
    const fs = fecha.toISOString().split('T')[0]
    if (changes[fs]?.descripcion !== undefined) return changes[fs].descripcion
    return getClase(fecha)?.descripcion || getClase(fecha)?.tema || ''
  }

  const setEstado = (fecha, estado) => {
    const fs = fecha.toISOString().split('T')[0]
    setChanges(prev => ({ ...prev, [fs]: { ...prev[fs], estado_clase: estado } }))
    setSaved(false)
  }

  const setDesc = (fecha, desc) => {
    const fs = fecha.toISOString().split('T')[0]
    setChanges(prev => ({ ...prev, [fs]: { ...prev[fs], descripcion: desc } }))
    setSaved(false)
  }

  const [errorText, setErrorText] = useState(null)

  const handleSave = async () => {
    setSaving(true)
    setErrorText(null)
    const entries = Object.entries(changes)
    for (const [fechaStr, change] of entries) {
      const existing = clases.find(c => c.fecha === fechaStr)
      if (existing) {
        const { error: err } = await supabase.from('clases').update({
          estado_clase: change.estado_clase,
          ...(change.descripcion !== undefined ? { tema: change.descripcion } : {})
        }).eq('id', existing.id)
        if (err) {
          console.error("Error updating exception:", err)
          setErrorText(err.message)
          setSaving(false)
          return
        }
      } else {
        // Create a minimal class record to store the exception
        const { error: err } = await supabase.from('clases').insert({
          catedra_id: catedraId,
          fecha: fechaStr,
          estado_clase: change.estado_clase || 'normal',
          tema: change.descripcion || '',
          tipo: 'teorico_practica',
        })
        if (err) {
          console.error("Error inserting exception:", err)
          setErrorText(err.message)
          setSaving(false)
          return
        }
      }
    }
    setSaving(false)
    setSaved(true)
    setChanges({})
    onSaved()
  }

  const pendingCount = Object.keys(changes).length
  const exceptionCount = allFechas.filter(f => getEstado(f) !== 'normal').length

  if (!open) return null

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 transition-opacity"
        onClick={onClose}
      />
      {/* Drawer */}
      <div className="fixed right-0 top-0 h-full w-full max-w-md bg-surface border-l border-border z-50 flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-border shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-warning/10 flex items-center justify-center">
              <CalendarOff className="w-5 h-5 text-warning" />
            </div>
            <div>
              <h2 className="font-bold text-foreground">Gestionar Excepciones</h2>
              <p className="text-xs text-muted">{allFechas.length} fechas · {exceptionCount} marcadas como excepción</p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-xl bg-surface-hover flex items-center justify-center hover:bg-danger/10 transition-colors">
            <XIcon className="w-4 h-4 text-muted" />
          </button>
        </div>

        {/* Info banner */}
        <div className="px-6 py-3 bg-info/5 border-b border-border shrink-0">
          <p className="text-[11px] text-muted leading-relaxed">
            <Shield className="w-3 h-3 inline mr-1 text-info" />
            Las fechas marcadas como excepción (feriado, paro, etc.) <strong>no cuentan</strong> en el porcentaje de asistencia. Podés marcarlas antes o después de que ocurran.
          </p>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-1.5">
          {allFechas.map((f, i) => {
            const fs = f.toISOString().split('T')[0]
            const estado = getEstado(f)
            const desc = getDesc(f)
            const excObj = EXCEPCIONES.find(e => e.value === estado) || EXCEPCIONES[0]
            const isChanged = !!changes[fs]
            return (
              <div key={i} className={`rounded-2xl border transition-all ${estado !== 'normal' ? 'border-warning/30 bg-warning/5' : 'border-border bg-background'}`}>
                {/* Date row */}
                <div className="flex items-center gap-3 px-4 py-3">
                  {/* Date badge */}
                  <div className={`w-12 text-center shrink-0 py-1.5 rounded-xl ${excObj.bg}`}>
                    <p className={`text-[9px] font-bold uppercase leading-none ${excObj.color}`}>
                      {f.toLocaleDateString('es-AR', { weekday: 'short' })}
                    </p>
                    <p className={`text-base font-black leading-tight ${excObj.color}`}>{f.getDate()}</p>
                    <p className={`text-[8px] uppercase leading-none opacity-70 ${excObj.color}`}>
                      {f.toLocaleDateString('es-AR', { month: 'short' })}
                    </p>
                  </div>

                  {/* Estado selector */}
                  <div className="flex-1 min-w-0">
                    <select
                      value={estado}
                      onChange={e => setEstado(f, e.target.value)}
                      className={`w-full px-3 py-1.5 rounded-xl text-xs font-bold border focus:outline-none focus:ring-1 focus:ring-primary transition-all ${
                        estado === 'normal'
                          ? 'bg-surface border-border text-muted'
                          : `${excObj.bg} border-current ${excObj.color}`
                      }`}
                    >
                      {EXCEPCIONES.map(e => (
                        <option key={e.value} value={e.value}>{e.label}</option>
                      ))}
                    </select>
                    {isChanged && (
                      <p className="text-[9px] text-warning mt-0.5 font-bold">● Cambio pendiente de guardar</p>
                    )}
                  </div>
                </div>

                {/* Description row — only when exception */}
                {estado !== 'normal' && (
                  <div className="px-4 pb-3">
                    <input
                      type="text"
                      placeholder="Motivo o descripción (opcional)..."
                      value={desc}
                      onChange={e => setDesc(f, e.target.value)}
                      className="w-full px-3 py-1.5 bg-surface border border-border rounded-xl text-[11px] focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Footer / Save */}
        <div className="px-6 py-4 border-t border-border shrink-0">
          {errorText && (
            <div className="mb-3 p-3 bg-danger/10 border border-danger/20 rounded-xl flex items-start gap-2 text-danger">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <p className="text-[11px] font-bold">{errorText}</p>
            </div>
          )}
          {saved && !errorText && (
            <div className="flex items-center gap-2 text-success text-xs font-bold mb-3">
              <Check className="w-4 h-4" /> Cambios guardados correctamente
            </div>
          )}
          <button
            onClick={handleSave}
            disabled={saving || pendingCount === 0}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-primary text-white font-bold rounded-2xl shadow-lg shadow-primary/20 hover:-translate-y-0.5 transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:translate-y-0"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {pendingCount > 0 ? `Guardar ${pendingCount} cambio${pendingCount > 1 ? 's' : ''}` : 'Sin cambios pendientes'}
          </button>
          <p className="text-[10px] text-muted text-center mt-2">
            Los cambios se aplican a la Matriz de Asistencia en tiempo real.
          </p>
        </div>
        <div className="mt-8 text-center text-[8px] text-muted/30 font-mono uppercase tracking-[0.2em] border-t border-border/10 pt-4">
           Ref: Build 2026-03-22-1925 · Cumulative Logic Active
        </div>
      </div>
    </>
  )
}

function getComisionAlumno(apellido, comisiones) {
  if (!comisiones?.length) return null
  const primera = (apellido || '').trim()[0]?.toUpperCase()
  if (!primera) return null
  for (const com of comisiones) {
    if (!com.desde || !com.hasta) continue
    if (primera >= com.desde.toUpperCase() && primera <= com.hasta.toUpperCase()) return com
  }
  return null
}

// ─── Compact Cell ─────────────────────────────────────────────────────────────

function Cell({ status, isException, isFuture, excState }) {
  if (isException) return (
    <div className="flex items-center justify-center h-9 group/exc relative">
       <Minus className="w-3 h-3 text-warning/50 stroke-[3px]" />
    </div>
  )
  if (isFuture) return <div className="flex items-center justify-center h-9"><div className="w-1 h-1 rounded-full bg-border/50" /></div>
  if (status === 'presente') return (
    <div className="flex items-center justify-center h-9">
      <div className="w-6 h-6 rounded-full bg-success/12 flex items-center justify-center">
        <Check className="w-3.5 h-3.5 text-success" strokeWidth={3} />
      </div>
    </div>
  )
  if (status === 'pendiente_inscripcion') return (
    <div className="flex items-center justify-center h-9">
      <div className="w-6 h-6 rounded-full bg-warning/10 flex items-center justify-center">
        <Minus className="w-3 h-3 text-warning" />
      </div>
    </div>
  )
  return (
    <div className="flex items-center justify-center h-9">
      <div className="w-6 h-6 rounded-full flex items-center justify-center">
        <XIcon className="w-3.5 h-3.5 text-danger/35" strokeWidth={2.5} />
      </div>
    </div>
  )
}

// ─── Section Table ─────────────────────────────────────────────────────────────

function AttendanceTable({ label, fechas, alumnos, asistencias, clases, requerido, colorClass }) {
  const getClase = (fecha) => {
    const fs = fecha.toISOString().split('T')[0]
    return clases.find(c => c.fecha === fs)
  }
  const getStatus = (inscId, fecha) => {
    const clase = getClase(fecha)
    if (!clase) return 'future'
    return asistencias.find(a => a.inscripcion_id === inscId && a.clase_id === clase.id)?.estado || 'ausente'
  }
  const isExc = (fecha) => {
    const clase = getClase(fecha)
    return clase ? clase.estado_clase !== 'normal' : false
  }
  const tomadas = fechas.filter(f => getClase(f))
  const validasProyectadas = fechas.filter(f => !isExc(f))

  const calcPct = (alumnoId) => {
    if (validasProyectadas.length === 0) return null
    const p = tomadas.filter(f => !isExc(f) && getStatus(alumnoId, f) === 'presente').length
    return Math.round((p / validasProyectadas.length) * 100)
  }

  if (!fechas.length) return null

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left border-collapse text-xs">
        <thead>
          <tr className="border-b border-border bg-surface-hover/20">
            <th className="sticky left-0 z-20 bg-surface px-4 py-3 font-bold text-[10px] uppercase tracking-widest text-muted border-r border-border min-w-[170px]">
              Alumno
            </th>
            <th className="px-3 py-3 font-bold text-[10px] uppercase tracking-widest text-muted text-center border-r border-border min-w-[56px] whitespace-nowrap">
              % Asist.
            </th>
            <th className="px-3 py-3 font-bold text-[10px] uppercase text-muted text-center border-r border-border min-w-[50px]">
              P / F
            </th>
            {fechas.map((f, i) => {
              const exc = isExc(f)
              const claseObj = exc ? getClase(f) : null
              return (
              <th key={i} className={`group relative border-r border-border/50 min-w-[38px] max-w-[38px] p-0 ${exc ? 'bg-warning/10' : ''}`}>
                <div className={`flex flex-col items-center py-2 px-0.5 ${exc ? 'text-warning' : ''}`}>
                  <span className={`text-[8px] font-bold ${exc ? 'opacity-80' : colorClass}`}>{letraDia(f)}</span>
                  <span className={`text-[11px] font-bold leading-none ${exc ? 'opacity-100' : 'text-foreground'}`}>{f.getDate()}</span>
                  <span className={`text-[7px] uppercase leading-none ${exc ? 'opacity-60' : 'text-muted/50'}`}>
                    {f.toLocaleDateString('es-AR', { month: 'short' })}
                  </span>
                </div>
                {/* Tooltip fecha */}
                <div className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-1 z-50 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                  <div className="bg-foreground text-background text-[9px] rounded-lg px-2 py-1.5 shadow-xl text-center">
                    <p className={exc ? "opacity-70" : ""}>{f.toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
                    {exc && (
                      <p className="font-bold text-warning capitalize mt-0.5 border-t border-white/10 pt-0.5">
                        {claseObj?.estado_clase} {claseObj?.tema ? `(${claseObj.tema})` : ''}
                      </p>
                    )}
                  </div>
                </div>
              </th>
            )})}
          </tr>
        </thead>
        <tbody className="divide-y divide-border/40">
          {alumnos.map((a) => {
            const pct = calcPct(a.id)
            const pctOk = pct === null || pct >= requerido
            const presentes = tomadas.filter(f => !isExc(f) && getStatus(a.id, f) === 'presente').length
            const faltas = tomadas.filter(f => !isExc(f) && getStatus(a.id, f) === 'ausente').length

            // Cálculo predictivo
            const validasProyectadas = fechas.filter(f => !isExc(f)).length
            const validasTomadas = tomadas.filter(f => !isExc(f)).length
            const clasesRestantes = validasProyectadas - validasTomadas
            const maxPosibles = presentes + clasesRestantes
            const necesarios = Math.ceil(validasProyectadas * (requerido / 100))
            const cannotPass = maxPosibles < necesarios

            return (
              <tr key={a.id} className="hover:bg-surface-hover/25 transition-colors group">
                <td className="sticky left-0 z-10 bg-surface px-4 py-1.5 border-r border-border group-hover:bg-surface-hover/25 transition-colors">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-[9px] font-bold text-primary uppercase shrink-0">
                      {a.apellido_estudiante?.[0]}{a.nombre_estudiante?.[0]}
                    </div>
                    <div className="min-w-0">
                      <p className="text-[11px] font-bold text-foreground truncate max-w-[110px]">
                        {a.apellido_estudiante}, {a.nombre_estudiante}
                      </p>
                      <p className="text-[9px] text-muted font-mono">{a.dni_estudiante}</p>
                    </div>
                  </div>
                </td>
                <td className="px-3 py-1.5 text-center border-r border-border">
                  <div className="group/alert relative inline-flex items-center gap-1">
                    {pct === null
                      ? <span className="text-[10px] text-muted/40">—</span>
                      : <span className={`text-sm font-black ${pctOk ? 'text-success' : 'text-danger'}`}>{pct}%</span>
                    }
                    {cannotPass && validasProyectadas.length > 0 && (
                      <AlertTriangle className="w-3.5 h-3.5 text-danger animate-pulse" />
                    )}
                    
                    {cannotPass && validasProyectadas.length > 0 && (
                      <div className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50 opacity-0 group-hover/alert:opacity-100 transition-opacity whitespace-nowrap">
                        <div className="bg-danger text-white text-[10px] rounded-lg px-3 py-2 shadow-xl text-center">
                          <p className="font-bold border-b border-white/20 pb-1 mb-1">Riesgo Académico</p>
                          <p>Incluso asistiendo perfecto a las {clasesRestantes} clases que faltan,</p>
                          <p>solo llegaría a un {Math.round((maxPosibles / validasProyectadas.length) * 100)}% (requiere {requerido}%).</p>
                        </div>
                      </div>
                    )}
                  </div>
                </td>
                <td className="px-2 py-1.5 text-center border-r border-border">
                  <div className="flex flex-col items-center gap-0">
                    <span className="text-[10px] font-bold text-success leading-tight">{presentes}P</span>
                    <span className="text-[10px] font-bold text-danger/40 leading-tight">{faltas}F</span>
                  </div>
                </td>
                {fechas.map((f, i) => {
                  const clase = getClase(f)
                  const status = getStatus(a.id, f)
                  const exc = isExc(f)
                  const rec = asistencias.find(as => as.inscripcion_id === a.id && clase && as.clase_id === clase.id)
                  return (
                    <td key={i} className={`border-r border-border/40 p-0 group/cell relative ${exc ? 'bg-warning/10 transition-colors' : ''}`}>
                      <Cell status={status} isException={exc} isFuture={!clase} excState={clase?.estado_clase} />
                      {rec && (
                        <div className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-1 z-50 opacity-0 group-hover/cell:opacity-100 transition-opacity whitespace-nowrap">
                          <div className="bg-foreground text-background text-[9px] rounded-xl px-2.5 py-2 shadow-xl border border-white/10">
                            <p className="font-bold pb-0.5 mb-0.5 border-b border-white/10">{fmtCorto(f)}</p>
                            {rec.hora_registro && <p>⏱ {new Date(rec.hora_registro).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>}
                            {rec.distancia_m != null && (
                              <p className={rec.ubicacion_verificada ? 'text-green-300' : 'text-red-300'}>
                                📍 {Math.round(rec.distancia_m)}m
                              </p>
                            )}
                          </div>
                        </div>
                      )}
                    </td>
                  )
                })}
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

export default function AsistenciaDetallePage({ params }) {
  const { id } = use(params)
  const [catedra, setCatedra] = useState(null)
  const [alumnos, setAlumnos] = useState([])
  const [asistencias, setAsistencias] = useState([])
  const [clases, setClases] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [activeTab, setActiveTab] = useState(0)
  const [showExceptions, setShowExceptions] = useState(false)

  const supabase = createClient()

  useEffect(() => { fetchData() }, [id])

  const fetchData = async () => {
    setLoading(true)
    const [catRes, studRes, clsRes] = await Promise.all([
      supabase.from('catedras').select('*').eq('id', id).single(),
      supabase.from('inscripciones').select('*').eq('catedra_id', id).order('apellido_estudiante'),
      supabase.from('clases').select('*').eq('catedra_id', id).order('fecha'),
    ])
    const cat = catRes.data
    const clsList = clsRes.data || []
    setCatedra(cat)
    setClases(clsList)
    setAlumnos(studRes.data || [])
    if (clsList.length > 0) {
      const { data: asist } = await supabase.from('asistencias').select('*').in('clase_id', clsList.map(c => c.id))
      setAsistencias(asist || [])
    }
    setLoading(false)
  }

  // ── Dates from config ──────────────────────────────────────────────────────

  const { fechasTeoria, fechasPractica, hasSplit, diasPracticaGlobal, esTeo, esPrac } = useMemo(() => {
    if (!catedra) return { fechasTeoria: [], fechasPractica: [], hasSplit: false, diasPracticaGlobal: [], esTeo: false, esPrac: false }

    const tipo = Array.isArray(catedra.tipo_clase) ? catedra.tipo_clase : [catedra.tipo_clase || 'teorico_practica']
    const esTeo = tipo.includes('teorica') || tipo.includes('teorico_practica')
    const esPrac = tipo.includes('practica') || tipo.includes('teorico_practica')
    const diasTeoria = catedra.dias_clase || []
    const diasPractica = (catedra.dias_practica && catedra.dias_practica.length > 0)
      ? catedra.dias_practica
      : diasTeoria

    let fT = esTeo ? generarFechas(catedra.fecha_inicio, catedra.fecha_fin, diasTeoria) : []
    let fP = []
    if (catedra.agenda_rota_practicas && esPrac) {
      fP = generarFechas(
        catedra.fecha_inicio_practica || catedra.fecha_inicio,
        catedra.fecha_fin_practica || catedra.fecha_fin,
        diasPractica
      )
    } else if (esPrac) {
      fP = generarFechas(catedra.fecha_inicio, catedra.fecha_fin, diasPractica)
    }
    
    // Defensa absoluta: Agregar fechas de clases reales que Next.js caché pudo haber forzado un día fuera de calendario
    clases.forEach(c => {
      const dbDate = new Date(c.fecha + 'T12:00:00')
      if (esTeo && c.tipo.includes('teorico') && !fT.some(fecha => fecha.getTime() === dbDate.getTime())) {
        fT.push(dbDate)
      }
      if (esPrac && c.tipo.includes('practic') && !fP.some(fecha => fecha.getTime() === dbDate.getTime())) {
        fP.push(dbDate)
      }
    })
    fT.sort((a, b) => a - b)
    fP.sort((a, b) => a - b)

    const split = fT.length > 0 && fP.length > 0
    return { fechasTeoria: fT, fechasPractica: fP, hasSplit: split, diasPracticaGlobal: diasPractica, esTeo, esPrac }
  }, [catedra, clases])

  // ── Filter alumnos ─────────────────────────────────────────────────────────

  const filteredAlumnos = useMemo(() =>
    alumnos.filter(a =>
      `${a.nombre_estudiante} ${a.apellido_estudiante} ${a.dni_estudiante}`
        .toLowerCase().includes(searchTerm.toLowerCase())
    ), [alumnos, searchTerm])

  // ── Helper: generate dates for a specific commission from bloques_semanales ─
  const getFechasForComision = (comIdx) => {
    if (!catedra) return []
    const bloques = catedra.bloques_semanales || {}
    
    // Determine practice days:
    //   1. Use dias_practica if explicitly set
    //   2. If agenda_rota_practicas, default to Mon-Sat (full week) — NOT dias_clase
    //   3. Otherwise fallback to dias_clase
    let diasNums
    const diasP = catedra.dias_practica  // may be null, undefined, or []
    if (diasP && diasP.length > 0) {
      diasNums = diasP.map(d => DIAS_MAP[d]).filter(n => n !== undefined)
    } else if (catedra.agenda_rota_practicas) {
      // Full-week rotation: include Mon (1) through Sat (6), exclude Sunday (0)
      diasNums = [1, 2, 3, 4, 5, 6]
    } else {
      diasNums = (catedra.dias_clase || []).map(d => DIAS_MAP[d]).filter(n => n !== undefined)
    }

    const fi = catedra.fecha_inicio_practica || catedra.fecha_inicio
    const ff = catedra.fecha_fin_practica || catedra.fecha_fin
    const inicio = fi ? new Date(fi + 'T12:00:00') : null
    const fin = ff ? new Date(ff + 'T12:00:00') : null

    const resultado = []

    Object.entries(bloques).forEach(([weekId, comIndices]) => {
      if (!Array.isArray(comIndices) || !comIndices.includes(comIdx)) return
      // Parse "YYYY-Www" → Monday of that ISO week
      const [yearStr, weekStr] = weekId.split('-W')
      const year = parseInt(yearStr)
      const week = parseInt(weekStr)
      // ISO week 1 contains Jan 4
      const jan4 = new Date(year, 0, 4, 12)
      const monday = new Date(jan4)
      monday.setDate(jan4.getDate() - (jan4.getDay() === 0 ? 6 : jan4.getDay() - 1) + (week - 1) * 7)
      // Check all 7 days of the week
      for (let d = 0; d < 7; d++) {
        const day = new Date(monday)
        day.setDate(monday.getDate() + d)
        if (!diasNums.includes(day.getDay())) continue
        if (inicio && fin) {
          if (day >= inicio && day <= fin) resultado.push(new Date(day))
        } else {
          resultado.push(new Date(day))
        }
      }
    })
    
    // Defensa absoluta para comisiones: incluir las clases grabadas reales
    clases.forEach(c => {
      const dbDate = new Date(c.fecha + 'T12:00:00')
      if (!resultado.some(fecha => fecha.getTime() === dbDate.getTime())) {
        resultado.push(dbDate)
      }
    })

    resultado.sort((a, b) => a - b)
    return resultado
  }

  // ── Build tabs ─────────────────────────────────────────────────────────────

  const tabs = useMemo(() => {
    const result = []
    if (fechasTeoria.length > 0) {
      result.push({
        id: 'teoria',
        label: hasSplit ? 'Teóricas' : 'Clases',
        icon: BookOpen,
        fechas: fechasTeoria,
        alumnos: filteredAlumnos,
        requerido: catedra?.asistencia_teoria || catedra?.porcentaje_asistencia || 80,
        colorClass: 'text-primary',
      })
    }

    const comisiones = catedra?.comisiones_division || []
    const bloques = catedra?.bloques_semanales || {}
    const hasBloquesData = Object.keys(bloques).length > 0

    if (esPrac && hasBloquesData && comisiones.length > 0) {
      comisiones.forEach((com, i) => {
        const comFechas = getFechasForComision(i)
        const comAlumnos = filteredAlumnos.filter(a =>
          getComisionAlumno(a.apellido_estudiante, comisiones) === com
        )
        result.push({
          id: `practica_${i}`,
          label: `Práctica · ${com.nombre || `Com. ${i + 1}`} (${com.desde}–${com.hasta})`,
          icon: FlaskConical,
          fechas: comFechas,
          alumnos: comAlumnos,
          requerido: catedra?.asistencia_practica || catedra?.porcentaje_asistencia || 80,
          colorClass: 'text-accent',
          comColor: com.color,
        })
      })
      const sinCom = filteredAlumnos.filter(a => !getComisionAlumno(a.apellido_estudiante, comisiones))
      if (sinCom.length > 0) {
        result.push({
          id: 'practica_otros',
          label: 'Práctica · Sin comisión',
          icon: FlaskConical,
          fechas: fechasPractica,
          alumnos: sinCom,
          requerido: catedra?.asistencia_practica || catedra?.porcentaje_asistencia || 80,
          colorClass: 'text-accent',
        })
      }
    } else if (esPrac && comisiones.length > 0) {
      comisiones.forEach((com, i) => {
        const comAlumnos = filteredAlumnos.filter(a =>
          getComisionAlumno(a.apellido_estudiante, comisiones) === com
        )
        const diasCom = (com.dias && com.dias.length > 0) ? com.dias : diasPracticaGlobal
        const comFechas = generarFechas(catedra?.fecha_inicio, catedra?.fecha_fin, diasCom)
        
        result.push({
          id: `practica_${i}`,
          label: `Práctica · ${com.nombre || `Com. ${i + 1}`} (${com.desde}–${com.hasta})`,
          icon: FlaskConical,
          fechas: comFechas,
          alumnos: comAlumnos,
          requerido: catedra?.asistencia_practica || catedra?.porcentaje_asistencia || 80,
          colorClass: 'text-accent',
          comColor: com.color,
        })
      })
      const sinCom = filteredAlumnos.filter(a => !getComisionAlumno(a.apellido_estudiante, comisiones))
      if (sinCom.length > 0 && fechasPractica.length > 0) {
        result.push({
          id: 'practica_otros',
          label: 'Práctica · Sin comisión',
          icon: FlaskConical,
          fechas: fechasPractica,
          alumnos: sinCom,
          requerido: catedra?.asistencia_practica || catedra?.porcentaje_asistencia || 80,
          colorClass: 'text-accent',
        })
      }
    } else if (esPrac && fechasPractica.length > 0) {
      result.push({
        id: 'practica',
        label: 'Prácticas',
        icon: FlaskConical,
        fechas: fechasPractica,
        alumnos: filteredAlumnos,
        requerido: catedra?.asistencia_practica || catedra?.porcentaje_asistencia || 80,
        colorClass: 'text-accent',
      })
    }
    return result
  }, [fechasTeoria, fechasPractica, filteredAlumnos, catedra, hasSplit, esTeo, esPrac, diasPracticaGlobal])

  const currentTab = tabs[activeTab] || tabs[0]

  // ── Export ─────────────────────────────────────────────────────────────────

  const exportToExcel = () => {
    if (!catedra || !currentTab) return
    const data = currentTab.alumnos.map(a => {
      const row = { 'Apellido': a.apellido_estudiante, 'Nombre': a.nombre_estudiante, 'DNI': a.dni_estudiante }
      currentTab.fechas.forEach(f => {
        const fs = f.toISOString().split('T')[0]
        const clase = clases.find(c => c.fecha === fs)
        if (!clase) { row[fmtCorto(f)] = ''; return }
        const rec = asistencias.find(as => as.inscripcion_id === a.id && as.clase_id === clase.id)
        row[fmtCorto(f)] = rec?.estado === 'presente' ? 'P' : 'A'
      })
      return row
    })
    const ws = XLSX.utils.json_to_sheet(data)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Asistencia')
    XLSX.writeFile(wb, `Asistencia_${catedra.nombre}_${currentTab.label}_${new Date().toLocaleDateString()}.xlsx`)
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  const scrollToTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });
  const scrollToBottom = () => window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });

  // All unique dates sorted for exceptions panel
  const allFechas = useMemo(() => {
    const map = new Map()
    tabs.forEach(t => {
      t.fechas.forEach(f => {
        const k = f.toISOString().split('T')[0]
        if (!map.has(k)) map.set(k, f)
      })
    })
    return [...map.values()].sort((a, b) => a - b)
  }, [tabs])

  if (loading) return (
    <div className="p-16 text-center">
      <Loader2 className="w-10 h-10 animate-spin mx-auto text-primary mb-3" />
      <p className="text-muted text-sm">Cargando historial de asistencia...</p>
    </div>
  )

  const noDates = fechasTeoria.length === 0 && fechasPractica.length === 0

  const exceptionCount = allFechas.filter(f => {
    const fs = f.toISOString().split('T')[0]
    const cl = clases.find(c => c.fecha === fs)
    return cl && cl.estado_clase !== 'normal'
  }).length

  return (
    <div className="max-w-[100vw] px-4 lg:px-6 py-6 animate-fade-in overflow-hidden pb-16">
      <ExceptionsPanel 
        open={showExceptions} 
        onClose={() => setShowExceptions(false)} 
        allFechas={allFechas} 
        clases={clases} 
        catedraId={id} 
        onSaved={fetchData} 
      />
      <div className="max-w-[1600px] mx-auto">

        {/* ── Header ────────────────────────────────────────────────────── */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <Link href={`/docente/catedras/${id}`} className="inline-flex items-center gap-2 text-sm text-muted hover:text-foreground transition-colors mb-2">
              <ArrowLeft className="w-4 h-4" /> Volver
            </Link>
            <h1 className="text-2xl font-bold text-foreground">Registro de Asistencia</h1>
            <p className="text-muted text-sm">{catedra?.nombre}</p>
          </div>
          <div className="flex items-center gap-2 self-start flex-wrap">
            {/* Excepciones button */}
            <button
              onClick={() => setShowExceptions(true)}
              className="flex items-center gap-2 px-4 py-2 bg-surface border border-border rounded-xl text-sm font-semibold hover:border-warning/50 transition-all relative"
            >
              <CalendarOff className="w-4 h-4 text-warning" />
              Excepciones
              {exceptionCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-warning text-background text-[9px] font-black rounded-full flex items-center justify-center">{exceptionCount}</span>
              )}
            </button>
            <button onClick={exportToExcel} className="flex items-center gap-2 px-4 py-2 bg-surface border border-border rounded-xl text-sm font-semibold hover:border-primary/50 transition-all">
              <Download className="w-4 h-4 text-primary" /> Exportar
            </button>
          </div>
        </div>

        {/* ── No dates warning ──────────────────────────────────────────── */}
        {noDates && (
          <div className="p-6 bg-warning/5 border border-warning/20 rounded-3xl flex items-center gap-4 mb-6">
            <AlertTriangle className="w-7 h-7 text-warning shrink-0" />
            <div>
              <h3 className="font-bold text-foreground text-sm">Sin fechas configuradas</h3>
              <p className="text-xs text-muted mt-1">
                La cátedra necesita <strong>fecha de inicio</strong>, <strong>fecha de fin</strong> y <strong>días de cursada</strong>. Andá a <strong>Configuración</strong> para completarlos.
              </p>
            </div>
          </div>
        )}

        {/* ── Search + Tabs ─────────────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-4">
          <div className="relative flex-1 min-w-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
            <input
              type="text"
              placeholder="Buscar alumno..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-surface border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
            />
          </div>
          <div className="flex items-center gap-1 text-xs text-muted bg-surface border border-border rounded-xl px-3 py-2 shrink-0">
            <Users className="w-3.5 h-3.5" />
            <span>{currentTab?.alumnos.length || 0} alumnos</span>
            <span className="mx-1">·</span>
            <span>{currentTab?.fechas.length || 0} fechas</span>
          </div>
        </div>

        {/* ── Tab selector ──────────────────────────────────────────────── */}
        {tabs.length > 1 && (
          <div className="flex flex-wrap gap-2 mb-4 p-1.5 bg-surface border border-border rounded-2xl w-fit">
            {tabs.map((tab, i) => {
              const Icon = tab.icon
              const isActive = activeTab === i
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(i)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                    isActive
                      ? 'bg-primary text-white shadow-md'
                      : 'text-muted hover:text-foreground hover:bg-surface-hover'
                  }`}
                  style={isActive && tab.comColor ? { backgroundColor: tab.comColor } : {}}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                  <span className={`px-1.5 py-0.5 rounded-md text-[9px] font-black ${isActive ? 'bg-white/20' : 'bg-border text-muted'}`}>
                    {tab.alumnos.length}
                  </span>
                </button>
              )
            })}
          </div>
        )}

        {/* ── Table ─────────────────────────────────────────────────────── */}
        {currentTab && (
          <div className="bg-surface border border-border rounded-3xl overflow-hidden shadow-sm">
            {/* Section header */}
            <div className="flex items-center justify-between px-5 py-3 border-b border-border bg-surface-hover/20">
              <div className="flex items-center gap-2.5">
                {(() => { const Icon = currentTab.icon; return <Icon className={`w-4 h-4 ${currentTab.colorClass}`} /> })()}
                <span className="text-sm font-bold text-foreground">{currentTab.label}</span>
                <span className="text-[10px] text-muted px-2 py-0.5 bg-background rounded-lg border border-border">
                  Asist. req. {currentTab.requerido}%
                </span>
              </div>
              <span className="text-[10px] text-muted">{currentTab.alumnos.length} alumnos · {currentTab.fechas.filter(f => clases.some(c => c.fecha === f.toISOString().split('T')[0])).length} clases tomadas de {currentTab.fechas.length}</span>
            </div>

            <AttendanceTable
              label={currentTab.label}
              fechas={currentTab.fechas}
              alumnos={currentTab.alumnos}
              asistencias={asistencias}
              clases={clases}
              requerido={currentTab.requerido}
              colorClass={currentTab.colorClass}
            />
          </div>
        )}

        {/* ── Legend ────────────────────────────────────────────────────── */}
        <div className="mt-5 flex flex-wrap items-center gap-5 p-4 bg-surface border border-border rounded-xl text-xs text-muted">
          <span className="font-bold text-[10px] uppercase tracking-widest opacity-50">Leyenda:</span>
          {[
            { icon: <div className="w-5 h-5 rounded-full bg-success/12 flex items-center justify-center"><Check className="w-3 h-3 text-success" strokeWidth={3} /></div>, label: 'Asistió' },
            { icon: <div className="w-5 h-5 rounded-full flex items-center justify-center"><XIcon className="w-3 h-3 text-danger/35" strokeWidth={2.5} /></div>, label: 'Faltó' },
            { icon: <div className="w-5 h-5 rounded-full bg-warning/10 flex items-center justify-center"><Minus className="w-3 h-3 text-warning" /></div>, label: 'Pendiente' },
            { icon: <Minus className="w-3 h-3 text-muted/20 mx-1" />, label: 'Excepción (feriado/paro)' },
            { icon: <div className="w-1 h-1 rounded-full bg-border/50 mx-2" />, label: 'Clase futura' },
          ].map((item, i) => (
            <div key={i} className="flex items-center gap-1.5">
              {item.icon}
              <span className="text-[10px]">{item.label}</span>
            </div>
          ))}
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
      
      <div className="mt-8 text-center text-[10px] text-muted/30 font-mono uppercase tracking-[0.2em] pb-12">
        Build: 2026-03-22-2012 · Cumulative Logic Cleanup
      </div>
    </div>
  )
}
