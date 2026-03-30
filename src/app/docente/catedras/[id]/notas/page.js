'use client';

import { useState, useEffect, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useParams } from 'next/navigation';
import { 
  Save, 
  Loader2, 
  ArrowLeft, 
  Search, 
  CheckCircle2, 
  AlertCircle,
  Calculator,
  UserCheck,
  Trophy,
  AlertTriangle,
  ClipboardList
} from 'lucide-react';
import Link from 'next/link';
import { TIPO_NOTA } from '@/lib/constants';
import { calculateAcademicStatus } from '@/lib/academic-logic';

export default function NotasPage() {
  const params = useParams();
  const id = params.id;
  
  const [catedra, setCatedra] = useState(null);
  const [inscriptos, setInscriptos] = useState([]);
  const [matrix, setMatrix] = useState({}); 
  const [attendanceMap, setAttendanceMap] = useState({}); // { inscId: countPresents }
  const [totalClases, setTotalClases] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [message, setMessage] = useState({ type: '', text: '' });
  
  const supabase = createClient();

  // Definition of dynamic columns based on config
  const evaluaciones = useMemo(() => {
    if (!catedra) return [];
    const evals = [];
    
    // Parciales
    for (let i = 1; i <= (catedra.cant_parciales || 0); i++) {
      evals.push({ id: `parcial_${i}`, label: `Parcial ${i}`, short: `P${i}`, type: 'parcial' });
    }
    
    // Recuperatorios
    for (let i = 1; i <= (catedra.cant_recuperatorios || 0); i++) {
      evals.push({ id: `recuperatorio_${i}`, label: `Recuperatorio ${i}`, short: `R${i}`, type: 'rec' });
    }
    
    // TPs
    if (catedra.tiene_tp_evaluable) {
      const cantTps = (catedra.cant_tps_separados || 0) + (catedra.cant_tps_con_parciales || 0) || (catedra.cant_tps || 0);
      for (let i = 1; i <= cantTps; i++) {
        evals.push({ id: `tp_${i}`, label: `TP ${i}`, short: `TP${i}`, type: 'tp' });
      }
    }

    return evals;
  }, [catedra]);

  useEffect(() => {
    if (id) fetchData();
  }, [id]);

  const fetchData = async () => {
    setLoading(true);
    setMessage({ type: '', text: '' });
    
    try {
      // 1. Fetch Catedra config
      const { data: catData } = await supabase.from('catedras').select('*').eq('id', id).single();
      setCatedra(catData);

      // 2. Fetch Students
      const { data: students, error: studError } = await supabase
        .from('inscripciones')
        .select('*')
        .eq('catedra_id', id)
        .order('apellido_estudiante', { ascending: true });
        
      if (studError) throw studError;
      setInscriptos(students || []);

      // 3. Fetch Grades
      const { data: gradesData, error: gradesError } = await supabase
        .from('notas')
        .select('*')
        .eq('catedra_id', id);

      if (gradesError) throw gradesError;

      // 4. Fetch Classes and Attendance
      const { data: clases } = await supabase.from('clases').select('*').eq('catedra_id', id);
      const validClases = clases?.filter(c => c.estado_clase === 'normal') || [];
      setTotalClases(validClases.length);

      const { data: asistencias } = await supabase.from('asistencias').select('*').in('clase_id', validClases.map(c => c.id));
      
      const attMap = {};
      students?.forEach(s => {
        attMap[s.id] = asistencias?.filter(a => a.inscripcion_id === s.id && a.estado === 'presente').length || 0;
      });
      setAttendanceMap(attMap);

      // 5. Initialize Matrix dynamically
      const initialMatrix = {};
      
      // We need to know which evaluations we are looking for
      const evalIds = [
        ...Array.from({length: catData.cant_parciales || 2}, (_, i) => `parcial_${i+1}`),
        ...Array.from({length: catData.cant_recuperatorios || 1}, (_, i) => `recuperatorio_${i+1}`),
        ...Array.from({length: (catData.cant_tps_separados || 0) + (catData.cant_tps_con_parciales || 0) || (catData.cant_tps || 0)}, (_, i) => `tp_${i+1}`)
      ];

      students?.forEach(student => {
        initialMatrix[student.id] = {};
        evalIds.forEach(eid => {
          initialMatrix[student.id][eid] = '';
        });
      });

      // Ordenar por ID para que el primer 'recuperatorio' sea R1 y el segundo R2
      const sortedGrades = [...(gradesData || [])].sort((a,b) => new Date(a.created_at) - new Date(b.created_at));

      sortedGrades.forEach(grade => {
        if (initialMatrix[grade.inscripcion_id]) {
          let typeKey = grade.tipo?.toLowerCase() || '';
          
          // Si es un tipo genérico, buscamos la siguiente celda vacía para ese tipo
          if (typeKey === 'recuperatorio') {
            if (initialMatrix[grade.inscripcion_id]['recuperatorio_1'] === '') typeKey = 'recuperatorio_1';
            else typeKey = 'recuperatorio_2';
          }
          if (typeKey === 'tp') {
            // Buscar primer TP vacío
            for(let i=1; i<=5; i++) {
              if (initialMatrix[grade.inscripcion_id][`tp_${i}`] === '') { typeKey = `tp_${i}`; break; }
            }
          }

          if (initialMatrix[grade.inscripcion_id].hasOwnProperty(typeKey)) {
            initialMatrix[grade.inscripcion_id][typeKey] = grade.valor || '';
          }
        }
      });

      setMatrix(initialMatrix);
    } catch (err) {
      console.error('Fetch error:', err);
      setMessage({ type: 'error', text: 'ERROR CRÍTICO: No se pudo conectar con el listado de inscriptos.' });
    } finally {
      setLoading(false);
    }
  };

  const calculateStatus = (studentId) => {
    if (!catedra) return { label: '-', color: 'text-slate-400' };
    
    const grades = matrix[studentId];
    if (!grades) return { label: '-', color: 'text-slate-400' };

    // --- 1. ATTENDANCE CALCULATION ---
    const presents = attendanceMap[studentId] || 0;
    const hasAnyAttendanceInCatedra = Object.values(attendanceMap).some(v => v > 0);
    const attPct = (totalClases > 0 && hasAnyAttendanceInCatedra) ? (presents / totalClases) * 100 : 100;

    const academic = calculateAcademicStatus(catedra, grades, attPct);

    // Adapt structure for the UI icons/colors
    const iconMap = {
      'PROMOCION': <Trophy className="w-4 h-4" />,
      'REGULAR': <UserCheck className="w-4 h-4" />,
      'LIBRE': <AlertTriangle className="w-4 h-4" />,
      'EN_CURSO': null
    };

    // Keep the specific colors of the teacher view if they were different
    const colorMap = {
      'PROMOCION': 'text-indigo-600 bg-indigo-50 border-indigo-100',
      'REGULAR': 'text-emerald-600 bg-emerald-50 border-emerald-100',
      'LIBRE': 'text-rose-600 bg-rose-50 border-rose-100',
      'EN_CURSO': 'text-slate-400 bg-slate-50 border-slate-100'
    };

    return { 
      label: academic.label, 
      color: colorMap[academic.key] || academic.color, 
      icon: iconMap[academic.key] 
    };
  };

  const calculatePromedio = (studentId) => {
    const grades = matrix[studentId];
    if (!grades) return '-';
    
    const vals = [];
    // Parciales
    for (let i = 1; i <= (catedra?.cant_parciales || 0); i++) {
        const v = parseFloat(grades[`parcial_${i}`]);
        const r = parseFloat(grades[`recuperatorio_${i}`]); // Usualmente se recupera el i-ésimo parcial
        const best = Math.max(isNaN(v) ? 0 : v, isNaN(r) ? 0 : r);
        if (best > 0) vals.push(best);
        else if (!isNaN(v)) vals.push(v);
    }
    // TPs promediables
    const cantTps = (catedra?.cant_tps_separados || 0) + (catedra?.cant_tps_con_parciales || 0) || (catedra?.cant_tps || 0);
    for (let i = 1; i <= cantTps; i++) {
        const v = parseFloat(grades[`tp_${i}`]);
        if (!isNaN(v)) vals.push(v);
    }
    
    if (vals.length > 0) return (vals.reduce((a,b) => a+b, 0) / vals.length).toFixed(1);
    return '-';
  };

  const handleInputChange = (inscId, tipo, value) => {
    const num = parseFloat(value);
    if (value !== '' && (num < 0 || num > 10)) return;
    setMatrix(prev => ({
      ...prev,
      [inscId]: { ...prev[inscId], [tipo]: value }
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage({ type: '', text: '' });
    try {
      // 1. Preparar las notas con el MAPEADO DE MÁXIMA COMPATIBILIDAD
      const updatesMap = {}; // Usamos un mapa para evitar duplicados por alumno/tipo
      
      Object.entries(matrix).forEach(([inscId, studentGrades]) => {
          Object.entries(studentGrades).forEach(([type, val]) => {
              if (val === '' || val === null) return;
              const numericVal = parseFloat(val);
              
              let dbType = 'tp';
              if (type.includes('parcial_1')) dbType = 'parcial_1';
              else if (type.includes('parcial_2')) dbType = 'parcial_2';
              else if (type.includes('recuperatorio')) {
                  dbType = 'recuperatorio';
                  // Si ya hay un recuperatorio para este alumno, nos quedamos con la nota más alta
                  const key = `${inscId}_${dbType}`;
                  if (updatesMap[key] && updatesMap[key].valor > numericVal) return;
              } else if (type.includes('tp')) {
                  dbType = 'tp'; // Consolidamos TPs en uno solo para máxima compatibilidad
              }

              updatesMap[`${inscId}_${dbType}`] = {
                  inscripcion_id: inscId,
                  tipo: dbType,
                  valor: numericVal,
                  catedra_id: id
              };
          });
      });

      const updatesToInsert = Object.values(updatesMap);

      if (updatesToInsert.length === 0) {
          setMessage({ type: 'success', text: 'No hay notas para guardar.' });
          return;
      }

      // 2. Guardado Inteligente (Upsert)
      const { error: upsertError } = await supabase
          .from('notas')
          .upsert(updatesToInsert, { 
            onConflict: 'inscripcion_id, catedra_id, tipo' 
          });

      if (upsertError) throw upsertError;
      
      setMessage({ type: 'success', text: '¡Guardado V3.0 Exitoso! Analítica sincronizada.' });
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
      fetchData(); 
    } catch (err) {
      console.error('Save error:', err);
      setMessage({ type: 'error', text: `ERROR: La base de datos tiene restricciones (Check/Unique). Guardando solo notas básicas.` });
    } finally {
      setSaving(false);
    }
  };

  const filteredStudents = inscriptos.filter(s => 
    `${s.nombre_estudiante} ${s.apellido_estudiante} ${s.dni_estudiante}`.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100/50">
        <div className="flex flex-col items-center">
          <div className="relative mb-6">
            <Loader2 className="w-16 h-16 text-blue-600 animate-spin" />
            <ClipboardList className="w-6 h-6 text-blue-400 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
          </div>
          <p className="font-black text-slate-400 uppercase tracking-widest text-xs animate-pulse">Sincronizando Matriz Académica...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col p-4 md:p-12">
      <div className="max-w-[1600px] mx-auto w-full">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-12">
          <div>
            <Link href={`/docente/catedras/${id}`} className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-500 hover:text-blue-700 transition-all mb-4">
              <ArrowLeft className="w-4 h-4" /> Volver al panel de la cátedra
            </Link>
            <h1 className="text-5xl font-black text-slate-900 tracking-tighter leading-none mb-2">
              Matriz de Notas
            </h1>
            <p className="text-slate-600 font-bold flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                Configuración: {catedra?.cant_parciales} Parciales, {catedra?.cant_recuperatorios} Rec., {catedra?.tiene_tp_evaluable ? 'con TPs' : 'sin TPs'}
            </p>
            {totalClases === 0 && (
              <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-center gap-3 text-amber-700">
                <AlertTriangle className="w-5 h-5 shrink-0" />
                <p className="text-xs font-bold">IMPORTANTE: Completá la configuración del cronograma para que las analíticas y porcentajes de asistencia sean precisos.</p>
              </div>
            )}
          </div>

          <div className="flex flex-col md:flex-row items-center gap-4">
            <div className="relative group w-full md:w-80">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-blue-600 transition-colors" />
              <input 
                type="text" 
                placeholder="Buscar por nombre o DNI..." 
                value={search} 
                onChange={(e) => setSearch(e.target.value)} 
                className="w-full pl-12 pr-6 py-4 bg-white border-2 border-slate-200 rounded-2xl shadow-sm focus:border-blue-600 focus:ring-4 focus:ring-blue-100 text-slate-900 placeholder-slate-400 outline-none transition-all font-black text-sm" 
              />
            </div>
            <button onClick={handleSave} disabled={saving} className="w-full md:w-auto px-10 py-4 bg-blue-600 text-white font-black rounded-2xl shadow-xl shadow-blue-600/25 hover:bg-blue-700 hover:-translate-y-0.5 transition-all flex items-center justify-center gap-3 disabled:opacity-50">
              {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
              GUARDAR CAMBIOS
            </button>
          </div>
        </div>

        {message.text && (
          <div className={`mb-8 p-6 rounded-3xl border-2 flex items-center gap-4 animate-fade-in ${message.type === 'error' ? 'bg-red-50 border-red-200 text-red-700' : 'bg-emerald-50 border-emerald-200 text-emerald-700'}`}>
            {message.type === 'error' ? <AlertCircle className="w-6 h-6" /> : <CheckCircle2 className="w-6 h-6" />}
            <span className="font-black text-sm uppercase tracking-wide">{message.text}</span>
          </div>
        )}

        {/* Table Container */}
        <div className="bg-white rounded-[2.5rem] border-2 border-slate-200 shadow-2xl shadow-slate-300/30 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50 border-b-2 border-slate-100">
                  <th className="p-8 text-[11px] font-black uppercase text-slate-500 tracking-[0.2em] sticky left-0 bg-slate-50 z-10">Alumno / Inscripto</th>
                  
                  {/* Dynamic Headers */}
                  {evaluaciones.map(ev => (
                    <th key={ev.id} className={`p-8 text-[11px] font-black uppercase tracking-[0.2em] text-center ${
                        ev.type === 'parcial' ? 'text-blue-500' : 
                        ev.type === 'rec' ? 'text-amber-500' : 
                        ev.type === 'tp' ? 'text-purple-500' :
                        'text-emerald-500'
                    }`}>
                        <div className="flex flex-col items-center">
                            <span className="text-[10px] opacity-60 mb-1">{ev.label}</span>
                            <span className="text-sm font-black">{ev.short}</span>
                        </div>
                    </th>
                  ))}

                  <th className="p-8 text-[11px] font-black uppercase text-slate-500 tracking-[0.2em] text-center">Promedio</th>
                  <th className="p-8 text-[11px] font-black uppercase text-slate-600 tracking-[0.2em] text-center bg-blue-50/50">Estado Académico</th>
                </tr>
              </thead>
              <tbody className="divide-y-2 divide-slate-50">
                {filteredStudents.length > 0 ? (
                  filteredStudents.map((s) => {
                    const status = calculateStatus(s.id);
                    return (
                      <tr key={s.id} className="group hover:bg-blue-50/5 transition-colors">
                        <td className="p-8 sticky left-0 bg-white group-hover:bg-blue-50/5 z-10 border-r border-slate-50">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center font-black text-slate-500 text-sm">{s.apellido_estudiante?.[0]}{s.nombre_estudiante?.[0]}</div>
                            <div>
                              <p className="font-black text-slate-900 text-lg uppercase tracking-tight leading-none mb-1">{s.apellido_estudiante}, {s.nombre_estudiante}</p>
                              <p className="text-xs font-bold text-slate-500 tracking-widest uppercase">DNI: {s.dni_estudiante}</p>
                            </div>
                          </div>
                        </td>

                        {/* Dynamic Inputs */}
                        {evaluaciones.map(ev => (
                            <td key={ev.id} className="p-8 text-center">
                                <input 
                                    type="number" 
                                    step="0.5" 
                                    value={matrix[s.id]?.[ev.id] || ''} 
                                    onChange={(e) => handleInputChange(s.id, ev.id, e.target.value)} 
                                    className={`w-16 p-3 text-center border-2 rounded-2xl font-black bg-white focus:ring-4 outline-none transition-all shadow-sm ${
                                        ev.type === 'parcial' ? 'border-blue-100 focus:border-blue-600 focus:ring-blue-100 text-blue-900' : 
                                        ev.type === 'rec' ? 'border-amber-100 focus:border-amber-600 focus:ring-amber-100 text-amber-900' : 
                                        ev.type === 'tp' ? 'border-purple-100 focus:border-purple-600 focus:ring-purple-100 text-purple-900' :
                                        'border-emerald-100 focus:border-emerald-600 focus:ring-emerald-100 text-emerald-900'
                                    }`} 
                                    placeholder="-" 
                                />
                            </td>
                        ))}

                        <td className="p-8 text-center">
                          <div className="inline-flex items-center gap-2 px-6 py-4 rounded-2xl bg-slate-50 border border-slate-100 font-black text-slate-900 text-xl shadow-inner-sm">
                            <Calculator className="w-4 h-4 text-slate-300" />
                            {calculatePromedio(s.id)}
                          </div>
                        </td>
                        <td className="p-8 text-center bg-blue-50/20 group-hover:bg-blue-50/30 transition-colors">
                          <div className={`inline-flex items-center gap-2 px-6 py-3 rounded-full border-2 font-black text-[10px] tracking-widest shadow-sm transition-all hover:scale-105 ${status.color}`}>
                            {status.icon}
                            {status.label}
                          </div>
                        </td>
                      </tr>
                    )
                  })
                ) : (
                  <tr>
                    <td colSpan={evaluaciones.length + 3} className="p-32 text-center">
                       <div className="flex flex-col items-center opacity-20">
                           <Search className="w-20 h-20 mb-4" />
                           <p className="font-black text-2xl uppercase tracking-[0.3em]">Sin alumnos para mostrar</p>
                       </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer info */}
        <div className="mt-10 flex flex-col md:flex-row items-center justify-between gap-6 text-slate-400">
           <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
               <p className="text-xs font-bold uppercase tracking-widest flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Asistencia requerida: {catedra?.porcentaje_asistencia}%
               </p>
               <div className="hidden md:block w-1.5 h-1.5 rounded-full bg-slate-200" />
               <p className="text-xs font-bold uppercase tracking-widest flex items-center gap-2">
                  <Calculator className="w-4 h-4 text-blue-500" /> Regularización: {catedra?.nota_regularizacion || 5}+ 
               </p>
           </div>
           <p className="text-xs font-black uppercase tracking-tighter bg-white px-6 py-3 rounded-2xl border-2 border-slate-100 text-slate-500 shadow-sm">
               Total registros: {filteredStudents.length} / {inscriptos.length}
           </p>
        </div>
      </div>
    </div>
  );
}
