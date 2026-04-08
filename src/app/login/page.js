'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Mail, Loader2, Lock, UserPlus, LogIn, CheckCircle2, KeyRound } from 'lucide-react'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [nombre, setNombre] = useState('')
  const [mode, setMode] = useState('login') // 'login' | 'signup' | 'forgot'
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)

  const handleAuth = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(null)
    const supabase = createClient()

    if (mode === 'forgot') {
      const redirectTo = `${window.location.origin}/reset-password`
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo })
      if (error) {
        setError(error.message)
      } else {
        setSuccess('Revisá tu bandeja de entrada. Te enviamos un link para restablecer tu contraseña.')
      }
      setLoading(false)
      return
    }

    if (mode === 'signup') {
      const { error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: { data: { full_name: nombre.trim() } }
      })
      if (error) {
        setError(error.message)
        setLoading(false)
      } else {
        window.location.href = '/docente/catedras'
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      })
      if (error) {
        setError('El correo o la contraseña ingresados son incorrectos.')
        setLoading(false)
      } else {
        window.location.href = '/docente/catedras'
      }
    }
  }



  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div className="w-full max-w-4xl bg-white rounded-[2.5rem] shadow-2xl shadow-slate-200 overflow-hidden flex flex-col md:flex-row border border-slate-100">

        {/* Lado Izquierdo - Informativo */}
        <div className="md:w-5/12 bg-primary p-12 text-white flex flex-col justify-between relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary-dark to-indigo-900 opacity-90" />
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-12">
              <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center p-2 border border-white/20">
                <img src="/logo.png" alt="Logo Presente" className="w-full h-full object-contain" />
              </div>
              <span className="text-2xl font-black tracking-tight">Presente</span>
            </div>
            <h2 className="text-4xl font-bold leading-tight mb-6">Simplificamos su labor docente.</h2>
            <p className="text-indigo-100/70 text-lg">Acceda a sus cátedras, genere códigos QR y gestione sus notas en un solo lugar.</p>
          </div>
          <div className="relative z-10 text-xs text-white/40 font-medium tracking-widest uppercase">
            © 2026 Sistema Presente
          </div>
        </div>

        {/* Lado Derecho - Formulario */}
        <div className="flex-1 p-8 md:p-16">
          <div className="max-w-sm mx-auto">
            <div className="mb-10">
              <h1 className="text-3xl font-black text-slate-900 mb-2">
                {mode === 'login' ? 'Bienvenido de nuevo' : mode === 'signup' ? 'Cree su cuenta' : 'Restablecer contraseña'}
              </h1>
              <p className="text-slate-500 font-medium">
                {mode === 'login'
                  ? 'Ingrese sus credenciales para continuar.'
                  : mode === 'signup'
                  ? 'Regístrese para comenzar a gestionar sus cátedras.'
                  : 'Ingrese su email y le enviaremos un link para crear una nueva contraseña.'}
              </p>
            </div>

            {/* Mensaje de éxito (forgot password enviado) */}
            {success ? (
              <div className="p-6 bg-green-50 border-2 border-green-200 rounded-2xl flex items-start gap-4">
                <CheckCircle2 className="w-6 h-6 text-green-500 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-green-800 text-sm">{success}</p>
                  <button
                    type="button"
                    onClick={() => { setMode('login'); setSuccess(null); setEmail('') }}
                    className="mt-3 text-xs font-bold text-green-600 hover:text-green-800 underline"
                  >
                    Volver al inicio de sesión
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleAuth} className="space-y-5">
                {mode === 'signup' && (
                  <div className="animate-in fade-in slide-in-from-top-2">
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">Nombre Completo</label>
                    <input
                      type="text"
                      value={nombre}
                      onChange={(e) => setNombre(e.target.value)}
                      placeholder="Prof. Juan Pérez"
                      className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-primary focus:ring-0 transition-all text-slate-900 font-medium placeholder:text-slate-300"
                      required
                    />
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">Email Institucional</label>
                  <div className="relative">
                    <Mail className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="nombre@unrc.edu.ar"
                      className="w-full pl-14 pr-5 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-primary focus:ring-0 transition-all text-slate-900 font-medium placeholder:text-slate-300"
                      required
                    />
                  </div>
                </div>

                {mode !== 'forgot' && (
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">Contraseña</label>
                    <div className="relative">
                      <Lock className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300" />
                      <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full pl-14 pr-5 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-primary focus:ring-0 transition-all text-slate-900 font-medium placeholder:text-slate-300"
                        required
                        minLength={6}
                      />
                    </div>
                  </div>
                )}

                {error && (
                  <div className="p-4 bg-red-50 text-red-600 rounded-2xl text-sm font-bold border border-red-100 animate-in fade-in zoom-in-95">
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
                      {mode === 'login' ? <LogIn className="w-5 h-5" /> : mode === 'signup' ? <UserPlus className="w-5 h-5" /> : <KeyRound className="w-5 h-5" />}
                      {mode === 'login' ? 'Ingresar al Panel' : mode === 'signup' ? 'Registrar mi cuenta' : 'Enviar link de recuperación'}
                    </>
                  )}
                </button>
              </form>
            )}

            <div className="mt-8 text-center space-y-3">
              {mode === 'login' && (
                <button
                  type="button"
                  onClick={() => { setMode('forgot'); setError(null) }}
                  className="text-sm font-bold text-slate-400 hover:text-primary transition-colors block w-full"
                >
                  ¿Olvidó su contraseña?
                </button>
              )}

              {mode !== 'forgot' && (
                <button
                  type="button"
                  onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}
                  className="text-sm font-bold text-slate-400 hover:text-primary transition-colors"
                >
                  {mode === 'login' ? '¿No tiene cuenta? Regístrese aquí' : '¿Ya tiene cuenta? Inicie sesión'}
                </button>
              )}

              {mode === 'forgot' && !success && (
                <button
                  type="button"
                  onClick={() => { setMode('login'); setError(null) }}
                  className="text-sm font-bold text-slate-400 hover:text-primary transition-colors"
                >
                  ← Volver al inicio de sesión
                </button>
              )}


            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
