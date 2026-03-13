'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { 
  User, 
  ArrowRight, 
  Search, 
  GraduationCap, 
  CheckCircle,
  ShieldCheck,
  Loader2
} from 'lucide-react'

export default function StudentLoginPage() {
  const [dni, setDni] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleSearch = (e) => {
    e.preventDefault()
    if (!dni.trim()) return
    setLoading(true)
    // We redirect to the student dashboard with their DNI
    router.push(`/alumno/${dni.trim()}`)
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/5 rounded-full blur-[100px]" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-accent/5 rounded-full blur-[100px]" />

      <div className="w-full max-w-md relative z-10">
        {/* Brand */}
        <div className="flex flex-col items-center text-center mb-10">
          <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-primary/20 bg-white shadow-xl shadow-primary/10 mb-6 p-2">
            <img src="/logo.png" alt="Logo Presente" className="w-full h-full object-contain" />
          </div>
          <h1 className="text-4xl font-black text-foreground tracking-tight mb-2">
            Portal Estudiante
          </h1>
          <p className="text-muted font-medium text-lg">
            Consultá tu situación académica al instante.
          </p>
        </div>

        <div className="bg-surface border border-border rounded-[2.5rem] p-10 shadow-2xl shadow-primary/5">
          <form onSubmit={handleSearch} className="space-y-8">
            <div className="space-y-3">
              <label className="block text-sm font-bold text-foreground/80 uppercase tracking-widest ml-1">
                Ingresá tu DNI
              </label>
              <div className="relative group">
                <User className="absolute left-5 top-1/2 -translate-y-1/2 w-6 h-6 text-muted group-focus-within:text-primary transition-colors" />
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={dni}
                  onChange={(e) => setDni(e.target.value.replace(/\D/g, ''))}
                  placeholder="Ej: 12345678"
                  required
                  autoFocus
                  className="w-full pl-14 pr-6 py-5 bg-background border border-border rounded-3xl text-foreground text-xl font-medium placeholder:text-muted/50 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all shadow-sm"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !dni}
              className="w-full py-5 bg-primary text-white font-bold rounded-3xl hover:bg-primary-dark transition-all shadow-lg shadow-primary/25 disabled:opacity-50 flex items-center justify-center gap-3 text-lg group"
            >
              {loading ? (
                <>
                  <Loader2 className="w-6 h-6 animate-spin" />
                  Buscando datos...
                </>
              ) : (
                <>
                  Ver Mi Situación
                  <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          <div className="mt-10 pt-8 border-t border-border/50 grid grid-cols-2 gap-4">
             <div className="flex flex-col items-center text-center">
                <div className="w-10 h-10 rounded-full bg-success/10 flex items-center justify-center mb-2">
                  <CheckCircle className="w-5 h-5 text-success" />
                </div>
                <p className="text-[10px] font-bold text-muted uppercase tracking-tighter">Asistencia</p>
             </div>
             <div className="flex flex-col items-center text-center">
                <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center mb-2">
                  <ShieldCheck className="w-5 h-5 text-accent" />
                </div>
                <p className="text-[10px] font-bold text-muted uppercase tracking-tighter">Notas Reales</p>
             </div>
          </div>
        </div>

        <p className="text-center mt-8 text-sm text-muted">
          ¿No encontrás tus datos? Consultá con tu docente o cátedra.
        </p>
      </div>
    </div>
  )
}
