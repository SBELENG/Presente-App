-- =====================================================
-- Presente App - Database Schema
-- Execute this in Supabase SQL Editor
-- =====================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- 1. PERFILES (extends Supabase auth.users)
-- =====================================================
CREATE TABLE IF NOT EXISTS perfiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nombre TEXT NOT NULL DEFAULT '',
  apellido TEXT NOT NULL DEFAULT '',
  dni TEXT UNIQUE,
  rol TEXT NOT NULL DEFAULT 'docente' CHECK (rol IN ('docente', 'estudiante', 'admin')),
  institucion TEXT,
  carrera TEXT,
  facultad TEXT,
  foto_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.perfiles (id, nombre, rol)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'nombre', ''), 'docente');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =====================================================
-- 2. CATEDRAS
-- =====================================================
CREATE TABLE IF NOT EXISTS catedras (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nombre TEXT NOT NULL,
  codigo TEXT,
  carrera TEXT,
  facultad TEXT,
  institucion TEXT DEFAULT 'UNRC',
  anio INT,
  cuatrimestre INT,
  comision TEXT,
  tipo_clase TEXT DEFAULT 'teorico_practica' CHECK (tipo_clase IN ('teorica', 'practica', 'teorico_practica')),
  fecha_inicio DATE,
  fecha_fin DATE,
  dias_clase TEXT[] DEFAULT '{}',
  es_promocional BOOLEAN DEFAULT FALSE,
  nota_promocion_minima NUMERIC(3,1) DEFAULT 6,
  nota_promocion_promedio NUMERIC(3,1) DEFAULT 7,
  nota_regularizacion NUMERIC(3,1) DEFAULT 5,
  porcentaje_asistencia INT DEFAULT 80,
  cant_parciales INT DEFAULT 2,
  cant_recuperatorios INT DEFAULT 1,
  tiene_tp_evaluable BOOLEAN DEFAULT FALSE,
  cant_tps INT DEFAULT 0,
  cant_tps_separados INT DEFAULT 0,
  cant_tps_con_parciales INT DEFAULT 0,
  tipo_promocion TEXT DEFAULT 'directa' CHECK (tipo_promocion IN ('directa', 'coloquio')),
  criterio_promocion TEXT DEFAULT 'nota_minima' CHECK (criterio_promocion IN ('nota_minima', 'promedio', 'ambos')),
  permite_recuperatorio_promocion BOOLEAN DEFAULT FALSE,
  metodo_tp TEXT[] DEFAULT '{"separado"}',
  split_asistencia BOOLEAN DEFAULT FALSE,
  asistencia_teoria NUMERIC(4,2) DEFAULT 70,
  asistencia_practica NUMERIC(4,2) DEFAULT 80,
  comisiones_division JSONB DEFAULT '[]'::jsonb,
  agenda_rota_practicas BOOLEAN DEFAULT FALSE,
  qr_code TEXT,
  docente_id UUID NOT NULL REFERENCES perfiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 3. INSCRIPCIONES
-- =====================================================
CREATE TABLE IF NOT EXISTS inscripciones (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  catedra_id UUID NOT NULL REFERENCES catedras(id) ON DELETE CASCADE,
  estudiante_id UUID REFERENCES perfiles(id) ON DELETE SET NULL,
  nombre_estudiante TEXT,
  apellido_estudiante TEXT,
  dni_estudiante TEXT NOT NULL,
  estado TEXT DEFAULT 'inscripto' CHECK (estado IN ('inscripto', 'pendiente')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(catedra_id, dni_estudiante)
);

-- =====================================================
-- 4. CLASES
-- =====================================================
CREATE TABLE IF NOT EXISTS clases (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  catedra_id UUID NOT NULL REFERENCES catedras(id) ON DELETE CASCADE,
  fecha DATE NOT NULL,
  tipo TEXT DEFAULT 'teorica' CHECK (tipo IN ('teorica', 'practica', 'teorico_practica')),
  tema TEXT,
  estado_clase TEXT DEFAULT 'normal' CHECK (estado_clase IN ('normal', 'feriado', 'asueto', 'paro', 'suspension')),
  numero_clase INT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 5. ASISTENCIAS
-- =====================================================
CREATE TABLE IF NOT EXISTS asistencias (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  clase_id UUID NOT NULL REFERENCES clases(id) ON DELETE CASCADE,
  inscripcion_id UUID NOT NULL REFERENCES inscripciones(id) ON DELETE CASCADE,
  estado TEXT DEFAULT 'ausente' CHECK (estado IN ('presente', 'ausente', 'pendiente', 'pendiente_inscripcion')),
  hora_registro TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(clase_id, inscripcion_id)
);

-- =====================================================
-- 6. NOTAS
-- =====================================================
CREATE TABLE IF NOT EXISTS notas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  inscripcion_id UUID NOT NULL REFERENCES inscripciones(id) ON DELETE CASCADE,
  catedra_id UUID NOT NULL REFERENCES catedras(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL CHECK (tipo IN ('parcial_1', 'parcial_2', 'recuperatorio', 'tp')),
  valor NUMERIC(4,2),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 7. ROW LEVEL SECURITY
-- =====================================================
ALTER TABLE perfiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE catedras ENABLE ROW LEVEL SECURITY;
ALTER TABLE inscripciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE clases ENABLE ROW LEVEL SECURITY;
ALTER TABLE asistencias ENABLE ROW LEVEL SECURITY;
ALTER TABLE notas ENABLE ROW LEVEL SECURITY;

-- Perfiles: users can read/update their own profile
CREATE POLICY "Users can view own profile" ON perfiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON perfiles FOR UPDATE USING (auth.uid() = id);

-- Cátedras: docentes can CRUD their own
CREATE POLICY "Docentes can view own catedras" ON catedras FOR SELECT USING (docente_id = auth.uid());
CREATE POLICY "Docentes can insert catedras" ON catedras FOR INSERT WITH CHECK (docente_id = auth.uid());
CREATE POLICY "Docentes can update own catedras" ON catedras FOR UPDATE USING (docente_id = auth.uid());
CREATE POLICY "Docentes can delete own catedras" ON catedras FOR DELETE USING (docente_id = auth.uid());

-- Inscripciones: docentes can manage for their cátedras
CREATE POLICY "Docentes can view inscripciones" ON inscripciones FOR SELECT USING (
  catedra_id IN (SELECT id FROM catedras WHERE docente_id = auth.uid())
);
CREATE POLICY "Docentes can insert inscripciones" ON inscripciones FOR INSERT WITH CHECK (
  catedra_id IN (SELECT id FROM catedras WHERE docente_id = auth.uid())
);
CREATE POLICY "Docentes can update inscripciones" ON inscripciones FOR UPDATE USING (
  catedra_id IN (SELECT id FROM catedras WHERE docente_id = auth.uid())
);

-- Clases: docentes can manage for their cátedras
CREATE POLICY "Docentes can view clases" ON clases FOR SELECT USING (
  catedra_id IN (SELECT id FROM catedras WHERE docente_id = auth.uid())
);
CREATE POLICY "Docentes can insert clases" ON clases FOR INSERT WITH CHECK (
  catedra_id IN (SELECT id FROM catedras WHERE docente_id = auth.uid())
);
CREATE POLICY "Docentes can update clases" ON clases FOR UPDATE USING (
  catedra_id IN (SELECT id FROM catedras WHERE docente_id = auth.uid())
);

-- Asistencias: docentes can view for their cátedras, public insert for QR scanning
CREATE POLICY "Docentes can view asistencias" ON asistencias FOR SELECT USING (
  clase_id IN (SELECT c.id FROM clases c JOIN catedras cat ON c.catedra_id = cat.id WHERE cat.docente_id = auth.uid())
);
CREATE POLICY "Anyone can insert asistencia" ON asistencias FOR INSERT WITH CHECK (true);

-- Notas: docentes can manage for their cátedras
CREATE POLICY "Docentes can view notas" ON notas FOR SELECT USING (
  catedra_id IN (SELECT id FROM catedras WHERE docente_id = auth.uid())
);
CREATE POLICY "Docentes can insert notas" ON notas FOR INSERT WITH CHECK (
  catedra_id IN (SELECT id FROM catedras WHERE docente_id = auth.uid())
);
CREATE POLICY "Docentes can update notas" ON notas FOR UPDATE USING (
  catedra_id IN (SELECT id FROM catedras WHERE docente_id = auth.uid())
);

-- =====================================================
-- 8. INDEXES
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_catedras_docente ON catedras(docente_id);
CREATE INDEX IF NOT EXISTS idx_inscripciones_catedra ON inscripciones(catedra_id);
CREATE INDEX IF NOT EXISTS idx_inscripciones_dni ON inscripciones(dni_estudiante);
CREATE INDEX IF NOT EXISTS idx_clases_catedra ON clases(catedra_id);
CREATE INDEX IF NOT EXISTS idx_asistencias_clase ON asistencias(clase_id);
CREATE INDEX IF NOT EXISTS idx_asistencias_inscripcion ON asistencias(inscripcion_id);
CREATE INDEX IF NOT EXISTS idx_notas_inscripcion ON notas(inscripcion_id);
CREATE INDEX IF NOT EXISTS idx_notas_catedra ON notas(catedra_id);
