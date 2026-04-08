'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Lock, Loader2, CheckCircle2, KeyRound, AlertTriangle } from 'lucide-react'

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(false)
  const [sessionReady, setSessionReady] = useState(false)
  const [checking, setChecking] = useState(true)

  const supabase = createClient()

  useEffect(() => {
    // 1. Verifica si ya hay una sesión activa (el token ya fue procesado)
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setSessionReady(true)
        setChecking(false)
      }
    })

    // 2. Escucha el evento PASSWORD_RECOVERY (llega cuando se procesa el token del link)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY' || (event === 'SIGNED_IN' && session)) {
        setSessionReady(true)
        setChecking(false)
      }
      if (event === 'INITIAL_SESSION') {
        setChecking(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const handleReset = async (e) => {
    e.preventDefault()
    if (password !== confirm) {
      setError('Las contraseñas no coinciden.')
      return
    }
    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.')
      return
    }

    setLoading(true)
    setError(null)

    const { error } = await supabase.auth.updateUser({ password })
    if (error) {
      setError(error.message)
    } else {
      setSuccess(true)
      setTimeout(() => { window.location.href = '/login' }, 3000)
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-white rounded-[2.5rem] shadow-2xl shadow-slate-200 border border-slate-100 overflow-hidden">

        {/* Header */}
        <div className="bg-primary p-10 text-white relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary-dark to-indigo-900 opacity-90" />
          <div className="relative z-10 flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center p-2 border border-white/20">
              <img src="/logo.png" alt="Presente" className="w-full h-full object-contain" />
            </div>
            <span className="text-xl font-black">Presente</span>
          </div>
          <div className="relative z-10">
            <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center mb-4">
              <KeyRound className="w-7 h-7 text-white" />
            </div>
            <h1 className="text-3xl font-black mb-2">Nueva contraseña</h1>
            <p className="text-indigo-100/70">Ingresá tu nueva contraseña para acceder al sistema.</p>
          </div>
        </div>

        {/* Body */}
        <div className="p-10">
          {success ? (
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8 text-green-500" />
              </div>
              <h2 className="text-xl font-bold text-slate-900">¡Contraseña actualizada!</h2>
              <p className="text-slate-500 text-sm">Serás redirigido al inicio de sesión en unos segundos...</p>
            </div>

          ) : checking ? (
            <div className="text-center py-6 space-y-3">
              <Loader2 className="w-8 h-8 text-primary animate-spin mx-auto" />
              <p className="text-slate-500 text-sm">Verificando el link de recuperación...</p>
            </div>

          ) : !sessionReady ? (
            <div className="text-center space-y-4 py-4">
              <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center mx-auto">
                <AlertTriangle className="w-6 h-6 text-amber-500" />
              </div>
              <p className="text-slate-700 font-bold text-sm">
                El link expiró o ya fue usado.
              </p>
              <p className="text-slate-400 text-xs leading-relaxed">
                Los links de recuperación son válidos por 1 hora y de un solo uso.<br/>
                Podés solicitar uno nuevo desde el login.
              </p>
              <a
                href="/login"
                className="inline-block mt-2 px-6 py-3 bg-primary text-white font-bold rounded-2xl text-sm hover:opacity-90 transition-all"
              >
                Ir al login
              </a>
            </div>

          ) : (
            <form onSubmit={handleReset} className="space-y-5">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">
                  Nueva contraseña
                </label>
                <div className="relative">
                  <Lock className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Mínimo 6 caracteres"
                    className="w-full pl-14 pr-5 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-primary focus:ring-0 transition-all text-slate-900 font-medium placeholder:text-slate-300"
                    required
                    minLength={6}
                    autoFocus
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">
                  Confirmar contraseña
                </label>
                <div className="relative">
                  <Lock className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300" />
                  <input
                    type="password"
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    placeholder="Repetí la contraseña"
                    className="w-full pl-14 pr-5 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-primary focus:ring-0 transition-all text-slate-900 font-medium placeholder:text-slate-300"
                    required
                    minLength={6}
                  />
                </div>
              </div>

              {error && (
                <div className="p-4 bg-red-50 text-red-600 rounded-2xl text-sm font-bold border border-red-100">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 bg-primary text-white font-bold rounded-2xl shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : (
                  <>
                    <KeyRound className="w-5 h-5" />
                    Actualizar contraseña
                  </>
                )}
              </button>

              <p className="text-center text-xs text-slate-400">
                ¿Recordaste tu contraseña?{' '}
                <a href="/login" className="font-bold text-primary hover:underline">Volver al login</a>
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
