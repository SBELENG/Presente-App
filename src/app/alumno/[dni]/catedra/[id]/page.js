'use client'

import { useState, useEffect, use } from 'react'
import { createClient } from '@/lib/supabase/client'
import { 
  ArrowLeft, 
  CheckCircle, 
  FileText, 
  Download, 
  Printer,
  Calendar,
  Check,
  X as XIcon,
  Loader2,
  Trophy,
  History,
  GraduationCap,
  Minus
} from 'lucide-react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { TIPO_NOTA } from '@/lib/constants'
import { calculateAcademicStatus, getStudentExpectedDates } from '@/lib/academic-logic'

export default function StudentCatedraDetailPage() {
  const params = useParams()
  const { dni, id } = params
  
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    fetchDetail()
  }, [dni, id])

  const fetchDetail = async () => {
    setLoading(true)
    
    // 1. Fetch Inscription & Catedra
    const { data: insc } = await supabase
      .from('inscripciones')
      .select('*, catedras(*)')
      .eq('dni_estudiante', dni)
      .eq('catedra_id', id)
      .single()

    if (!insc) {
      setLoading(false)
      return
    }

    // 2. Fetch Classes
    const { data: classes } = await supabase
      .from('clases')
      .select('*')
      .eq('catedra_id', id)
      .order('fecha', { ascending: true })

    // 3. Fetch Attendances for this inscription
    const { data: attendances } = await supabase
      .from('asistencias')
      .select('*')
      .eq('inscripcion_id', insc.id)

    // 4. Fetch Grades
    const { data: grades } = await supabase
      .from('notas')
      .select('*')
      .eq('inscripcion_id', insc.id)

    setData({ insc, catedra: insc.catedras, classes: classes || [], attendances: attendances || [], grades: grades || [] })
    setLoading(false)
  }

  const handlePrint = () => {
    window.print()
  }

  if (loading) return <div className="h-screen flex items-center justify-center"><Loader2 className="w-10 h-10 text-primary animate-spin" /></div>
  if (!data) return <div className="p-12 text-center">No se encontraron datos.</div>

  const { insc, catedra, classes, attendances, grades } = data
  const DIAS_MAP = { lunes: 1, martes: 2, miercoles: 3, jueves: 4, viernes: 5, sabado: 6, domingo: 0 }
  
  const projectedDates = getStudentExpectedDates(catedra, insc, classes)
  
  // A 'valid' class for the denominator is: 
  // Any session in the plan, UNLESS it exists in the DB with status !== 'normal'
  const validSessions = projectedDates.filter(dDate => {
    const fs = dDate.toISOString().split('T')[0]
    const dbClase = classes.find(c => c.fecha === fs)
    return !dbClase || dbClase.estado_clase === 'normal'
  })

  const totalPresents = attendances.filter(a => a.estado === 'presente').length
  const dictadasValidas = classes.filter(c => c.estado_clase === 'normal')
  
  // Calculate percentage against valid (non-exception) sessions that have ALREADY passed/occured today, 
  // preventing a penalty for future classes.
  // Wait, no. If the user expects "cant de clases" to mean dictadasValidas para este estudiante.
  const validasTomadasCount = projectedDates.filter(dDate => {
     const fs = dDate.toISOString().split('T')[0]
     const dbClase = classes.find(c => c.fecha === fs)
     return dbClase && dbClase.estado_clase === 'normal'
  }).length
  
  // Use the PAST valid sessions count (tomadas). If they haven't had classes, it's 100%.
  const percentageDenominator = validasTomadasCount > 0 ? validasTomadasCount : 1
  const attendancePct = Math.round((totalPresents / percentageDenominator) * 100)

  // Status Logic using Shared Academic Logic
  const gradesObj = {};
  grades.forEach(n => {
    gradesObj[n.tipo] = n.valor;
  });

  const academic = calculateAcademicStatus(catedra, gradesObj, attendancePct);

  // Predict if student can still pass attendance
  const poolRestantes = Math.max(0, validSessions.length - dictadasValidas.length)
  const maxFinalPct = Math.round(((totalPresents + poolRestantes) / Math.max(validSessions.length, 1)) * 100)
  const cannotPassAttendance = maxFinalPct < catedra.porcentaje_asistencia

  const statusLabel = cannotPassAttendance ? 'LIBRE (POR ASISTENCIA)' : academic.label
  const statusColor = cannotPassAttendance ? 'text-danger' : academic.color

  // Grades for display and calculation
  const p1 = parseFloat(grades.find(n => n.tipo === TIPO_NOTA.PARCIAL_1)?.valor)
  const p2 = parseFloat(grades.find(n => n.tipo === TIPO_NOTA.PARCIAL_2)?.valor)
  const rec = parseFloat(grades.find(n => n.tipo === TIPO_NOTA.RECUPERATORIO)?.valor)
  const tp = parseFloat(grades.find(n => (n.tipo === TIPO_NOTA.TP || n.tipo === 'tp_1'))?.valor)

  const calculateStudentAverage = () => {
    const vals = [];
    if (!isNaN(p1)) vals.push(p1);
    if (!isNaN(p2)) vals.push(p2);
    if (!isNaN(tp)) vals.push(tp);
    // Note: Recuperatorio logic for the average can be complex, 
    // here we just use the basic average of existing main assessments.
    if (vals.length === 0) return 0;
    return vals.reduce((a, b) => a + b, 0) / vals.length;
  }
  
  const studentAverage = calculateStudentAverage();

  return (
    <div className="min-h-screen bg-background p-6 md:p-12 print:p-0">
      <div className="max-w-4xl mx-auto">
        {/* Navigation - Hidden on print */}
        <div className="mb-8 print:hidden">
          <Link href={`/alumno/${dni}`} className="inline-flex items-center gap-2 text-sm text-muted hover:text-foreground transition-all">
            <ArrowLeft className="w-4 h-4" />
            Volver a mis materias
          </Link>
        </div>

        {/* Certificate Header (Visible on print) */}
        <div className="bg-surface border border-border rounded-[2.5rem] overflow-hidden shadow-sm relative print:border-none print:shadow-none print:rounded-none">
          {/* Status Banner */}
          <div className={`py-3 px-8 text-center text-xs font-black tracking-widest border-b border-border/50 uppercase ${statusColor} bg-current/5 print:hidden`}>
            Situación Actual: {statusLabel}
          </div>

          <div className="p-8 md:p-12">
            <div className="flex flex-col md:flex-row justify-between items-start gap-8 mb-12">
              <div>
                <h1 className="text-3xl md:text-4xl font-black text-foreground mb-2 leading-tight">
                  {catedra.nombre}
                </h1>
                <p className="text-muted font-medium uppercase tracking-wider text-sm">
                  {catedra.carrera} · {catedra.facultad}
                </p>
                <div className="mt-6 space-y-1">
                   <p className="text-foreground font-bold">{insc.apellido_estudiante}, {insc.nombre_estudiante}</p>
                   <p className="text-muted font-mono text-sm">DNI: {dni}</p>
                </div>
              </div>
              
              <div className="flex flex-col items-end gap-4 print:hidden">
                 <button 
                  onClick={handlePrint}
                  className="flex items-center gap-2 px-5 py-2.5 bg-foreground text-background font-bold rounded-xl hover:opacity-90 transition-all text-sm"
                 >
                    <Printer className="w-4 h-4" />
                    Imprimir Comprobante
                 </button>
                 <div className="text-right text-[10px] text-muted font-bold uppercase tracking-widest">
                    Presente App Verification System
                 </div>
              </div>
            </div>

            {/* Main Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
               <div className="bg-background border border-border rounded-3xl p-6 flex flex-col items-center justify-center text-center">
                  <div className="text-[10px] font-black text-muted uppercase tracking-[0.2em] mb-2">Asistencia</div>
                  <div className={`text-4xl font-black ${attendancePct >= catedra.porcentaje_asistencia ? 'text-success' : 'text-danger'}`}>
                     {attendancePct}%
                  </div>
                  <div className="text-xs text-muted mt-2">{totalPresents} de {validasTomadasCount} clases dictadas</div>
               </div>
               <div className="bg-background border border-border rounded-3xl p-6 flex flex-col items-center justify-center text-center">
                  <div className="text-[10px] font-black text-muted uppercase tracking-[0.2em] mb-2">Promedio Temp.</div>
                  <div className="text-4xl font-black text-foreground">
                     {studentAverage > 0 ? studentAverage.toFixed(1) : '-'}
                  </div>
                  <div className="text-xs text-muted mt-2">
                    {isNaN(p1) ? '' : `P1: ${p1} `}
                    {isNaN(p2) ? '' : `P2: ${p2} `}
                    {isNaN(tp) ? '' : `TP: ${tp}`}
                  </div>
               </div>
               <div className="bg-background border border-border rounded-3xl p-6 flex flex-col items-center justify-center text-center">
                  <div className="text-[10px] font-black text-muted uppercase tracking-[0.2em] mb-2">Condición</div>
                  <div className={`text-xl font-black px-4 py-1 rounded-full border-2 ${statusColor} bg-current/5 mt-1`}>
                     {statusLabel}
                  </div>
               </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
               {/* Attendance History */}
               <div>
                  <h3 className="text-sm font-bold text-foreground mb-6 flex items-center gap-2">
                     <History className="w-4 h-4 text-primary" />
                     Historial de Firmas
                  </h3>
                  <div className="space-y-3">
                     {classes.slice(-8).reverse().map((clase) => {
                        const status = attendances.find(a => a.clase_id === clase.id)?.estado || 'ausente'
                        const isException = clase.estado_clase !== 'normal'
                        return (
                          <div key={clase.id} className="flex items-center justify-between p-4 bg-background/50 border border-border/50 rounded-2xl">
                             <div className="flex items-center gap-3">
                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                                   status === 'presente' ? 'bg-success/10 text-success' : isException ? 'bg-muted/10 text-muted' : 'bg-danger/10 text-danger'
                                }`}>
                                   {status === 'presente' ? <Check className="w-4 h-4" /> : isException ? <Minus className="w-4 h-4" /> : <XIcon className="w-4 h-4" />}
                                </div>
                                <div className="leading-tight">
                                   <p className="text-sm font-bold text-foreground">{clase.tema || 'Clase Dictada'}</p>
                                   <p className="text-[10px] text-muted">{new Date(clase.fecha).toLocaleDateString('es-AR', { dateStyle: 'long' })}</p>
                                </div>
                             </div>
                             <span className="text-[10px] font-bold uppercase text-muted">
                                {isException ? clase.estado_clase : status}
                             </span>
                          </div>
                        )
                     })}
                  </div>
               </div>

               {/* Grades Detail */}
               <div>
                  <h3 className="text-sm font-bold text-foreground mb-6 flex items-center gap-2">
                     <GraduationCap className="w-4 h-4 text-accent" />
                     Detalle de Evaluación
                  </h3>
                  <div className="bg-background/50 border border-border/50 rounded-3xl p-6 py-4 divide-y divide-border/50">
                     <div className="py-4 flex items-center justify-between text-sm">
                        <span className="font-medium text-muted">Parcial 1</span>
                        <span className="font-mono font-bold text-foreground">{p1 || '-'}</span>
                     </div>
                     <div className="py-4 flex items-center justify-between text-sm">
                        <span className="font-medium text-muted">Parcial 2</span>
                        <span className="font-mono font-bold text-foreground">{p2 || '-'}</span>
                     </div>
                     <div className="py-4 flex items-center justify-between text-sm">
                        <span className="font-medium text-muted">Recuperatorio</span>
                        <span className="font-mono font-bold text-foreground">{rec || '-'}</span>
                     </div>
                     <div className="py-4 flex items-center justify-between text-sm">
                        <span className="font-medium text-muted">Trabajo Práctico</span>
                        <span className="font-mono font-bold text-foreground">
                           {grades.find(n => n.tipo === TIPO_NOTA.TP)?.valor || '-'}
                        </span>
                     </div>
                  </div>

                  <div className="mt-8 p-6 bg-accent/5 border border-accent/20 rounded-3xl relative overflow-hidden">
                     <div className="absolute top-0 right-0 p-4 opacity-10">
                        <Trophy className="w-12 h-12 text-accent" />
                     </div>
                     <h4 className="text-sm font-bold text-accent mb-2">Situación de {catedra.porcentaje_asistencia}%</h4>
                     <p className="text-xs text-accent/80 leading-relaxed">
                        Para aprobar esta cátedra necesitás un mínimo de {catedra.porcentaje_asistencia}% de asistencia. Actualmente tenés {attendancePct}%.
                     </p>
                  </div>
               </div>
            </div>
          </div>

          <div className="p-8 bg-muted/5 border-t border-border/50 text-center text-[10px] text-muted uppercase tracking-[0.3em] hidden print:block">
             Este documento es una copia digital emitida por el Sistema Presente. Consulta válida al {new Date().toLocaleString('es-AR')}.
          </div>
        </div>
      </div>

      {/* CSS for print */}
      <style jsx global>{`
        @media print {
          body { background: white !important; }
          .print\:hidden { display: none !important; }
          .print\:block { display: block !important; }
          .print\:border-none { border: none !important; }
          .print\:shadow-none { box-shadow: none !important; }
        }
      `}</style>
    </div>
  )
}
