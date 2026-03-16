import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { 
  QrCode, 
  Users, 
  Calendar, 
  Settings, 
  ChevronRight, 
  ArrowLeft,
  GraduationCap,
  BarChart3
} from 'lucide-react'
import { notFound } from 'next/navigation'

export default async function CatedraDetailPage({ params }) {
  const { id } = await params
  const supabase = await createClient()
  
  const { data: catedra } = await supabase
    .from('catedras')
    .select('*')
    .eq('id', id)
    .single()

  if (!catedra) {
    notFound()
  }

  const menuItems = [
    {
      title: 'Proyectar QR',
      desc: 'Generar código para tomar asistencia hoy',
      icon: QrCode,
      href: `/docente/catedras/${id}/qr`,
      color: 'bg-primary/10 text-primary',
      hover: 'hover:border-primary/30'
    },
    {
      title: 'Listado de Alumnos',
      desc: 'Gestionar inscripciones e importar alumnos',
      icon: Users,
      href: `/docente/catedras/${id}/alumnos`,
      color: 'bg-accent/10 text-accent',
      hover: 'hover:border-accent/30'
    },
    {
      title: 'Cronograma',
      desc: 'Ver y editar las clases de la cursada',
      icon: Calendar,
      href: `/docente/catedras/${id}/cronograma`,
      color: 'bg-success/10 text-success',
      hover: 'hover:border-success/30'
    },
    {
      title: 'Nota de Alumnos',
      desc: 'Cargar y visualizar calificaciones',
      icon: GraduationCap,
      href: `/docente/catedras/${id}/notas`,
      color: 'bg-warning/10 text-warning',
      hover: 'hover:border-warning/30'
    },
    {
      title: 'Registro de Asistencia',
      desc: 'Matriz histórica de firmas y faltas (Vista Excel)',
      icon: Users,
      href: `/docente/catedras/${id}/asistencia`,
      color: 'bg-info/10 text-info',
      hover: 'hover:border-info/30'
    },
    {
      title: 'Analítica',
      desc: 'Estadísticas de rendimiento y asistencia',
      icon: BarChart3,
      href: `/docente/catedras/${id}/estadisticas`,
      color: 'bg-primary/10 text-primary',
      hover: 'hover:border-primary/30'
    },
    {
      title: 'Configuración',
      desc: 'Editar reglas y datos de la cátedra',
      icon: Settings,
      href: `/docente/catedras/${id}/configuracion`,
      color: 'bg-muted/10 text-muted',
      hover: 'hover:border-muted/30'
    }
  ]

  return (
    <div className="max-w-5xl mx-auto animate-fade-in">
      <div className="mb-8">
        <Link
          href="/docente/catedras"
          className="inline-flex items-center gap-2 text-sm text-muted hover:text-foreground transition-colors mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver a mis cátedras
        </Link>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">{catedra.nombre}</h1>
            <div className="flex flex-wrap items-center gap-3 mt-2">
              <span className="px-2.5 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase tracking-wider">
                {catedra.codigo || 'S/C'}
              </span>
              <span className="text-sm text-muted">
                {catedra.carrera} · {catedra.facultad}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {menuItems.map((item, i) => (
          <Link
            key={i}
            href={item.href}
            className={`group p-6 bg-surface border border-border rounded-2xl transition-all duration-300 ${item.hover} hover:shadow-lg hover:-translate-y-1`}
          >
            <div className="flex items-start justify-between">
              <div className={`w-12 h-12 rounded-xl ${item.color} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                <item.icon className="w-6 h-6" />
              </div>
              <ChevronRight className="w-5 h-5 text-muted group-hover:text-foreground group-hover:translate-x-1 transition-all" />
            </div>
            <h3 className="text-lg font-bold text-foreground mb-2">{item.title}</h3>
            <p className="text-sm text-muted leading-relaxed">{item.desc}</p>
          </Link>
        ))}
      </div>

      {/* Quick stats / info */}
      <div className="mt-12 p-8 bg-surface border border-border rounded-3xl">
        <h2 className="text-xl font-bold text-foreground mb-6">Detalles de la cursada</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          <div>
            <div className="text-xs font-bold text-muted uppercase tracking-widest mb-1">Días</div>
            <div className="text-foreground font-medium">
              {catedra.dias_clase?.length > 0 
                ? catedra.dias_clase.map(d => d.charAt(0).toUpperCase() + d.slice(1)).join(', ')
                : 'No definidos'}
            </div>
          </div>
          <div>
            <div className="text-xs font-bold text-muted uppercase tracking-widest mb-1">Asistencia Req.</div>
            <div className="text-foreground font-medium">{catedra.porcentaje_asistencia}%</div>
          </div>
          <div>
            <div className="text-xs font-bold text-muted uppercase tracking-widest mb-1">Promocion</div>
            <div className="text-foreground font-medium">
              {catedra.es_promocional ? `Sí (Nota ${catedra.nota_promocion_minima || 6}+)` : 'No'}
            </div>
          </div>
          <div>
            <div className="text-xs font-bold text-muted uppercase tracking-widest mb-1">Evaluaciones</div>
            <div className="text-foreground font-medium">
              {catedra.cant_parciales} Parciales · {catedra.cant_recuperatorios} Recup.
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
