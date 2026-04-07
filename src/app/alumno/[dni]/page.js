'use client'

import { useState, useEffect, use } from 'react'
import { createClient } from '@/lib/supabase/client'
import { 
  ArrowLeft, 
  BookOpen, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  ChevronRight,
  GraduationCap,
  Loader2,
  Calendar,
  Award
} from 'lucide-react'
import Link from 'next/link'
import { TIPO_NOTA } from '@/lib/constants'
import { calculateAcademicStatus, getStudentExpectedDates } from '@/lib/academic-logic'
import { useParams } from 'next/navigation'

export default function StudentDashboardPage() {
  const params = useParams()
  const dni = params.dni
  const [inscriptions, setInscriptions] = useState([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    fetchStudentData()
  }, [dni])

  const fetchStudentData = async () => {
    setLoading(true)
    
    // 1. Fetch inscriptions for this DNI
    const { data: inscData } = await supabase
      .from('inscripciones')
      .select('*, catedras(*)')
      .eq('dni_estudiante', dni)
    
    if (!inscData || inscData.length === 0) {
      setInscriptions([])
      setLoading(false)
      return
    }

    // 2. For each inscription, fetch attendance and grades to show summary
    const enhancedInscriptions = await Promise.all(inscData.map(async (insc) => {
      // Fetch classes
      const { data: classes } = await supabase
        .from('clases')
        .select('id, estado_clase')
        .eq('catedra_id', insc.catedra_id)
      
      // Fetch attendance
      const { data: attendances } = await supabase
        .from('asistencias')
        .select('*')
        .eq('inscripcion_id', insc.id)
        .eq('estado', 'presente')
      
      const attCount = attendances?.length || 0;
      
      const expectedDates = getStudentExpectedDates(insc.catedras, insc, classes);
      const validDatesCount = expectedDates.filter(dDate => {
        const fs = dDate.toISOString().split('T')[0]
        const dbClase = classes?.find(c => c.fecha === fs)
        return dbClase && dbClase.estado_clase === 'normal'
      }).length
      
      const percentageDenominator = validDatesCount > 0 ? validDatesCount : 1
      const attendancePct = Math.round((attCount / percentageDenominator) * 100);

      // Fetch grades to generic object
      const { data: grades } = await supabase
        .from('notas')
        .select('*')
        .eq('inscripcion_id', insc.id)
      
      const gradesObj = {};
      grades?.forEach(n => {
        gradesObj[n.tipo] = n.valor;
      });
      
      const academic = calculateAcademicStatus(insc.catedras, gradesObj, attendancePct);

      return {
        ...insc,
        summary: {
          attendancePct,
          status: academic.label,
          statusColor: academic.color,
          lastGrade: (grades && grades.length > 0) 
            ? Math.max(...grades.map(n => parseFloat(n.valor) || 0)) 
            : '-'
        }
      }
    }))

    setInscriptions(enhancedInscriptions)
    setLoading(false)
  }

  if (loading) return <div className="min-h-screen flex flex-col items-center justify-center gap-4"><Loader2 className="w-10 h-10 text-primary animate-spin" /><p className="text-muted">Cargando tus materias...</p></div>

  return (
    <div className="min-h-screen bg-background p-6 md:p-12">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-12">
          <div>
            <Link href="/alumno" className="inline-flex items-center gap-2 text-sm text-muted hover:text-foreground transition-all mb-4">
              <ArrowLeft className="w-4 h-4" />
              Salir del portal
            </Link>
            <h1 className="text-3xl font-bold text-foreground">Mis Cátedras</h1>
            <p className="text-muted">Estudiante DNI: <span className="text-foreground font-mono">{dni}</span></p>
          </div>
          <div className="hidden md:flex flex-col items-end">
             <div className="flex items-center gap-2 px-4 py-2 bg-surface border border-border rounded-2xl">
                <Calendar className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium">{new Date().toLocaleDateString('es-AR', { year: 'numeric', month: 'long' })}</span>
             </div>
          </div>
        </div>

        {inscriptions.length === 0 ? (
          <div className="bg-surface border border-dashed border-border rounded-[2rem] p-20 text-center flex flex-col items-center">
            <div className="w-20 h-20 rounded-full bg-muted/10 flex items-center justify-center mb-6">
              <AlertCircle className="w-10 h-10 text-muted" />
            </div>
            <h2 className="text-xl font-bold text-foreground mb-2">No se encontraron inscripciones</h2>
            <p className="text-muted max-w-sm">Si ya te inscribiste, recordá que el docente debe validar tu DNI en el listado para que aparezca acá.</p>
          </div>
        ) : (
          <div className="grid gap-6">
            {inscriptions.map((insc) => (
              <div 
                key={insc.id}
                className="group relative bg-surface border border-border rounded-[2rem] overflow-hidden hover:shadow-2xl hover:shadow-primary/5 transition-all duration-300"
              >
                <div className="absolute top-0 left-0 w-1.5 h-full bg-primary/20 group-hover:bg-primary transition-all" />
                
                <div className="p-8 flex flex-col md:flex-row md:items-center justify-between gap-8">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                       <span className="text-xs font-bold text-primary uppercase tracking-widest">{insc.catedras.codigo}</span>
                       <span className="w-1 h-1 bg-muted rounded-full" />
                       <span className="text-xs text-muted">{insc.catedras.cuatrimestre === 0 ? 'Anual' : `${insc.catedras.cuatrimestre}° Cuat.`}</span>
                    </div>
                    <h3 className="text-2xl font-bold text-foreground mb-4">{insc.catedras.nombre}</h3>
                    
                    <div className="flex flex-wrap items-center gap-6">
                      <div className="flex items-center gap-2">
                         <div className="w-8 h-8 rounded-lg bg-success/10 flex items-center justify-center text-success">
                            <Clock className="w-4 h-4" />
                         </div>
                         <div className="leading-tight">
                            <p className="text-[10px] font-bold text-muted uppercase tracking-wider">Asistencia</p>
                            <p className="font-bold text-foreground">{insc.summary.attendancePct}%</p>
                         </div>
                      </div>
                      <div className="flex items-center gap-2">
                         <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center text-accent">
                            <Award className="w-4 h-4" />
                         </div>
                         <div className="leading-tight">
                            <p className="text-[10px] font-bold text-muted uppercase tracking-wider">Estado</p>
                            <span className={`text-[10px] font-black px-1.5 py-0.5 rounded border ${insc.summary.statusColor}`}>
                               {insc.summary.status}
                            </span>
                         </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                     <Link 
                      href={`/alumno/${dni}/catedra/${insc.catedras.id}`}
                      className="flex items-center gap-2 px-6 py-3 bg-foreground text-background font-bold rounded-2xl hover:opacity-90 transition-all group"
                    >
                      Ver Detalle
                      <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Footer info */}
        <div className="mt-16 p-8 bg-primary/5 border border-primary/10 rounded-3xl flex items-start gap-4">
           <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
              <GraduationCap className="text-primary w-5 h-5" />
           </div>
           <div>
              <h4 className="font-bold text-primary mb-1">Información Importante</h4>
              <p className="text-sm text-primary/80 leading-relaxed">
                 Las notas y porcentajes de asistencia se actualizan al instante una vez que un docente firma una clase o carga una calificación. Si detectás algún error, comunicate directamente con el equipo docente.
              </p>
           </div>
        </div>
      </div>
    </div>
  )
}
