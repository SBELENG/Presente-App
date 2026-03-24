'use client';
import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Save, Loader2 } from 'lucide-react';

export default function NotasPage({ params }) {
  const [alumnos, setAlumnos] = useState([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    async function loadData() {
      const { data } = await supabase.from('alumnos_catedra').select('*, alumnos(*)').eq('catedra_id', params.id);
      setAlumnos(data || []);
      setLoading(false);
    }
    loadData();
  }, [params.id]);

  if (loading) return <div className="p-20 text-center text-slate-400">Cargando alumnos...</div>;

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <h1 className="text-3xl font-black mb-2">Matriz de Calificaciones</h1>
      <p className="text-slate-500 mb-8">Gestión masiva de notas estilo Excel.</p>

      <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="p-4 font-bold text-slate-600">Estudiante</th>
              <th className="p-4 font-bold text-slate-600 text-center">Nota 1</th>
              <th className="p-4 font-bold text-slate-600 text-center">Nota 2</th>
              <th className="p-4 font-bold text-slate-600 text-center">Promedio</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {alumnos.map((a) => (
              <tr key={a.id} className="hover:bg-slate-50/50">
                <td className="p-4 font-medium text-slate-700">{a.alumnos?.apellido}, {a.alumnos?.nombre}</td>
                <td className="p-4 text-center"><input type="number" className="w-16 p-2 text-center border rounded-lg" placeholder="-" /></td>
                <td className="p-4 text-center"><input type="number" className="w-16 p-2 text-center border rounded-lg" placeholder="-" /></td>
                <td className="p-4 text-center font-bold text-blue-600">0.0</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <button className="mt-8 px-8 py-3 bg-blue-600 text-white font-bold rounded-2xl shadow-lg hover:bg-blue-700 transition-all flex items-center gap-2">
        <Save className="w-5 h-5" /> Guardar todo el bloque
      </button>
    </div>
  );
}
