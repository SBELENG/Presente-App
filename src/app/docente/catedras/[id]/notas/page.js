'use client';
import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Save, Loader2, ArrowLeft, Download } from 'lucide-react';
import Link from 'next/link';

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
    <div className="p-8 max-w-6xl mx-auto bg-slate-50 min-h-screen">
      <Link href={`/docente/catedras/${params.id}`} className="inline-flex items-center text-sm text-slate-500 hover:text-blue-600 mb-6 font-bold">
        <ArrowLeft className="w-4 h-4 mr-2" /> Volver a la cátedra
      </Link>

      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">Matriz de Notas</h1>
          <p className="text-slate-500">Carga masiva de calificaciones en tiempo real.</p>
        </div>
      </div>

      <div className="bg-white rounded-[2rem] border border-slate-200 shadow-2xl shadow-blue-900/5 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-50/50 border-b border-slate-100">
            <tr>
              <th className="p-6 font-black text-slate-400 uppercase text-xs tracking-widest">Estudiante</th>
              <th className="p-6 font-black text-slate-400 uppercase text-xs tracking-widest text-center">Nota 1</th>
              <th className="p-6 font-black text-slate-400 uppercase text-xs tracking-widest text-center">Nota 2</th>
              <th className="p-6 font-black text-slate-400 uppercase text-xs tracking-widest text-center">Final</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {alumnos.map((a) => (
              <tr key={a.id} className="hover:bg-blue-50/30 transition-colors">
                <td className="p-6 font-bold text-slate-700">{a.alumnos?.apellido?.toUpperCase()}, {a.alumnos?.nombre}</td>
                <td className="p-6 text-center"><input type="number" className="w-20 p-3 text-center border-2 border-slate-100 rounded-2xl font-black focus:border-blue-500 focus:outline-none" placeholder="-" /></td>
                <td className="p-6 text-center"><input type="number" className="w-20 p-3 text-center border-2 border-slate-100 rounded-2xl font-black focus:border-blue-500 focus:outline-none" placeholder="-" /></td>
                <td className="p-6 text-center font-black text-blue-600 text-lg">0.0</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-8">
        <button className="px-10 py-5 bg-blue-600 text-white font-black rounded-3xl shadow-xl shadow-blue-600/20 hover:scale-105 transition-all flex items-center gap-3">
          <Save className="w-6 h-6" /> Guardar Calificaciones
        </button>
      </div>
    </div>
  );
}
