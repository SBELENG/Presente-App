import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { cookies } from 'next/headers'
import { Plus, ArrowRight, BookOpen } from 'lucide-react'

export default async function CatedrasPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const cookieStore = await cookies()
  const isDevBypass = cookieStore.get('dev_bypass')?.value === 'true'
  
  let docenteId = user?.id
  if (!docenteId && isDevBypass) {
    docenteId = '3cd85ad4-bd2a-4639-9c88-bb22bc63ed88'
  }

  let catedras = []
  try {
    if (docenteId) {
      const { data } = await supabase
        .from('catedras')
        .select('*')
        .eq('docente_id', docenteId)
        .order('created_at', { ascending: false })
      if (data) catedras = data
    }
  } catch {
    // Tables may not exist yet
  }

  return (
    <div className="max-w-5xl mx-auto animate-fade-in">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Mis Cátedras</h1>
          <p className="text-muted text-sm mt-1">
            Gestioná todas tus materias y sus configuraciones.
          </p>
        </div>
        <Link
          href="/docente/catedras/nueva"
          className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-primary to-primary-dark text-white text-sm font-semibold rounded-xl hover:shadow-lg hover:shadow-primary/25 transition-all"
        >
          <Plus className="w-4 h-4" />
          Nueva Cátedra
        </Link>
      </div>

      {catedras.length === 0 ? (
        <div className="bg-surface border border-border rounded-2xl p-16 text-center">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <BookOpen className="w-8 h-8 text-primary" />
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-2">
            No tenés cátedras creadas
          </h3>
          <p className="text-muted text-sm mb-6 max-w-sm mx-auto">
            Creá tu primera cátedra para empezar a tomar asistencia.
          </p>
          <Link
            href="/docente/catedras/nueva"
            className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white font-semibold rounded-xl hover:bg-primary-dark transition-colors"
          >
            <Plus className="w-5 h-5" />
            Crear cátedra
          </Link>
        </div>
      ) : (
        <div className="grid gap-4">
          {catedras.map((cat) => (
            <Link
              key={cat.id}
              href={`/docente/catedras/${cat.id}`}
              className="group bg-surface border border-border rounded-2xl p-6 hover:border-primary/30 hover:shadow-md transition-all duration-300"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                    <BookOpen className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                      {cat.nombre}
                    </h3>
                    <div className="flex items-center gap-3 mt-1">
                      {cat.codigo && (
                        <span className="text-xs px-2 py-0.5 bg-primary/10 text-primary rounded-md font-medium">
                          {cat.codigo}
                        </span>
                      )}
                      <span className="text-sm text-muted">
                        {cat.comision ? `Comisión ${cat.comision}` : 'Comisión única'} · {cat.carrera || 'Sin carrera'}
                      </span>
                    </div>
                  </div>
                </div>
                <ArrowRight className="w-5 h-5 text-muted group-hover:text-primary group-hover:translate-x-1 transition-all" />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
