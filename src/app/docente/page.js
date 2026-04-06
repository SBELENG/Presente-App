import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import {
  BookOpen,
  Users,
  BarChart3,
  Plus,
  ArrowRight,
} from 'lucide-react'

export default async function DocenteDashboard() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Handle demo bypass session
  const { cookies } = await import('next/headers')
  const cookieStore = await cookies()
  const isDemoBypass = cookieStore.get('demo_bypass')?.value === 'true'
  const demoEmail = cookieStore.get('demo_user')?.value

  // Use either the real user ID or the demo email as an identifier
  const docenteIdentifier = user?.id || (isDemoBypass ? demoEmail : null)

  // Redirect to login if absolutely no session
  if (!docenteIdentifier) {
    const { redirect } = await import('next/navigation')
    redirect('/login')
  }

  // Special case for the legacy email to see all test data
  const isLegacyUser = docenteIdentifier === '1000ideasdigitales@gmail.com'

  // Try to fetch cátedras (will be empty if tables don't exist yet)
  let catedras = []
  let totalEstudiantes = 0;
  let totalClasesDictadas = 0;

  try {
    const query = supabase.from('catedras').select('*')
    
    // Only filter by docente_id if it's NOT the legacy user who needs to see everything
    if (!isLegacyUser) {
      query.eq('docente_id', docenteIdentifier)
    }

    const { data } = await query.order('created_at', { ascending: false })
    if (data) {
      catedras = data
      
      const catedraIds = catedras.map(c => c.id);
      
      if (catedraIds.length > 0) {
        // Obtenemos inscripciones (estudiantes)
        const { count: estudiantesCount } = await supabase
          .from('inscripciones')
          .select('*', { count: 'exact', head: true })
          .in('catedra_id', catedraIds);
        
        totalEstudiantes = estudiantesCount || 0;

        // Obtenemos clases dictadas
        const { count: clasesCount } = await supabase
          .from('clases')
          .select('*', { count: 'exact', head: true })
          .in('catedra_id', catedraIds);
          
        totalClasesDictadas = clasesCount || 0;
      }
    }
  } catch {
    // Tables may not exist yet
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-fade-in">
      {/* Welcome */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">
          ¡Hola, Docente! 👋
        </h1>
        <p className="text-muted mt-1">
          Gestioná tus cátedras y tomá asistencia de forma inteligente.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-surface border border-border rounded-2xl p-6 hover:border-primary/30 transition-all">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <BookOpen className="w-6 h-6 text-primary" />
            </div>
            <div>
              <div className="text-2xl font-bold text-foreground">
                {catedras.length}
              </div>
              <div className="text-sm text-muted">Cátedras activas</div>
            </div>
          </div>
        </div>

        <div className="bg-surface border border-border rounded-2xl p-6 hover:border-accent/30 transition-all">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center">
              <Users className="w-6 h-6 text-accent" />
            </div>
            <div>
              <div className="text-2xl font-bold text-foreground">{totalEstudiantes}</div>
              <div className="text-sm text-muted">Estudiantes</div>
            </div>
          </div>
        </div>

        <div className="bg-surface border border-border rounded-2xl p-6 hover:border-success/30 transition-all">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-success/10 flex items-center justify-center">
              <BarChart3 className="w-6 h-6 text-success" />
            </div>
            <div>
              <div className="text-2xl font-bold text-foreground">{totalClasesDictadas}</div>
              <div className="text-sm text-muted">Clases dictadas</div>
            </div>
          </div>
        </div>
      </div>

      {/* Cátedras list or empty state */}
      <div className="bg-surface border border-border rounded-2xl overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h2 className="text-lg font-semibold text-foreground">
            Mis Cátedras
          </h2>
          <Link
            href="/docente/catedras/nueva"
            className="flex items-center gap-2 px-4 py-2 bg-primary text-white text-sm font-medium rounded-xl hover:bg-primary-dark transition-colors"
          >
            <Plus className="w-4 h-4" />
            Nueva
          </Link>
        </div>

        {catedras.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <BookOpen className="w-8 h-8 text-primary" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">
              Todavía no tenés cátedras
            </h3>
            <p className="text-muted text-sm mb-6 max-w-sm mx-auto">
              Creá tu primera cátedra para comenzar a tomar asistencia
              de forma inteligente.
            </p>
            <Link
              href="/docente/catedras/nueva"
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-primary to-primary-dark text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-primary/25 transition-all"
            >
              <Plus className="w-5 h-5" />
              Crear mi primera cátedra
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {catedras.map((cat) => (
              <Link
                key={cat.id}
                href={`/docente/catedras/${cat.id}`}
                className="flex items-center justify-between p-6 hover:bg-surface-hover transition-colors group"
              >
                <div>
                  <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                    {cat.nombre}
                  </h3>
                  <p className="text-sm text-muted mt-1">
                    {cat.codigo} · {cat.comision || 'Única'} · {cat.carrera}
                  </p>
                </div>
                <ArrowRight className="w-5 h-5 text-muted group-hover:text-primary group-hover:translate-x-1 transition-all" />
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
