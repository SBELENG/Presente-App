'use client'

import { useState, useEffect, use } from 'react'
import { createClient } from '@/lib/supabase/client'
import { QRCodeSVG } from 'qrcode.react'
import { 
  ArrowLeft, 
  Maximize2, 
  Clock, 
  Users, 
  Loader2,
  RefreshCw,
  Printer,
  MapPin
} from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function QRProyectarPage({ params }) {
  const unwrappedParams = use(params)
  const id = unwrappedParams.id
  const [catedra, setCatedra] = useState(null)
  const [clase, setClase] = useState(null)
  const [loading, setLoading] = useState(true)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [attendanceCount, setAttendanceCount] = useState(0)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    fetchData()
  }, [id])

  useEffect(() => {
    if (!clase?.id) return
    
    // Realtime attendance count
    const channel = supabase
      .channel(`attendance_${clase.id}`)
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'asistencias',
        filter: `clase_id=eq.${clase.id}`
      }, (payload) => {
        if (payload.new.estado === 'presente') {
          setAttendanceCount(prev => prev + 1)
        }
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [clase?.id])

  const fetchData = async () => {
    setLoading(true)
    const { data: cat } = await supabase
      .from('catedras')
      .select('*')
      .eq('id', id)
      .single()
    
    setCatedra(cat)

    // Check for today's class or create it
    const tzDate = new Date()
    const offset = tzDate.getTimezoneOffset()
    const today = new Date(tzDate.getTime() - (offset * 60 * 1000)).toISOString().split('T')[0]
    
    const { data: existingClase } = await supabase
      .from('clases')
      .select('*')
      .eq('catedra_id', id)
      .eq('fecha', today)
      .single()

    if (existingClase) {
      setClase(existingClase)
    } else {
      const { data: newClase, error } = await supabase
        .from('clases')
        .insert({
          catedra_id: id,
          fecha: today,
          tipo: 'teorico_practica',
          tema: `Clase del ${today}`,
          estado_clase: 'normal'
        })
        .select()
        .single()
      
      if (!error) setClase(newClase)
    }

    setLoading(false)
    if (clase) fetchAttendanceCount()
  }

  const fetchAttendanceCount = async () => {
    if (!clase) return
    const { count } = await supabase
      .from('asistencias')
      .select('*', { count: 'exact', head: true })
      .eq('clase_id', clase.id)
      .eq('estado', 'presente')
    
    setAttendanceCount(count || 0)
  }

  const attendanceUrl = typeof window !== 'undefined' 
    ? `${window.location.origin}/asistencia/${clase?.id}` 
    : ''

  const [fixingLocation, setFixingLocation] = useState(false)

  const handleFixLocation = () => {
    if (!navigator.geolocation) {
      alert("Tu navegador no soporta geolocalización")
      return
    }
    setFixingLocation(true)
    navigator.geolocation.getCurrentPosition(async (pos) => {
      const { latitude, longitude } = pos.coords
      const { error } = await supabase
        .from('clases')
        .update({ latitud: latitude, longitud: longitude })
        .eq('id', clase.id)
      
      if (!error) {
        setClase({...clase, latitud: latitude, longitud: longitude})
        alert("📍 Ubicación fijada con éxito para esta clase.")
      }
      setFixingLocation(false)
    }, (err) => {
      alert("Error al obtener ubicación: " + err.message)
      setFixingLocation(false)
    }, { enableHighAccuracy: true })
  }

  return (
    <div className={`min-h-[80vh] flex flex-col items-center transition-all ${isFullscreen ? 'bg-white fixed inset-0 z-[100] p-12' : ''}`}>
      {!isFullscreen && (
        <div className="w-full max-w-2xl mb-8 flex items-center justify-between">
          <Link
            href={`/docente/catedras/${id}`}
            className="flex items-center gap-2 text-sm text-muted hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Volver a la cátedra
          </Link>
          <div className="flex items-center gap-3 no-print">
            <button 
              onClick={handleFixLocation}
              disabled={fixingLocation}
              className={`flex items-center gap-2 px-4 py-2 border rounded-xl text-sm font-medium transition-all ${clase?.latitud ? 'bg-success/10 border-success/30 text-success' : 'bg-surface border-border text-muted hover:border-primary/50'}`}
            >
              {fixingLocation ? <Loader2 className="w-4 h-4 animate-spin"/> : <MapPin className="w-4 h-4" />}
              {clase?.latitud ? 'Ubicación Fijada' : 'Fijar Ubicación'}
            </button>
            <button 
              onClick={() => window.print()}
              className="flex items-center gap-2 px-4 py-2 bg-surface border border-border rounded-xl text-sm font-medium hover:bg-surface-hover transition-colors"
            >
              <Printer className="w-4 h-4" />
              Imprimir / PDF
            </button>
            <button 
              onClick={() => setIsFullscreen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl text-sm font-medium hover:shadow-lg transition-all"
            >
              <Maximize2 className="w-4 h-4" />
              Pantalla completa
            </button>
          </div>
        </div>
      )}

      {isFullscreen && (
        <button 
          onClick={() => setIsFullscreen(false)}
          className="absolute top-8 right-8 p-3 bg-surface border border-border rounded-full hover:bg-surface-hover transition-colors z-[110]"
        >
          <ArrowLeft className="w-6 h-6 text-foreground" />
        </button>
      )}

      {/* QR Card */}
      <div className={`flex flex-col items-center text-center ${isFullscreen ? 'justify-center flex-1' : ''}`}>
        <h1 className={`font-bold text-foreground mb-2 ${isFullscreen ? 'text-5xl mb-6' : 'text-2xl'}`}>
          {catedra?.nombre}
        </h1>
        <p className={`text-muted mb-8 ${isFullscreen ? 'text-2xl mb-12' : 'text-sm'}`}>
          Escaneá el código para registrar tu asistencia hoy
        </p>

        <div className={`p-8 bg-white rounded-[2rem] shadow-2xl shadow-primary/10 border border-border animate-pulse-glow ${isFullscreen ? 'scale-150' : ''}`}>
          {attendanceUrl && (
            <QRCodeSVG 
              value={attendanceUrl} 
              size={isFullscreen ? 320 : 220}
              level="H"
              includeMargin={true}
              imageSettings={{
                src: "/logo-presente.png", // We'll add this placeholder
                x: undefined,
                y: undefined,
                height: 48,
                width: 48,
                excavate: true,
              }}
            />
          )}
        </div>

        <div className={`mt-12 flex items-center gap-12 ${isFullscreen ? 'mt-32' : ''}`}>
          <div className="flex flex-col items-center">
            <div className={`font-bold text-primary ${isFullscreen ? 'text-6xl mb-2' : 'text-3xl'}`}>
              {attendanceCount}
            </div>
            <div className={`text-muted font-medium flex items-center gap-2 ${isFullscreen ? 'text-2xl' : 'text-xs uppercase tracking-widest'}`}>
              <Users className={isFullscreen ? 'w-8 h-8' : 'w-4 h-4'} />
              Presentes
            </div>
          </div>
          <div className="flex flex-col items-center">
            <div className={`font-bold text-foreground ${isFullscreen ? 'text-6xl mb-2' : 'text-3xl'}`}>
              <Clock className={isFullscreen ? 'w-10 h-10 inline mr-2 text-muted' : 'hidden'} />
              {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </div>
            <div className={`text-muted font-medium ${isFullscreen ? 'text-2xl' : 'text-xs uppercase tracking-widest'}`}>
              {new Date().toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })}
            </div>
          </div>
        </div>
      </div>

      {!isFullscreen && (
        <div className="mt-16 p-6 bg-primary/5 rounded-2xl border border-primary/20 max-w-xl text-center">
          <p className="text-sm text-primary font-medium flex items-center justify-center gap-2">
            <RefreshCw className="w-4 h-4 animate-spin-slow" />
            Esta vista se actualiza automáticamente cuando un estudiante firma
          </p>
        </div>
      )}
    </div>
  )
}
