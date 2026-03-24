'use client';

import { useState, useEffect, use } from 'react';
import { createClient } from '@/lib/supabase/client';
import { 
  Save, 
  Loader2, 
  ArrowLeft, 
  Search, 
  CheckCircle2, 
  AlertCircle,
  TrendingUp,
  TrendingDown
} from 'lucide-react';
import Link from 'next/link';

export default function NotasPage({ params: paramsPromise }) {
  const params = use(paramsPromise);
  const [alumnos, setAlumnos] = useState([]);
  const [notas, setNotas] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [message, setMessage] = useState({ type: '', text: '' });
  
  const supabase = createClient();

  useEffect(() => {
    async function loadData() {
      try {
        const { data, error } = await supabase
          .from('alumnos_catedra')
          .select('*, alumnos(*)')
          .eq('catedra_id', params.id)
          .order('id');
          
        if (error) throw error;
        
        setAlumnos(data || []);
        
        // Initialize notas state with existing values from DB
        const initialNotas = {};
        data?.forEach(a => {
          initialNotas[a.id] = {
            nota1: a.nota1 || '',
            nota2: a.nota2 || '',
            final: a.final || ''
          };
        });
        setNotas(initialNotas);
      } catch (err) {
        console.error('Error loading notas:', err);
        setMessage({ type: 'error', text: 'Error al cargar los datos.' });
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [params.id]);

  const handleInputChange = (id, field, value) => {
    // Basic validation: 0 to 10
    const num = parseFloat(value);
    if (value !== '' && (num < 0 || num > 10)) return;

    setNotas(prev => ({
      ...prev,
      [id]: {
        ...prev[id],
        [field]: value
      }
    }));
  };

  const calculatePromedio = (n) => {
    const v1 = parseFloat(n.nota1);
    const v2 = parseFloat(n.nota2);
    if (!isNaN(v1) && !isNaN(v2)) {
      return ((v1 + v2) / 2).toFixed(1);
    }
    return '-';
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage({ type: '', text: '' });
    
    try {
      const updates = alumnos.map(a => ({
        id: a.id,
        catedra_id: a.catedra_id,
        alumno_id: a.alumno_id,
        nota1: notas[a.id]?.nota1 === '' ? null : parseFloat(notas[a.id]?.nota1),
        nota2: notas[a.id]?.nota2 === '' ? null : parseFloat(notas[a.id]?.nota2),
        final: notas[a.id]?.final === '' ? null : parseFloat(notas[a.id]?.final),
        updated_at: new Date().toISOString()
      }));

      const { error } = await supabase
        .from('alumnos_catedra')
        .upsert(updates);

      if (error) throw error;
      
      setMessage({ type: 'success', text: 'Calificaciones guardadas correctamente.' });
      setTimeout(() => setMessage({ type: '', text: '' }), 4000);
    } catch (err) {
      console.error('Error saving notas:', err);
      setMessage({ type: 'error', text: 'Error al guardar los cambios.' });
    } finally {
      setSaving(false);
    }
  };

  const filteredAlumnos = alumnos.filter(a => 
    `${a.alumnos?.nombre} ${a.alumnos?.apellido}`.toLowerCase().includes(search.toLowerCase()) ||
    a.alumnos?.dni?.toString().includes(search)
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-slate-500 font-bold">Cargando matriz de notas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-12">
      <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <Link href={`/docente/catedras/${params.id}`} className="inline-flex items-center text-sm font-bold text-slate-400 hover:text-blue-600 transition-colors mb-4">
              <ArrowLeft className="w-4 h-4 mr-2" /> Volver al panel de cátedra
            </Link>
            <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight">
              Matriz de Notas
            </h1>
            <p className="text-slate-500 mt-2 font-medium">
              Gestioná las calificaciones de tus alumnos de forma rápida y segura.
            </p>
          </div>

          <div className="flex items-center gap-4">
            <div className="relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
              <input 
                type="text"
                placeholder="Buscar por nombre o DNI..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-12 pr-6 py-4 bg-white border border-slate-200 rounded-2xl w-full md:w-80 shadow-sm focus:ring-4 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all font-medium"
              />
            </div>
            
            <button 
              onClick={handleSave}
              disabled={saving}
              className="px-8 py-4 bg-blue-600 text-white font-black rounded-2xl shadow-xl shadow-blue-600/20 hover:bg-blue-700 active:scale-95 transition-all flex items-center gap-3 disabled:opacity-50 disabled:scale-100"
            >
              {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
              {saving ? 'Guardando...' : 'Guardar Todo'}
            </button>
          </div>
        </div>

        {/* Floating Feedback Message */}
        {message.text && (
          <div className={`fixed bottom-10 right-10 z-50 px-6 py-4 rounded-2xl shadow-2xl animate-fade-in flex items-center gap-3 font-bold border ${
            message.type === 'error' ? 'bg-red-50 border-red-100 text-red-600' : 'bg-emerald-50 border-emerald-100 text-emerald-600'
          }`}>
            {message.type === 'error' ? <AlertCircle className="w-6 h-6" /> : <CheckCircle2 className="w-6 h-6" />}
            {message.text}
          </div>
        )}

        {/* Table Container */}
        <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-xl overflow-hidden">
          <div className="max-h-[70vh] overflow-y-auto">
            <table className="w-full text-left border-collapse">
              <thead className="sticky top-0 z-10 bg-slate-50/80 backdrop-blur-xl border-b border-slate-100">
                <tr>
                  <th className="p-8 font-black text-slate-400 uppercase text-xs tracking-[0.2em]">Estudiante</th>
                  <th className="p-8 font-black text-slate-400 uppercase text-xs tracking-[0.2em] text-center">Nota 1</th>
                  <th className="p-8 font-black text-slate-400 uppercase text-xs tracking-[0.2em] text-center">Nota 2</th>
                  <th className="p-8 font-black text-slate-400 uppercase text-xs tracking-[0.2em] text-center">Promedio</th>
                  <th className="p-8 font-black text-slate-400 uppercase text-xs tracking-[0.2em] text-center">Examen Final</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredAlumnos.length > 0 ? (
                  filteredAlumnos.map((a) => {
                    const promedio = calculatePromedio(notas[a.id] || {});
                    const isPassing = parseFloat(promedio) >= 4;
                    
                    return (
                      <tr key={a.id} className="group hover:bg-blue-50/30 transition-all duration-200">
                        <td className="p-8">
                          <div className="flex flex-col">
                            <span className="font-black text-slate-800 text-lg uppercase tracking-tight">
                              {a.alumnos?.apellido}, {a.alumnos?.nombre}
                            </span>
                            <span className="text-sm font-bold text-slate-400">DNI: {a.alumnos?.dni}</span>
                          </div>
                        </td>
                        
                        <td className="p-8 text-center">
                          <input 
                            type="number" 
                            step="0.1"
                            min="0"
                            max="10"
                            value={notas[a.id]?.nota1}
                            onChange={(e) => handleInputChange(a.id, 'nota1', e.target.value)}
                            className="w-20 p-4 text-center border-2 border-slate-100 rounded-2xl font-black bg-slate-50 group-hover:bg-white text-slate-900 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 outline-none transition-all transition-colors" 
                            placeholder="-" 
                          />
                        </td>
                        
                        <td className="p-8 text-center">
                          <input 
                            type="number" 
                            step="0.1"
                            min="0"
                            max="10"
                            value={notas[a.id]?.nota2}
                            onChange={(e) => handleInputChange(a.id, 'nota2', e.target.value)}
                            className="w-20 p-4 text-center border-2 border-slate-100 rounded-2xl font-black bg-slate-50 group-hover:bg-white text-slate-900 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 outline-none transition-all transition-colors" 
                            placeholder="-" 
                          />
                        </td>
                        
                        <td className="p-8 text-center">
                          <div className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl font-black text-lg ${
                            promedio === '-' ? 'text-slate-300' : 
                            isPassing ? 'bg-emerald-500/10 text-emerald-600' : 'bg-red-500/10 text-red-600'
                          }`}>
                            {promedio !== '-' && (isPassing ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />)}
                            {promedio}
                          </div>
                        </td>
                        
                        <td className="p-8 text-center">
                          <input 
                            type="number" 
                            step="0.1"
                            min="0"
                            max="10"
                            value={notas[a.id]?.final}
                            onChange={(e) => handleInputChange(a.id, 'final', e.target.value)}
                            className="w-20 p-4 text-center border-2 border-indigo-100 rounded-2xl font-black bg-indigo-50/50 group-hover:bg-white text-indigo-700 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 outline-none transition-all transition-colors shadow-inner" 
                            placeholder="-" 
                          />
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="5" className="p-20 text-center text-slate-400 font-bold">
                      No se encontraron alumnos para esta cátedra.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Summary Footer */}
        <div className="mt-8 flex justify-center">
          <p className="text-slate-400 text-sm font-bold flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            Las notas se guardan automáticamente en la nube al presionar "Guardar Todo".
          </p>
        </div>
      </div>
    </div>
  );
}
