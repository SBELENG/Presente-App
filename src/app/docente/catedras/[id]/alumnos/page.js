'use client'

import { useState, useEffect, use } from 'react'
import { createClient } from '@/lib/supabase/client'
import { 
  Plus, 
  Upload, 
  Trash2, 
  Search, 
  Download, 
  ArrowLeft,
  FileText,
  CheckCircle2,
  AlertCircle,
  Loader2
} from 'lucide-react'
import Link from 'next/link'
import Papa from 'papaparse'
import * as XLSX from 'xlsx'

export default function AlumnosPage({ params }) {
  const unwrappedParams = use(params)
  const id = unwrappedParams.id
  const [catedra, setCatedra] = useState(null)
  const [alumnos, setAlumnos] = useState([])
  const [loading, setLoading] = useState(true)
  const [importing, setImporting] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [message, setMessage] = useState(null)

  const supabase = createClient()

  useEffect(() => {
    fetchData()
  }, [id])

  const fetchData = async () => {
    setLoading(true)
    const { data: cat } = await supabase
      .from('catedras')
      .select('*')
      .eq('id', id)
      .single()
    setCatedra(cat)

    const { data: insc } = await supabase
      .from('inscripciones')
      .select('*')
      .eq('catedra_id', id)
      .order('apellido_estudiante', { ascending: true })
    
    setAlumnos(insc || [])
    setLoading(false)
  }

  const handleFileUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    setImporting(true)
    setMessage(null)

    const fileName = file.name.toLowerCase()
    
    if (fileName.endsWith('.csv')) {
      Papa.parse(file, {
        header: true,
        complete: (results) => processImport(results.data),
        error: () => {
          setMessage({ type: 'error', text: 'Error al leer el archivo CSV.' })
          setImporting(false)
        }
      })
    } else if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
      const reader = new FileReader()
      reader.onload = (evt) => {
        const bstr = evt.target.result
        const wb = XLSX.read(bstr, { type: 'binary' })
        const wsname = wb.SheetNames[0]
        const ws = wb.Sheets[wsname]
        const data = XLSX.utils.sheet_to_json(ws)
        processImport(data)
      }
      reader.readAsBinaryString(file)
    } else {
      setMessage({ type: 'error', text: 'Formato no soportado. Usá .csv o .xlsx' })
      setImporting(false)
    }
  }

  const processImport = async (data) => {
    // Expected headers: Apellido, Nombre, DNI (flexible case)
    const normalizedData = data.map(row => {
      const keys = Object.keys(row)
      const findKey = (candidates) => keys.find(k => candidates.includes(k.toLowerCase()))
      
      const colAlumno = findKey(['alumno', 'estudiante', 'nombre completo'])
      const colApellido = findKey(['apellido', 'apellidos'])
      const colNombre = findKey(['nombre', 'nombres'])
      const colDni = findKey(['dni', 'documento', 'doc'])
      const colEmail = findKey(['email', 'e-mail', 'correo'])

      let apellido = row[colApellido] || ''
      let nombre = row[colNombre] || ''
      
      // Si el nombre viene todo junto en la columna "Alumno"
      if (colAlumno && (!apellido || !nombre)) {
        const full = String(row[colAlumno]).trim()
        const parts = full.split(' ')
        if (parts.length >= 2) {
          apellido = parts[0] // Tomamos el primero como apellido
          nombre = parts.slice(1).join(' ') // El resto como nombre
        } else {
          apellido = full
        }
      }

      // Limpiamos el DNI de cualquier letra (DNI-47... -> 47...)
      const dni = String(row[colDni] || '').replace(/\D/g, '')

      return {
        catedra_id: id,
        apellido_estudiante: apellido,
        nombre_estudiante: nombre,
        dni_estudiante: dni,
        email_estudiante: row[colEmail] || '',
        estado: 'inscripto'
      }
    }).filter(r => r.dni_estudiante)

    if (normalizedData.length === 0) {
      setMessage({ type: 'error', text: 'No se encontraron datos válidos. Verificá las columnas (Apellido, Nombre, DNI).' })
      setImporting(false)
      return
    }

    const { error } = await supabase
      .from('inscripciones')
      .upsert(normalizedData, { onConflict: 'catedra_id, dni_estudiante' })

    if (error) {
      setMessage({ type: 'error', text: 'Error al importar en la base de datos.' })
    } else {
      // THE MAGIC: Automatic resolution of pending attendance
      await resolvePendingAttendances(normalizedData.map(d => d.dni_estudiante))
      
      setMessage({ type: 'success', text: `¡Se importaron ${normalizedData.length} alumnos con éxito!` })
      fetchData()
    }
    setImporting(false)
  }

  const resolvePendingAttendances = async (dnis) => {
    // 1. Get IDs of the freshly imported inscripciones
    const { data: freshInsc } = await supabase
      .from('inscripciones')
      .select('id, dni_estudiante')
      .eq('catedra_id', id)
      .in('dni_estudiante', dnis)

    if (!freshInsc) return

    for (const insc of freshInsc) {
      // 2. Update all 'pendiente_inscripcion' for this student to 'presente'
      await supabase
        .from('asistencias')
        .update({ estado: 'presente' })
        .eq('inscripcion_id', insc.id)
        .eq('estado', 'pendiente_inscripcion')
    }
  }

  const handleDelete = async (inscId) => {
    if (!confirm('¿Seguro quieres eliminar a este alumno?')) return
    const { error } = await supabase.from('inscripciones').delete().eq('id', inscId)
    if (!error) fetchData()
  }

  const filteredAlumnos = alumnos.filter(a => 
    `${a.nombre_estudiante} ${a.apellido_estudiante} ${a.dni_estudiante}`
      .toLowerCase()
      .includes(searchTerm.toLowerCase())
  )

  if (loading) return <div className="p-12 text-center"><Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" /></div>

  return (
    <div className="max-w-6xl mx-auto animate-fade-in pb-20">
      {/* Header */}
      <div className="mb-8">
        <Link
          href={`/docente/catedras/${id}`}
          className="inline-flex items-center gap-2 text-sm text-muted hover:text-foreground transition-colors mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver a la cátedra
        </Link>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Listado de Alumnos</h1>
            <p className="text-muted text-sm mt-1">
              {catedra?.nombre} · {alumnos.length} inscriptos
            </p>
          </div>
          <div className="flex items-center gap-3">
            <label className={`cursor-pointer flex items-center gap-2 px-5 py-2.5 bg-surface border border-border rounded-xl text-sm font-semibold hover:border-primary/50 transition-all ${importing ? 'opacity-50 pointer-events-none' : ''}`}>
              <Upload className="w-4 h-4 text-primary" />
              Importar CSV/Excel
              <input type="file" accept=".csv,.xlsx,.xls" className="hidden" onChange={handleFileUpload} />
            </label>
            <button className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white text-sm font-semibold rounded-xl hover:shadow-lg transition-all">
              <Plus className="w-4 h-4" />
              Agregar Manual
            </button>
          </div>
        </div>
      </div>

      {message && (
        <div className={`mb-6 p-4 rounded-2xl border flex items-center gap-3 animate-fade-in ${
          message.type === 'success' ? 'bg-success/10 border-success/20 text-success' : 'bg-danger/10 border-danger/20 text-danger'
        }`}>
          {message.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
          <p className="text-sm font-medium">{message.text}</p>
        </div>
      )}

      {/* List Card */}
      <div className="bg-surface border border-border rounded-3xl overflow-hidden shadow-sm">
        <div className="p-4 border-b border-border bg-surface/50">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted" />
            <input
              type="text"
              placeholder="Buscar por nombre, apellido o DNI..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-background border border-border rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-surface-hover text-muted text-xs uppercase tracking-widest">
                <th className="px-6 py-4 font-bold">Alumno</th>
                <th className="px-6 py-4 font-bold">DNI</th>
                <th className="px-6 py-4 font-bold">Estado</th>
                <th className="px-6 py-4 font-bold text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredAlumnos.length === 0 ? (
                <tr>
                  <td colSpan="4" className="px-6 py-20 text-center text-muted">
                    No se encontraron alumnos.
                  </td>
                </tr>
              ) : (
                filteredAlumnos.map((a) => (
                  <tr key={a.id} className="hover:bg-surface-hover/50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm uppercase">
                          {a.apellido_estudiante?.[0] || '?'}{a.nombre_estudiante?.[0] || ''}
                        </div>
                        <div>
                          <p className="font-bold text-foreground">
                            {a.apellido_estudiante}, {a.nombre_estudiante}
                          </p>
                          <p className="text-xs text-muted">Inscripto {new Date(a.created_at).toLocaleDateString()}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm font-mono text-foreground font-medium">
                      {a.dni_estudiante}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${
                        a.estado === 'inscripto' ? 'bg-success/10 text-success' : 'bg-warning/10 text-warning'
                      }`}>
                        <div className={`w-1.5 h-1.5 rounded-full ${a.estado === 'inscripto' ? 'bg-success' : 'bg-warning'}`} />
                        {a.estado === 'inscripto' ? 'Inscripto' : 'Pendiente'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button className="p-2 text-muted hover:text-primary transition-colors">
                          <FileText className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleDelete(a.id)}
                          className="p-2 text-muted hover:text-danger transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-8 flex items-center justify-between text-sm text-muted">
        <p>Mostrando {filteredAlumnos.length} de {alumnos.length} alumnos</p>
        <button className="flex items-center gap-2 hover:text-foreground transition-colors">
          <Download className="w-4 h-4" />
          Descargar listado actual
        </button>
      </div>
    </div>
  )
}
