import Link from "next/link";
import {
  QrCode,
  BarChart3,
  Clock,
  Shield,
  ChevronRight,
  GraduationCap,
  Users,
  Zap,
} from "lucide-react";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Navbar */}
      <nav className="fixed top-0 w-full z-50 bg-background/80 backdrop-blur-md border-b border-white/10">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-primary/20 bg-white p-1 shadow-sm">
              <img src="/logo.png" alt="Logo Presente" className="w-full h-full object-contain" />
            </div>
            <span className="text-2xl font-black text-foreground tracking-tighter">Presente</span>
          </div>
          <div className="hidden md:flex items-center gap-3">
            <Link
              href="/login"
              className="px-4 py-2 text-sm font-medium text-foreground hover:text-primary transition-colors"
            >
              Iniciar sesión
            </Link>
            <Link
              href="/login"
              className="px-5 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-primary to-primary-dark rounded-xl hover:shadow-lg hover:shadow-primary/25 transition-all duration-300 hover:-translate-y-0.5"
            >
              Comenzar gratis
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-7xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-8 animate-fade-in">
            <Zap className="w-4 h-4" />
            Sistema inteligente de asistencia académica
          </div>

          <h1 className="text-5xl md:text-7xl font-extrabold text-foreground leading-tight mb-6 animate-fade-in">
            Asistencia digital
            <br />
            <span className="bg-gradient-to-r from-primary via-primary-light to-accent bg-clip-text text-transparent">
              en segundos
            </span>
          </h1>

          <p className="text-lg md:text-xl text-muted max-w-2xl mx-auto mb-10 animate-fade-in">
            Dejá atrás las planillas y el llamado oral. Con{" "}
            <strong className="text-foreground">Presente</strong>, tus
            estudiantes escanean un QR, ingresan su DNI y listo. Vos obtenés
            analítica en tiempo real.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in">
            <Link
              href="/login"
              className="group px-8 py-4 text-lg font-semibold text-white bg-gradient-to-r from-primary to-primary-dark rounded-2xl hover:shadow-xl hover:shadow-primary/30 transition-all duration-300 hover:-translate-y-1 flex items-center justify-center gap-2"
            >
              Crear mi cátedra
              <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              href="#como-funciona"
              className="px-8 py-4 text-lg font-semibold text-foreground bg-surface border border-border rounded-2xl hover:border-primary/50 hover:bg-surface-hover transition-all duration-300"
            >
              ¿Cómo funciona?
            </Link>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-8 max-w-lg mx-auto mt-16 animate-fade-in">
            <div>
              <div className="text-3xl font-bold text-primary">30s</div>
              <div className="text-sm text-muted mt-1">para tomar lista</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-accent">0</div>
              <div className="text-sm text-muted mt-1">errores de registro</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-success">100%</div>
              <div className="text-sm text-muted mt-1">digital y trazable</div>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="como-funciona" className="py-20 px-6 bg-surface">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Así de simple funciona
            </h2>
            <p className="text-muted text-lg max-w-xl mx-auto">
              3 pasos para el docente, 2 para el estudiante
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: QrCode,
                title: "1. Proyectá el QR",
                desc: "Al iniciar la clase, mostrá el código QR único de tu cátedra. Se genera automáticamente.",
                color: "from-primary to-primary-light",
              },
              {
                icon: Users,
                title: "2. Estudiantes escanean",
                desc: "Cada estudiante escanea con su celular e ingresa su DNI. En menos de 10 segundos.",
                color: "from-accent to-accent-light",
              },
              {
                icon: BarChart3,
                title: "3. Visualizá todo",
                desc: "El dashboard se actualiza en tiempo real. Asistencia por tema, notas y estado académico.",
                color: "from-success to-emerald-400",
              },
            ].map((step, i) => (
              <div
                key={i}
                className="group relative bg-background rounded-2xl p-8 border border-border hover:border-primary/30 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
              >
                <div
                  className={`w-14 h-14 rounded-xl bg-gradient-to-br ${step.color} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}
                >
                  <step.icon className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-xl font-bold text-foreground mb-3">
                  {step.title}
                </h3>
                <p className="text-muted leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Todo lo que necesitás
            </h2>
            <p className="text-muted text-lg max-w-xl mx-auto">
              Diseñado por docentes, para docentes
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                icon: QrCode,
                title: "QR Dinámico",
                desc: "Un QR único por clase con ventana de tiempo configurable",
              },
              {
                icon: Shield,
                title: "Verificación DNI",
                desc: "Validación contra listado de inscriptos importado",
              },
              {
                icon: BarChart3,
                title: "Dashboard Analítico",
                desc: "Asistencia por tema, notas, estado académico y más",
              },
              {
                icon: Clock,
                title: "Gestión de Excepciones",
                desc: "Feriados, asuetos y paros no computan ausencia",
              },
              {
                icon: GraduationCap,
                title: "Notas y Evaluaciones",
                desc: "Parciales, recuperatorios y TPs en un solo lugar",
              },
              {
                icon: Users,
                title: "Importar Alumnos",
                desc: "Cargá tu listado desde Excel o CSV en segundos",
              },
              {
                icon: Zap,
                title: "Resolución Automática",
                desc: "Alumnos pendientes se actualizan al inscribirse",
              },
              {
                icon: BarChart3,
                title: "Exportar Datos",
                desc: "Descargá planillas de asistencia y notas en Excel",
              },
            ].map((feat, i) => (
              <div
                key={i}
                className="p-6 rounded-xl bg-surface border border-border hover:border-primary/30 transition-all duration-300 group"
              >
                <feat.icon className="w-8 h-8 text-primary mb-4 group-hover:scale-110 transition-transform" />
                <h3 className="font-semibold text-foreground mb-2">
                  {feat.title}
                </h3>
                <p className="text-sm text-muted">{feat.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary via-primary-dark to-indigo-900 p-12 md:p-16 text-center">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(255,255,255,0.1),transparent)]" />
            <div className="relative z-10">
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                ¿Listo para dejar de pasar lista?
              </h2>
              <p className="text-indigo-200 text-lg mb-8 max-w-xl mx-auto">
                Comenzá gratis con tu primera cátedra. Sin tarjeta de crédito,
                sin compromisos.
              </p>
              <Link
                href="/login"
                className="inline-flex items-center gap-2 px-8 py-4 text-lg font-semibold text-primary-dark bg-white rounded-2xl hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
              >
                Crear mi cátedra gratis
                <ChevronRight className="w-5 h-5" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6 border-t border-border">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full overflow-hidden bg-white border border-white/10 p-0.5 shrink-0">
              <img src="/logo.png" alt="Logo Presente" className="w-full h-full object-contain" />
            </div>
            <span className="text-sm text-muted">
              Presente © {new Date().getFullYear()} — Hecho con 💜 para la
              educación
            </span>
          </div>
          <div className="text-sm text-muted">UNRC · Río Cuarto, Córdoba</div>
        </div>
      </footer>
    </div>
  );
}
