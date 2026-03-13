'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { Mail, ArrowLeft, CheckCircle, Loader2 } from 'lucide-react'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState(null)

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const supabase = createClient()

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    })

    if (error) {
      setError(error.message || 'Error al enviar el email. Intentá de nuevo.')
      setLoading(false)
      return
    }

    setSent(true)
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left side - Decorative */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary via-primary-dark to-indigo-900 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(255,255,255,0.1),transparent)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(6,182,212,0.15),transparent)]" />
        <div className="relative z-10 flex flex-col justify-center px-16">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-primary/20 bg-white shadow-xl shadow-primary/10 mb-6 flex items-center justify-center p-2">
              <img src="/logo.png" alt="Logo Presente" className="w-full h-full object-contain" />
            </div>
            <span className="text-3xl font-bold text-white">Presente</span>
          </div>
          <h2 className="text-4xl font-bold text-white leading-tight mb-6">
            La forma más rápida
            <br />
            de tomar asistencia
          </h2>
          <p className="text-indigo-200 text-lg leading-relaxed max-w-md">
            QR + verificación de identidad + analítica académica.
            Todo en una sola plataforma diseñada para docentes.
          </p>
          <div className="mt-12 flex gap-8">
            <div>
              <div className="text-3xl font-bold text-white">30s</div>
              <div className="text-sm text-indigo-300">por clase</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-white">100%</div>
              <div className="text-sm text-indigo-300">digital</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-white">0</div>
              <div className="text-sm text-indigo-300">errores</div>
            </div>
          </div>
        </div>
      </div>

      {/* Right side - Form */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-muted hover:text-foreground transition-colors mb-8"
          >
            <ArrowLeft className="w-4 h-4" />
            Volver al inicio
          </Link>

          {!sent ? (
            <>
              <h1 className="text-3xl font-bold text-foreground mb-2">
                Bienvenido a Presente
              </h1>
              <p className="text-muted mb-8">
                Ingresá tu email para recibir un enlace de acceso seguro.
                Sin contraseña.
              </p>

              <form onSubmit={handleLogin} className="space-y-4">
                {process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('your-project') && (
                  <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-500 text-sm mb-4">
                    <strong>⚠️ Configuración incompleta:</strong><br />
                    Las URL de Supabase en `.env.local` todavía son las de ejemplo. Copiá tu URL real para que funcione el envío.
                  </div>
                )}

                <div>
                  <label
                    htmlFor="email"
                    className="block text-sm font-medium text-foreground mb-2"
                  >
                    Email institucional
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted" />
                    <input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="tu.email@unrc.edu.ar"
                      required
                      className="w-full pl-12 pr-4 py-3.5 bg-surface border border-border rounded-xl text-foreground placeholder:text-muted/60 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                    />
                  </div>
                </div>

                {error && (
                  <div className="p-3 bg-danger/10 border border-danger/20 rounded-xl text-danger text-sm">
                    {error}
                  </div>
                )}

                <div className="flex flex-col gap-3">
                  <button
                    type="submit"
                    disabled={loading || !email}
                    className="w-full py-3.5 bg-gradient-to-r from-primary to-primary-dark text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-primary/25 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Enviando...
                      </>
                    ) : (
                      'Enviar enlace de acceso'
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      document.cookie = "dev_bypass=true; path=/";
                      window.location.href = '/docente';
                    }}
                    className="w-full py-3 border border-border text-foreground font-medium rounded-xl hover:bg-surface transition-all flex items-center justify-center gap-2"
                  >
                    ⚡ Ingresar en Modo Invitado (Desarrollo)
                  </button>
                </div>
              </form>

              <div className="mt-6 text-center">
                <p className="text-sm text-muted">
                  ¿Sos estudiante?{' '}
                  <Link
                    href="/registro"
                    className="text-primary hover:text-primary-dark font-medium"
                  >
                    Registrate acá
                  </Link>
                </p>
              </div>
            </>
          ) : (
            <div className="text-center animate-fade-in">
              <div className="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="w-8 h-8 text-success" />
              </div>
              <h2 className="text-2xl font-bold text-foreground mb-3">
                ¡Email enviado!
              </h2>
              <p className="text-muted mb-6">
                Revisá tu bandeja de entrada en{' '}
                <strong className="text-foreground">{email}</strong> y hacé clic
                en el enlace para ingresar.
              </p>
              <button
                onClick={() => {
                  setSent(false)
                  setEmail('')
                }}
                className="text-primary hover:text-primary-dark font-medium text-sm"
              >
                Usar otro email
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
