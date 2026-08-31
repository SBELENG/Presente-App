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
  ClipboardList,
  Zap,
  X
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
  
  // Quick Entry Modal States
  const [showQuickEntry, setShowQuickEntry] = useState(false);
  const [quickEval, setQuickEval] = useState('');
  const [quickSearch, setQuickSearch] = useState('');
  const [quickStudent, setQuickStudent] = useState(null);
  const [quickGrade, setQuickGrade] = useState('');
  const [quickMessage, setQuickMessage] = useState({ type: '', text: '' });
  
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
            let displayValue = grade.valor;
            if (displayValue === -1) displayValue = 'A';
            else if (displayValue === -2) displayValue = 'D';
            initialMatrix[grade.inscripcion_id][typeKey] = displayValue !== null ? String(displayValue) : '';
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
        const rawV = grades[`tp_${i}`];
        if (rawV === 'A' || rawV === 'D' || rawV === 'a' || rawV === 'd') continue;
        const v = parseFloat(rawV);
        if (!isNaN(v)) vals.push(v);
    }
    
    if (vals.length > 0) return (vals.reduce((a,b) => a+b, 0) / vals.length).toFixed(1);
    return '-';
  };

  const handleInputChange = (inscId, tipo, value) => {
    let finalValue = value;
    if (tipo.startsWith('tp_')) {
      if (typeof value === 'string' && ['a', 'd'].includes(value.toLowerCase())) {
        finalValue = value.toUpperCase();
      } else {
        const num = parseFloat(value);
        if (value !== '' && (num < 0 || num > 10)) return;
      }
    } else {
      const num = parseFloat(value);
      if (value !== '' && (num < 0 || num > 10)) return;
    }
    
    setMatrix(prev => ({
      ...prev,
      [inscId]: { ...prev[inscId], [tipo]: finalValue }
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
              const rawVal = val;
              let numericVal = parseFloat(val);
              
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

              if (dbType === 'tp') {
                  if (rawVal === 'A') numericVal = -1;
                  else if (rawVal === 'D') numericVal = -2;
              }
              
              if (isNaN(numericVal)) return;

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

  const handleQuickSave = (e) => {
    e.preventDefault();
    if (!quickEval || !quickStudent || quickGrade === '') return;
    
    handleInputChange(quickStudent.id, quickEval, quickGrade);
    
    setQuickMessage({ 
      type: 'success', 
      text: `Nota guardada para ${quickStudent.apellido_estudiante} (${quickGrade})` 
    });
    
    // Clear for next
    setQuickStudent(null);
    setQuickSearch('');
    setQuickGrade('');
    
    // Clear success message after 2 seconds
    setTimeout(() => setQuickMessage({ type: '', text: '' }), 2000);
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
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
          <div>
            <Link href={`/docente/catedras/${id}`} className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-500 hover:text-blue-700 transition-all mb-2">
              <ArrowLeft className="w-4 h-4" /> Volver
            </Link>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight leading-none mb-2">
              Matriz de Notas
            </h1>
            <p className="text-sm text-slate-600 font-bold flex items-center gap-2">
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
                placeholder="Buscar alumno..." 
                value={search} 
                onChange={(e) => setSearch(e.target.value)} 
                className="w-full pl-10 pr-4 py-2.5 bg-white border-2 border-slate-200 rounded-xl shadow-sm focus:border-blue-600 focus:ring-4 focus:ring-blue-100 text-slate-900 placeholder-slate-400 outline-none transition-all font-bold text-sm" 
              />
            </div>
            <button onClick={() => setShowQuickEntry(true)} className="w-full md:w-auto px-4 py-2.5 bg-purple-600 text-white font-bold rounded-xl shadow-lg shadow-purple-600/25 hover:bg-purple-700 hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2 text-sm">
              <Zap className="w-4 h-4" />
              CARGA RÁPIDA
            </button>
            <button onClick={handleSave} disabled={saving} className="w-full md:w-auto px-6 py-2.5 bg-blue-600 text-white font-bold rounded-xl shadow-lg shadow-blue-600/25 hover:bg-blue-700 hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2 text-sm disabled:opacity-50">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
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
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xl shadow-slate-300/30 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="px-4 py-3 text-[10px] font-bold uppercase text-slate-500 tracking-wider sticky left-0 bg-slate-50 z-10 border-r border-slate-200">Alumno / Inscripto</th>
                  
                  {/* Dynamic Headers */}
                  {evaluaciones.map(ev => (
                    <th key={ev.id} className={`px-2 py-3 text-[10px] font-bold uppercase tracking-wider text-center ${
                        ev.type === 'parcial' ? 'text-blue-600' : 
                        ev.type === 'rec' ? 'text-amber-600' : 
                        ev.type === 'tp' ? 'text-purple-600' :
                        'text-emerald-600'
                    }`}>
                        <div className="flex flex-col items-center">
                            <span className="text-[9px] opacity-70 mb-0.5">{ev.label}</span>
                            <span className="text-xs font-black">{ev.short}</span>
                        </div>
                    </th>
                  ))}

                  <th className="px-4 py-3 text-[10px] font-bold uppercase text-slate-500 tracking-wider text-center">Prom.</th>
                  <th className="px-4 py-3 text-[10px] font-bold uppercase text-slate-600 tracking-wider text-center bg-blue-50/50">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredStudents.length > 0 ? (
                  filteredStudents.map((s) => {
                    const status = calculateStatus(s.id);
                    return (
                      <tr key={s.id} className="group hover:bg-blue-50/20 transition-colors">
                        <td className="px-4 py-2 sticky left-0 bg-white group-hover:bg-blue-50/20 z-10 border-r border-slate-200">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-slate-500 text-xs shrink-0">{s.apellido_estudiante?.[0]}{s.nombre_estudiante?.[0]}</div>
                            <div className="min-w-0">
                              <p className="font-bold text-slate-900 text-sm truncate">{s.apellido_estudiante}, {s.nombre_estudiante}</p>
                              <p className="text-[10px] text-slate-500">DNI: {s.dni_estudiante}</p>
                            </div>
                          </div>
                        </td>

                        {/* Dynamic Inputs */}
                        {evaluaciones.map(ev => (
                            <td key={ev.id} className="px-2 py-2 text-center">
                                <input 
                                    type="text" 
                                    value={matrix[s.id]?.[ev.id] || ''} 
                                    onChange={(e) => handleInputChange(s.id, ev.id, e.target.value)} 
                                    className={`w-14 p-1.5 text-center border rounded-lg font-bold bg-white focus:ring-2 outline-none transition-all shadow-sm text-sm ${
                                        ev.type === 'parcial' ? 'border-blue-200 focus:border-blue-500 focus:ring-blue-100 text-blue-900' : 
                                        ev.type === 'rec' ? 'border-amber-200 focus:border-amber-500 focus:ring-amber-100 text-amber-900' : 
                                        ev.type === 'tp' ? 'border-purple-200 focus:border-purple-500 focus:ring-purple-100 text-purple-900' :
                                        'border-emerald-200 focus:border-emerald-500 focus:ring-emerald-100 text-emerald-900'
                                    }`} 
                                    placeholder="-" 
                                />
                            </td>
                        ))}

                        <td className="px-4 py-2 text-center">
                          <div className="inline-flex items-center justify-center min-w-[3rem] px-2 py-1 rounded bg-slate-50 border border-slate-200 font-bold text-slate-900 text-xs">
                            {calculatePromedio(s.id)}
                          </div>
                        </td>
                        <td className="px-4 py-2 text-center bg-blue-50/10 group-hover:bg-blue-50/30 transition-colors">
                          <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border font-bold text-[10px] tracking-wide whitespace-nowrap ${status.color}`}>
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

      {/* Quick Entry Modal */}
      {showQuickEntry && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[2rem] w-full max-w-lg shadow-2xl overflow-hidden animate-scale-in">
            <div className="p-8 border-b-2 border-slate-100 flex justify-between items-center bg-purple-50/50">
              <div>
                <h2 className="text-2xl font-black text-slate-900 flex items-center gap-2">
                  <Zap className="w-6 h-6 text-purple-600" /> Carga Rápida
                </h2>
                <p className="text-slate-500 font-bold text-sm mt-1">Cargá las notas más rápido sin buscar en la tabla.</p>
              </div>
              <button onClick={() => setShowQuickEntry(false)} className="p-2 text-slate-400 hover:text-slate-900 transition-colors bg-white rounded-full shadow-sm">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <form onSubmit={handleQuickSave} className="p-8 space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-slate-500">Evaluación</label>
                <select 
                  required
                  value={quickEval} 
                  onChange={(e) => setQuickEval(e.target.value)}
                  className="w-full p-4 bg-slate-50 border-2 border-slate-200 rounded-2xl focus:border-purple-600 focus:ring-4 focus:ring-purple-100 text-slate-900 font-black outline-none transition-all appearance-none"
                >
                  <option value="" disabled>Seleccioná una evaluación...</option>
                  {evaluaciones.map(ev => (
                    <option key={ev.id} value={ev.id}>{ev.label}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2 relative">
                <label className="text-xs font-black uppercase tracking-widest text-slate-500">Alumno</label>
                {!quickStudent ? (
                  <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input 
                      autoFocus
                      type="text" 
                      placeholder="Buscar por nombre o DNI..." 
                      value={quickSearch}
                      onChange={(e) => setQuickSearch(e.target.value)}
                      className="w-full pl-12 pr-4 p-4 bg-white border-2 border-slate-200 rounded-2xl focus:border-purple-600 focus:ring-4 focus:ring-purple-100 text-slate-900 font-black outline-none transition-all"
                    />
                    
                    {quickSearch.length > 1 && (
                      <div className="absolute top-full mt-2 w-full bg-white border-2 border-slate-200 rounded-2xl shadow-xl max-h-48 overflow-y-auto z-10">
                        {inscriptos
                          .filter(s => `${s.nombre_estudiante} ${s.apellido_estudiante} ${s.dni_estudiante}`.toLowerCase().includes(quickSearch.toLowerCase()))
                          .map(s => (
                            <button
                              key={s.id}
                              type="button"
                              onClick={() => {
                                setQuickStudent(s);
                                setQuickSearch('');
                              }}
                              className="w-full text-left p-4 hover:bg-purple-50 transition-colors border-b border-slate-100 last:border-0 flex items-center justify-between"
                            >
                              <span className="font-black text-slate-900">{s.apellido_estudiante}, {s.nombre_estudiante}</span>
                              <span className="text-xs font-bold text-slate-500">DNI: {s.dni_estudiante}</span>
                            </button>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex justify-between items-center bg-purple-50 border-2 border-purple-200 rounded-2xl p-4">
                    <div>
                      <p className="font-black text-purple-900">{quickStudent.apellido_estudiante}, {quickStudent.nombre_estudiante}</p>
                      <p className="text-xs font-bold text-purple-600 uppercase tracking-widest">DNI: {quickStudent.dni_estudiante}</p>
                    </div>
                    <button type="button" onClick={() => setQuickStudent(null)} className="text-purple-400 hover:text-purple-700">
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-slate-500">Nota</label>
                <input 
                  required
                  type="text"
                  value={quickGrade}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (quickEval.startsWith('tp_') && ['a', 'A', 'd', 'D'].includes(val)) {
                      setQuickGrade(val.toUpperCase());
                    } else if (val === '' || (parseFloat(val) >= 0 && parseFloat(val) <= 10)) {
                      setQuickGrade(val);
                    }
                  }}
                  className="w-full p-4 bg-white border-2 border-slate-200 rounded-2xl focus:border-purple-600 focus:ring-4 focus:ring-purple-100 text-slate-900 font-black outline-none transition-all text-xl"
                  placeholder={quickEval.startsWith('tp_') ? "Ej: 8.5, A o D" : "Ej: 8.5"}
                />
              </div>

              {quickMessage.text && (
                <div className="p-4 bg-emerald-50 border-2 border-emerald-200 rounded-xl text-emerald-700 text-sm font-bold flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5" /> {quickMessage.text}
                </div>
              )}

              <button 
                type="submit" 
                disabled={!quickEval || !quickStudent || quickGrade === ''}
                className="w-full p-4 bg-purple-600 text-white font-black rounded-2xl shadow-xl shadow-purple-600/25 hover:bg-purple-700 transition-all disabled:opacity-50 mt-4"
              >
                GUARDAR Y SIGUIENTE
              </button>
              
              <p className="text-center text-xs font-bold text-slate-400 mt-2">No olvides apretar "Guardar Cambios" en la pantalla principal al finalizar.</p>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
