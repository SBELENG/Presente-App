'use client';
import Link from 'next/link';
import { Zap, ChevronRight, QrCode, Users, BarChart3, Clock, Shield, GraduationCap } from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen bg-slate-950 text-white selection:bg-blue-500/30">
      <nav className="fixed top-0 w-full z-50 bg-slate-950/80 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
              <QrCode className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-black tracking-tighter">Presente</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/login" className="px-5 py-2.5 text-sm font-bold bg-white text-slate-950 rounded-xl hover:scale-105 transition-all">Acceso Docente</Link>
          </div>
        </div>
      </nav>

      <section className="pt-40 pb-20 px-6 text-center">
        <div className="max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 text-blue-400 text-xs font-bold mb-8 border border-blue-500/20">
            v2.8 · ASISTENCIA INTELIGENTE
          </div>
          <h1 className="text-6xl md:text-8xl font-black mb-8 leading-[0.9] tracking-tighter">
            Digitalizá tu aula <br />
            <span className="text-blue-500">en segundos.</span>
          </h1>
          <p className="text-slate-400 text-xl max-w-2xl mx-auto mb-12 leading-relaxed">
            Escaneo QR, analítica predictiva y gestión de notas en un solo lugar. Simple para vos, rápido para ellos.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/login" className="px-8 py-4 bg-blue-600 rounded-2xl font-black text-lg hover:bg-blue-500 transition-all flex items-center justify-center gap-2 shadow-2xl shadow-blue-600/20">
              Empezar ahora <ChevronRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>

      <footer className="py-12 border-t border-white/5 text-center text-slate-500 text-sm">
        Presente © {new Date().getFullYear()} — UNRC · Río Cuarto
      </footer>
    </div>
  );
}
