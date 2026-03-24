'use client';
import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Save, Download, LayoutGrid, List } from 'lucide-react';
import * as XLSX from 'xlsx';

export default function NotasPage({ params }) {
  const [alumnos, setAlumnos] = useState([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    async function loadData() {
      const { data: catData } = await supabase.from('alumnos_catedra').select('*, alumnos(*)').eq('catedra_id', params.id);
      setAlumnos(catData || []);
      setLoading(false);
    }
    loadData();
  }, [params.id]);

  return (
    <div className="p-8 bg-slate-50 min-h-screen">
      <h1 className="text-3xl font-black text-slate-900 mb-2 tracking-tight">Matriz de Calificaciones</h1>
      <p className="text-slate-500 mb-8 max-w-2xl">Gestioná las notas de todo el curso en una sola tabla, estilo Excel.</p>

      <div className="bg-white rounded-3xl shadow-xl border border-slate-200 p-8 overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b-2 border-slate-100">
              <th className="py-4 px-6 text-sm font-bold text-slate-400 uppercase tracking-wider">Estudiante</th>
              <th className="py-4 px-6 text-sm font-bold text-slate-400 uppercase tracking-wider text-center">Nota 1</th>
              <th className="py-4 px-6 text-sm font-bold text-slate-400 uppercase tracking-wider text-center">Nota 2</th>
              <th className="py-4 px-6 text-sm font-bold text-slate-400 uppercase tracking-wider text-center">Promedio</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {alumnos.map((a) => (
              <tr key={a.id} className="hover:bg-slate-50/50 transition-colors">
                <td className="py-5 px-6 font-semibold text-slate-700">{a.alumnos?.apellido}, {a.alumnos?.nombre}</td>
                <td className="py-5 px-6 text-center"><Input type="number" className="w-20 mx-auto text-center font-bold h-11 border-slate-200 rounded-xl" placeholder="-" /></td>
                <td className="py-5 px-6 text-center"><Input type="number" className="w-20 mx-auto text-center font-bold h-11 border-slate-200 rounded-xl" placeholder="-" /></td>
                <td className="py-5 px-6 text-center font-black text-blue-600">0.0</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-8 flex items-center justify-between">
        <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white rounded-2xl px-10 h-14 font-bold shadow-lg shadow-blue-200 transition-all active:scale-95">
          <Save className="w-5 h-5 mr-3" />
          Guardar cambios en bloque
        </Button>
      </div>
    </div>
  );
}
