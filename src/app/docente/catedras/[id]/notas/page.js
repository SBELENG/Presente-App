'use client';

import { useState, useEffect } from 'react';
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
  MoveRight
} from 'lucide-react';
import Link from 'next/link';
import { TIPO_NOTA } from '@/lib/constants';

export default function NotasPage() {
  const params = useParams();
  const id = params.id;
  
  const [inscriptos, setInscriptos] = useState([]);
  const [matrix, setMatrix] = useState({}); // { insc_id: { parcial_1, parcial_2, final } }
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [message, setMessage] = useState({ type: '', text: '' });
  
  const supabase = createClient();

  useEffect(() => {
    if (id) fetchData();
  }, [id]);

  const fetchData = async () => {
    setLoading(true);
    setMessage({ type: '', text: '' });
    
    try {
      // 1. Get students from 'inscripciones' (what the user calls "inscriptos")
      const { data: students, error: studError } = await supabase
        .from('inscripciones')
        .select('*')
        .eq('catedra_id', id)
        .order('apellido_estudiante', { ascending: true });
        
      if (studError) throw studError;
      setInscriptos(students || []);

      // 2. Get grades from 'notas'
      const { data: gradesData, error: gradesError } = await supabase
        .from('notas')
        .select('*')
        .eq('catedra_id', id);

      if (gradesError) throw gradesError;

      // 3. Map vertical rows to a horizontal matrix { inscId: { type: value } }
      const initialMatrix = {};
      students?.forEach(student => {
        initialMatrix[student.id] = {
          [TIPO_NOTA.PARCIAL_1]: '',
          [TIPO_NOTA.PARCIAL_2]: '',
          'final': ''
        };
      });

      gradesData?.forEach(grade => {
        if (initialMatrix[grade.inscripcion_id]) {
          initialMatrix[grade.inscripcion_id][grade.tipo] = grade.valor || '';
        }
      });

      setMatrix(initialMatrix);
    } catch (err) {
      console.error('Fetch error:', err);
      setMessage({ type: 'error', text: 'ERROR CRÍTICO: No se pudo conectar con el listado de inscriptos (Matrix V3).' });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (inscId, tipo, value) => {
    // Validation 0-10
    const num = parseFloat(value);
    if (value !== '' && (num < 0 || num > 10)) return;

    setMatrix(prev => ({
      ...prev,
      [inscId]: {
        ...prev[inscId],
        [tipo]: value
      }
    }));
  };

  const calculatePromedio = (studentId) => {
    const grades = matrix[studentId];
    if (!grades) return '-';
    
    const v1 = parseFloat(grades[TIPO_NOTA.PARCIAL_1]);
    const v2 = parseFloat(grades[TIPO_NOTA.PARCIAL_2]);
    
    if (!isNaN(v1) && !isNaN(v2)) {
      return ((v1 + v2) / 2).toFixed(1);
    }
    return '-';
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage({ type: '', text: '' });
    
    try {
      // Convert matrix back to vertical rows for Supabase
      const updates = [];
      Object.entries(matrix).forEach(([inscId, grades]) => {
        Object.entries(grades).forEach(([tipo, valor]) => {
          if (valor !== '' && valor !== null) {
            updates.push({
              catedra_id: id,
              inscripcion_id: inscId,
              tipo: tipo,
              valor: parseFloat(valor),
              updated_at: new Date().toISOString()
            });
          }
        });
      });

      // Upsert based on (catedra_id, inscripcion_id, tipo) - Adjust onConflict if needed
      const { error } = await supabase
        .from('notas')
        .upsert(updates, { onConflict: 'inscripcion_id, tipo' });

      if (error) throw error;
      
      setMessage({ type: 'success', text: 'Notas guardadas con éxito en el sistema.' });
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } catch (err) {
      console.error('Save error:', err);
      setMessage({ type: 'error', text: 'Ocurrió un error al guardar. Revisa tu conexión.' });
    } finally {
      setSaving(false);
    }
  };

  const filteredStudents = inscriptos.filter(s => 
    `${s.nombre_estudiante} ${s.apellido_estudiante} ${s.dni_estudiante}`.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center">
          <Loader2 className="w-12 h-12 text-blue-600 animate-spin mb-4" />
          <p className="font-black text-slate-400 uppercase tracking-widest text-xs">Sincronizando alumnos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col p-4 md:p-12">
      <div className="max-w-[1400px] mx-auto w-full">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-12">
          <div>
            <Link 
              href={`/docente/catedras/${id}`} 
              className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-400 hover:text-blue-600 transition-all mb-4"
            >
              <ArrowLeft className="w-4 h-4" /> Volver al panel de la cátedra
            </Link>
            <h1 className="text-5xl font-black text-slate-900 tracking-tighter leading-none mb-2">
              Matriz de Notas
            </h1>
            <p className="text-slate-500 font-medium">Gestión integral de inscriptos y calificaciones.</p>
          </div>

          <div className="flex flex-col md:flex-row items-center gap-4">
            <div className="relative group w-full md:w-80">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within:text-blue-500 transition-colors" />
              <input 
                type="text"
                placeholder="Buscar alumno o DNI..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-12 pr-6 py-4 bg-white border-2 border-slate-100 rounded-2xl shadow-sm focus:border-blue-500 focus:ring-4 focus:ring-blue-100 outline-none transition-all font-bold"
              />
            </div>
            
            <button 
              onClick={handleSave}
              disabled={saving}
              className="w-full md:w-auto px-10 py-4 bg-blue-600 text-white font-black rounded-2xl shadow-2xl shadow-blue-600/30 hover:bg-blue-500 hover:-translate-y-0.5 active:translate-y-0 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
            >
              {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
              {saving ? 'GUARDANDO...' : 'GUARDAR CAMBIOS'}
            </button>
          </div>
        </div>

        {/* Message Banner */}
        {message.text && (
          <div className={`mb-8 p-6 rounded-3xl border-2 flex items-center gap-4 animate-fade-in ${
            message.type === 'error' ? 'bg-red-50 border-red-100 text-red-600' : 'bg-emerald-50 border-emerald-100 text-emerald-600'
          }`}>
            {message.type === 'error' ? <AlertCircle className="w-6 h-6" /> : <CheckCircle2 className="w-6 h-6" />}
            <span className="font-black text-sm uppercase tracking-wide">{message.text}</span>
          </div>
        )}

        {/* Table Body */}
        <div className="bg-white rounded-[2.5rem] border-2 border-slate-100 shadow-2xl shadow-slate-200/50 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50/50 border-b-2 border-slate-100">
                  <th className="p-8 text-[11px] font-black uppercase text-slate-400 tracking-[0.2em]">Alumno / Inscripto</th>
                  <th className="p-8 text-[11px] font-black uppercase text-slate-400 tracking-[0.2em] text-center">Nota 1</th>
                  <th className="p-8 text-[11px] font-black uppercase text-slate-400 tracking-[0.2em] text-center">Nota 2</th>
                  <th className="p-8 text-[11px] font-black uppercase text-slate-400 tracking-[0.2em] text-center">Promedio</th>
                  <th className="p-8 text-[11px] font-black uppercase text-slate-400 tracking-[0.2em] text-center bg-blue-50/30">Examen Final</th>
                </tr>
              </thead>
              <tbody className="divide-y-2 divide-slate-50">
                {filteredStudents.length > 0 ? (
                  filteredStudents.map((s) => (
                    <tr key={s.id} className="group hover:bg-slate-50/50 transition-colors">
                      <td className="p-8">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center font-black text-slate-400 text-sm">
                            {s.apellido_estudiante?.[0]}{s.nombre_estudiante?.[0]}
                          </div>
                          <div>
                            <p className="font-black text-slate-800 text-lg uppercase tracking-tight leading-none mb-1">
                              {s.apellido_estudiante}, {s.nombre_estudiante}
                            </p>
                            <p className="text-xs font-bold text-slate-300 tracking-widest uppercase">DNI: {s.dni_estudiante}</p>
                          </div>
                        </div>
                      </td>
                      
                      <td className="p-8 text-center">
                        <input 
                          type="number" 
                          step="0.5"
                          value={matrix[s.id]?.[TIPO_NOTA.PARCIAL_1] || ''}
                          onChange={(e) => handleInputChange(s.id, TIPO_NOTA.PARCIAL_1, e.target.value)}
                          className="w-20 p-4 text-center border-2 border-slate-100 rounded-2xl font-black bg-slate-50 focus:bg-white focus:border-blue-500 transition-all outline-none" 
                          placeholder="-" 
                        />
                      </td>
                      
                      <td className="p-8 text-center">
                        <input 
                          type="number" 
                          step="0.5"
                          value={matrix[s.id]?.[TIPO_NOTA.PARCIAL_2] || ''}
                          onChange={(e) => handleInputChange(s.id, TIPO_NOTA.PARCIAL_2, e.target.value)}
                          className="w-20 p-4 text-center border-2 border-slate-100 rounded-2xl font-black bg-slate-50 focus:bg-white focus:border-blue-500 transition-all outline-none" 
                          placeholder="-" 
                        />
                      </td>
                      
                      <td className="p-8 text-center">
                        <div className="inline-flex items-center gap-2 px-6 py-4 rounded-2xl bg-slate-100/50 font-black text-slate-400 text-xl">
                          <Calculator className="w-4 h-4 opacity-30" />
                          {calculatePromedio(s.id)}
                        </div>
                      </td>
                      
                      <td className="p-8 text-center bg-blue-50/10 group-hover:bg-blue-50/20 transition-colors">
                        <input 
                          type="number" 
                          step="0.5"
                          value={matrix[s.id]?.['final'] || ''}
                          onChange={(e) => handleInputChange(s.id, 'final', e.target.value)}
                          className="w-24 p-4 text-center border-2 border-blue-100 rounded-2xl font-black bg-white text-blue-600 focus:border-blue-500 shadow-sm transition-all outline-none" 
                          placeholder="FINAL" 
                        />
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="p-32 text-center">
                       <div className="flex flex-col items-center opacity-20">
                          <Search className="w-20 h-20 mb-4" />
                          <p className="font-black text-2xl uppercase tracking-[0.3em]">Sin alumnos</p>
                       </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer info */}
        <div className="mt-10 flex flex-col md:flex-row items-center justify-between gap-4 text-slate-400">
           <p className="text-xs font-bold uppercase tracking-widest flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Matriz conectada en tiempo real
           </p>
           <p className="text-xs font-bold uppercase tracking-widest">
              Mostrando {filteredStudents.length} de {inscriptos.length} alumnos registrados
           </p>
        </div>
      </div>
    </div>
  );
}
