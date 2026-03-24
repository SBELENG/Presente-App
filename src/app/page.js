'use client';

import Link from 'next/link';
import Image from 'next/image';
import { 
  QrCode, 
  ChevronRight, 
  Users, 
  BarChart3, 
  CheckCircle2, 
  Zap, 
  ShieldCheck, 
  MoveRight,
  ClipboardList
} from 'lucide-react';

export default function Home() {
  const features = [
    {
      icon: <QrCode className="w-8 h-8 text-blue-500" />,
      title: "Asistencia QR Instantánea",
      description: "Los estudiantes escanean el código generado al inicio de la clase. Su ubicación y tiempo se registran automáticamente."
    },
    {
      icon: <ClipboardList className="w-8 h-8 text-green-500" />,
      title: "Matriz de Notas Inteligente",
      description: "Visualiza el progreso de todo el curso en una sola pantalla. Cargas masivas desde Excel y promedios automáticos."
    },
    {
      icon: <BarChart3 className="w-8 h-8 text-purple-500" />,
      title: "Analítica Predictiva",
      description: "Detecta a tiempo a los estudiantes en riesgo de quedar libres gracias a nuestros modelos de seguimiento continuo."
    },
    {
      icon: <Users className="w-8 h-8 text-indigo-500" />,
      title: "Gestión de Comisiones",
      description: "Soporte para múltiples comisiones, clases teóricas y prácticas. Todo centralizado en una única cátedra."
    }
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-white selection:bg-blue-500/30 font-sans">
      
      {/* --- NAV BAR --- */}
      <nav className="fixed top-0 w-full z-50 bg-slate-950/70 backdrop-blur-2xl border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative w-11 h-11 bg-white p-1.5 rounded-xl shadow-lg shadow-white/5 overflow-hidden group">
              <div className="absolute inset-0 bg-blue-600/10 group-hover:bg-blue-600/20 transition-colors" />
              <div className="relative w-full h-full">
                <Image 
                  src="/logo.png" 
                  alt="Presente Logo" 
                  fill
                  className="object-contain"
                  priority
                />
              </div>
            </div>
            <div className="flex flex-col -gap-1">
              <span className="text-xl font-black tracking-tighter bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
                Presente
              </span>
              <span className="text-[10px] font-bold text-blue-500 tracking-[0.2em] uppercase">
                Eco-Sistema
              </span>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <Link 
              href="/login" 
              className="px-6 py-2.5 text-sm font-black bg-blue-600 hover:bg-blue-500 text-white rounded-xl shadow-lg shadow-blue-600/20 hover:-translate-y-0.5 transition-all"
            >
              Acceso Docente
            </Link>
          </div>
        </div>
      </nav>

      {/* --- HERO SECTION --- */}
      <section className="relative pt-48 pb-32 px-6 overflow-hidden">
        {/* Background Gradients */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-blue-600/10 blur-[120px] rounded-full pointer-events-none -z-10" />
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-indigo-600/10 blur-[100px] rounded-full pointer-events-none -z-10" />
        
        <div className="max-w-7xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-black tracking-widest uppercase mb-10">
            <Zap className="w-3.5 h-3.5 fill-blue-400" /> Versión 2.8 • Gestión Educativa Full
          </div>
          
          <h1 className="text-6xl md:text-8xl font-black mb-8 leading-[0.85] tracking-tight">
            Digitalizá tu aula <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-b from-blue-400 to-blue-600">
              en segundos.
            </span>
          </h1>
          
          <p className="text-slate-400 text-xl md:text-2xl max-w-3xl mx-auto mb-14 leading-relaxed font-medium">
            La plataforma definitiva para el seguimiento de alumnos. 
            <span className="text-white"> Asistencia QR, analítica predictiva de riesgo </span> 
            y carga simplificada de notas.
          </p>

          <div className="flex flex-col sm:flex-row gap-5 justify-center mt-4">
            <Link 
              href="/login" 
              className="group px-10 py-5 bg-white text-slate-950 rounded-2xl font-black text-xl hover:scale-105 transition-all flex items-center justify-center gap-3 shadow-2xl shadow-white/10"
            >
              Empezar ahora <MoveRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
            </Link>
            <button className="px-10 py-5 bg-white/5 border border-white/10 rounded-2xl font-black text-xl hover:bg-white/10 transition-all flex items-center justify-center gap-2">
              Ver Demo
            </button>
          </div>
        </div>
      </section>

      {/* --- FEATURES GRID --- */}
      <section className="py-32 px-6 bg-white/[0.02] border-y border-white/5">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-24">
            <h2 className="text-4xl md:text-5xl font-black mb-6 tracking-tight">
              Potencia tu enseñanza.
            </h2>
            <p className="text-slate-500 text-lg max-w-2xl mx-auto">
              Diseñado específicamente para las necesidades de la universidad moderna, 
              eliminando la burocracia de papel y dándote información valiosa.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, idx) => (
              <div key={idx} className="group p-8 rounded-3xl bg-slate-900/50 border border-white/5 hover:border-blue-500/30 transition-all hover:-translate-y-2">
                <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mb-8 group-hover:bg-blue-600/10 transition-colors">
                  {feature.icon}
                </div>
                <h3 className="text-2xl font-black mb-4 tracking-tight">{feature.title}</h3>
                <p className="text-slate-400 leading-relaxed font-medium">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* --- TRUST SECTION --- */}
      <section className="py-32 px-6 overflow-hidden">
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-20">
          <div className="flex-1 space-y-8">
            <div className="inline-flex items-center gap-2 py-1 px-4 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold uppercase tracking-wider">
              <ShieldCheck className="w-4 h-4" /> Seguridad garantizada
            </div>
            <h2 className="text-5xl md:text-6xl font-black tracking-tight leading-tight">
              Control total en <br /> la palma de tu mano.
            </h2>
            <ul className="space-y-6">
              {[
                "Sincronización instantánea con Supabase",
                "Integración perfecta con planillas Excel",
                "Interfaz optimizada para móviles (PWA Ready)",
                "Exportación de reportes PDF en un clic"
              ].map((item, idx) => (
                <li key={idx} className="flex items-center gap-4 text-slate-300 font-bold text-lg">
                  <CheckCircle2 className="w-6 h-6 text-emerald-500" /> {item}
                </li>
              ))}
            </ul>
          </div>
          
          <div className="flex-1 relative">
            <div className="absolute inset-0 bg-blue-600/30 blur-[120px] rounded-full -z-10" />
            <div className="rounded-[40px] overflow-hidden border border-white/10 shadow-2xl relative">
              <div className="bg-slate-900 p-4 border-b border-white/10 flex gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500/50" />
                <div className="w-3 h-3 rounded-full bg-yellow-500/50" />
                <div className="w-3 h-3 rounded-full bg-green-500/50" />
              </div>
              <div className="aspect-video bg-slate-950 flex items-center justify-center">
                 <QrCode className="w-32 h-32 text-blue-500/20 animate-pulse" />
              </div>
              <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-slate-950 to-transparent flex items-end justify-center pb-12">
                <div className="px-8 py-3 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl text-blue-400 font-black tracking-widest text-sm uppercase">
                  Scanner Inteligente Activo
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* --- FOOTER --- */}
      <footer className="py-20 border-t border-white/5 bg-black/40">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-10">
          <div className="flex items-center gap-3 grayscale opacity-50 hover:grayscale-0 hover:opacity-100 transition-all">
            <Image src="/logo.png" alt="Logo" width={32} height={32} />
            <span className="text-lg font-black tracking-tighter">Presente</span>
          </div>
          
          <div className="text-slate-500 text-sm font-medium">
            UNRC • Universidad Nacional de Río Cuarto • Argentina
          </div>
          
          <div className="flex gap-8 text-slate-500 text-sm font-medium">
            <a href="#" className="hover:text-white transition-colors">Términos</a>
            <a href="#" className="hover:text-white transition-colors">Privacidad</a>
            <span className="text-slate-700">© {new Date().getFullYear()}</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
