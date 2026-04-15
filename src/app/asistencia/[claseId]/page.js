'use client'

import { useState, useEffect, use } from 'react'
import { createClient } from '@/lib/supabase/client'
import { 
  CheckCircle, 
  AlertCircle, 
  Loader2, 
  ShieldCheck, 
  User,
  ArrowRight
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Script from 'next/script'

export default function AsistenciaPublicaPage({ params }) {
  const unwrappedParams = use(params)
  const claseId = unwrappedParams.claseId
  const [clase, setClase] = useState(null)
  const [catedra, setCatedra] = useState(null)
  const [dni, setDni] = useState('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [status, setStatus] = useState('idle') // idle, success, error, pending_enrollment
  const [errorMsg, setErrorMsg] = useState('')
  
  const supabase = createClient()

  useEffect(() => {
    fetchClaseInfo()
  }, [claseId])

  const fetchClaseInfo = async () => {
    let { data: claseData, error: claseErr } = await supabase
      .from('clases')
      .select('*, catedras(*)')
      .eq('id', claseId)
      .single()
    
    if (claseErr || !claseData) {
      setStatus('error')
      setErrorMsg('El código de asistencia no es válido o ha expirado.')
      setLoading(false)
      return
    }

    // --- LÓGICA DE QR PERMANENTE (INTUITIVA) ---
    // Usamos Intl.DateTimeFormat con timezone explícito de Argentina
    // para evitar errores si el dispositivo tiene otra zona horaria configurada.
    const today = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'America/Argentina/Buenos_Aires'
    }).format(new Date())

    if (claseData.fecha !== today) {
      console.log(`QR de otra fecha detectado (${claseData.fecha}). Buscando clase de hoy (${today})...`)
      
      // Buscamos si ya existe una clase para hoy creada por el docente
      const { data: todayClase } = await supabase
        .from('clases')
        .select('*, catedras(*)')
        .eq('catedra_id', claseData.catedra_id)
        .eq('fecha', today)
        .single()
      
      if (todayClase) {
        // Redirigir a la clase de hoy
        router.replace(`/asistencia/${todayClase.id}`)
        return
      } else {
        // No existe clase para hoy: el docente no abrió sesión todavía.
        // NO intentamos crear la clase desde el lado del alumno (RLS lo bloquearía)
        // → Mostramos error claro para que el alumno avise al docente.
        setStatus('error')
        setErrorMsg(
          `Este QR corresponde a la clase del ${claseData.fecha}. ` +
          `No hay una sesión activa para hoy (${today}). ` +
          `Pedile al docente que abra la sesión desde el sistema.`
        )
        setLoading(false)
        return
      }
    }

    setClase(claseData)
    setCatedra(claseData.catedras)
    setLoading(false)
  }

  const getDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371e3 // metros
    const φ1 = lat1 * Math.PI/180
    const φ2 = lat2 * Math.PI/180
    const Δφ = (lat2-lat1) * Math.PI/180
    const Δλ = (lon2-lon1) * Math.PI/180
    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ/2) * Math.sin(Δλ/2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
    return R * c
  }

  const handleRegister = async (e) => {
    e.preventDefault()
    if (!dni.trim()) return

    setSubmitting(true)
    setErrorMsg('')

    let lat = null, lon = null, dist = null, verified = false

    // Intentar obtener ubicación
    try {
      if (navigator.geolocation) {
        const pos = await Promise.race([
          new Promise((res, rej) => {
            navigator.geolocation.getCurrentPosition(res, rej, { 
              enableHighAccuracy: true,
              timeout: 4000 
            })
          }),
          new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), 4500))
        ])
        lat = pos.coords.latitude
        lon = pos.coords.longitude
        
        if (clase?.latitud && clase?.longitud) {
          dist = getDistance(lat, lon, clase.latitud, clase.longitud)
          verified = dist <= 300 // Margen de 300 metros
        }
      }
    } catch (err) {
      console.warn("No se pudo obtener la ubicación", err)
    }

    const { data: inscripcion } = await supabase
      .from('inscripciones')
      .select('id, nombre_estudiante, apellido_estudiante')
      .eq('catedra_id', catedra.id)
      .eq('dni_estudiante', dni.trim())
      .single()

    const attendanceData = {
      clase_id: clase.id,
      estado: inscripcion ? 'presente' : 'pendiente_inscripcion',
      hora_registro: new Date().toISOString(),
      latitud: lat,
      longitud: lon,
      distancia_m: dist,
      ubicacion_verificada: verified || (!clase?.latitud) // Si el docente no fijó, lo aceptamos como "verificado por omisión" o podemos dejarlo en false. El docente decidió "decidirá él".
    }

    if (inscripcion) {
      attendanceData.inscripcion_id = inscripcion.id
      const { error: asistErr } = await supabase.from('asistencias').insert(attendanceData)
      
      if (asistErr && asistErr.code === '23505') {
        setStatus('success')
      } else if (asistErr) {
        setStatus('error')
        setErrorMsg('Error al registrar la asistencia. Reintentá.')
      } else {
        setStatus('success')
        triggerConfetti()
      }
    } else {
      const { data: newInsc, error: inscErr } = await supabase
        .from('inscripciones')
        .upsert({
          catedra_id: catedra.id,
          dni_estudiante: dni.trim(),
          estado: 'pendiente'
        }, { onConflict: 'catedra_id, dni_estudiante' })
        .select().single()

      if (!inscErr && newInsc) {
        attendanceData.inscripcion_id = newInsc.id
        await supabase.from('asistencias').insert(attendanceData)
        setStatus('pending_enrollment')
      } else {
        setStatus('error')
        setErrorMsg('No pudimos procesar tu DNI. Contactá al docente.')
      }
    }

    setSubmitting(false)
  }

  const triggerConfetti = () => {
    if (window.confetti) {
      window.confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#3b82f6', '#10b981', '#6366f1']
      })
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center">
        <Loader2 className="w-12 h-12 text-primary animate-spin mb-4" />
        <p className="text-muted font-medium animate-pulse">Verificando sesión segura...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
      <Script 
        src="https://cdn.jsdelivr.net/npm/canvas-confetti@1.6.0/dist/confetti.browser.min.js"
        strategy="beforeInteractive"
      />
      {/* Brand */}
      <div className="absolute top-8 flex items-center gap-2">
        <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-primary/20 bg-white shadow-sm p-1">
          <img src="/logo.png" alt="Logo Presente" className="w-full h-full object-contain" />
        </div>
        <span className="text-xl font-bold text-foreground">Presente</span>
      </div>

      <div className="w-full max-w-md">
        {status === 'idle' && (
          <div className="bg-surface border border-border rounded-3xl p-8 shadow-xl shadow-primary/5 animate-fade-in">
            <div className="text-center mb-8">
              <h1 className="text-2xl font-bold text-foreground mb-2">Registrar Asistencia</h1>
              <p className="text-muted font-medium">
                {catedra?.nombre}
              </p>
              <div className="mt-4 inline-flex items-center gap-2 px-3 py-1 bg-primary/10 text-primary text-xs font-bold rounded-full uppercase tracking-wider">
                <ShieldCheck className="w-3.5 h-3.5" />
                Verificación Segura
              </div>
            </div>

            <form onSubmit={handleRegister} className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-foreground mb-2">
                  Ingresá tu DNI
                </label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted" />
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={dni}
                    onChange={(e) => setDni(e.target.value.replace(/\D/g, ''))}
                    placeholder="Ej: 12345678"
                    required
                    className="w-full pl-12 pr-4 py-4 bg-background border border-border rounded-2xl text-foreground text-lg placeholder:text-muted/60 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting || !dni}
                className="w-full py-4 bg-primary text-white font-bold rounded-2xl hover:bg-primary-dark transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 group"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Procesando...
                  </>
                ) : (
                  <>
                    Registrar mi Presente
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
            </form>
          </div>
        )}

        {status === 'success' && (
          <div className="bg-surface border border-border rounded-3xl p-10 text-center shadow-2xl shadow-success/10 animate-fade-in relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-success" />
            <div className="w-20 h-20 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-10 h-10 text-success" />
            </div>
            <h2 className="text-3xl font-extrabold text-foreground mb-4">¡Presente registrado!</h2>
            <p className="text-muted text-lg mb-4 leading-relaxed">
              Tu asistencia en <strong className="text-foreground">{catedra?.nombre}</strong> ha sido verificada con éxito.
            </p>
            <div className="text-sm text-muted bg-background py-3 px-4 rounded-xl inline-block mb-8">
              {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}hs · {new Date().toLocaleDateString('es-AR')}
            </div>
            
            <Link 
              href={`/alumno/${dni}`}
              className="w-full py-4 bg-foreground text-background font-bold rounded-2xl hover:opacity-90 transition-all flex items-center justify-center gap-2 group"
            >
              Ver mi Estado Académico
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        )}

        {status === 'pending_enrollment' && (
          <div className="bg-surface border border-border rounded-3xl p-10 text-center shadow-2xl shadow-warning/10 animate-fade-in relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-warning" />
            <div className="w-20 h-20 rounded-full bg-warning/10 flex items-center justify-center mx-auto mb-6">
              <AlertCircle className="w-10 h-10 text-warning" />
            </div>
            <h2 className="text-2xl font-bold text-foreground mb-4">Inscripción Pendiente</h2>
            <p className="text-muted mb-6 leading-relaxed">
              Tu DNI no se encuentra en el listado oficial de <strong className="text-foreground">{catedra?.nombre}</strong> todavía. 
            </p>
            <div className="p-4 bg-warning/5 border border-warning/20 rounded-2xl text-sm text-warning/90 text-left mb-8">
              <p className="font-bold mb-1">No te preocupes:</p>
              Tu asistencia quedó registrada como <strong>pendiente</strong>. Se validará automáticamente cuando el docente cargue el listado definitivo de la cátedra.
            </div>

            <Link 
              href={`/alumno/${dni}`}
              className="w-full py-4 bg-foreground text-background font-bold rounded-2xl hover:opacity-90 transition-all flex items-center justify-center gap-2 group"
            >
              Ver mi Estado Académico
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        )}

        {status === 'error' && (
          <div className="bg-surface border border-border rounded-3xl p-10 text-center shadow-xl animate-fade-in relative overflow-hidden">
             <div className="absolute top-0 left-0 w-full h-1 bg-danger" />
            <div className="w-16 h-16 rounded-full bg-danger/10 flex items-center justify-center mx-auto mb-6">
              <AlertCircle className="w-8 h-8 text-danger" />
            </div>
            <h2 className="text-xl font-bold text-foreground mb-2">¡Ups! Algo salió mal</h2>
            <p className="text-muted mb-8">{errorMsg}</p>
            <button
              onClick={() => {
                setDni('')
                setStatus('idle')
              }}
              className="w-full py-3 bg-foreground text-background font-bold rounded-xl hover:opacity-90 transition-all"
            >
              Intentar de nuevo
            </button>
          </div>
        )}
      </div>

      <p className="mt-12 text-sm text-muted">
        ¿Problemas con el registro? Avisale a tu docente.
      </p>
    </div>
  )
}
