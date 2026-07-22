-- =====================================================
-- MIGRACIÓN CRÍTICA DE SEGURIDAD: Re-habilitar RLS
-- Fecha: 2026-05-13
-- Problema: La migración 20260315155000_disable_dev_rls.sql
-- deshabilitó RLS en producción por error, dejando todas
-- las tablas públicamente accesibles.
--
-- Esta migración:
-- 1. Re-habilita RLS en las 5 tablas afectadas
-- 2. Agrega políticas de lectura anónima para los flujos
--    de estudiantes (QR + portal alumno) que NO requieren login
-- 3. Agrega políticas de escritura anónima para el registro
--    de asistencia vía QR
-- =====================================================

-- ─── 1. RE-HABILITAR RLS ────────────────────────────────────────────────────

ALTER TABLE catedras ENABLE ROW LEVEL SECURITY;
ALTER TABLE inscripciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE clases ENABLE ROW LEVEL SECURITY;
ALTER TABLE asistencias ENABLE ROW LEVEL SECURITY;
ALTER TABLE notas ENABLE ROW LEVEL SECURITY;

-- ─── 2. POLÍTICAS DE LECTURA ANÓNIMA (para flujos de estudiantes) ────────────
-- El portal del alumno (/alumno/[dni]) y la página QR (/asistencia/[claseId])
-- usan el cliente anon (sin login) para consultar datos.
-- Estas políticas permiten SELECT público pero NO escritura arbitraria.

-- Cátedras: lectura pública (necesario para mostrar nombre de cátedra en QR y portal alumno)
DROP POLICY IF EXISTS "Public can view catedras" ON catedras;
CREATE POLICY "Public can view catedras" ON catedras
  FOR SELECT USING (true);

-- Inscripciones: lectura pública (portal alumno busca por DNI; QR verifica inscripción)
DROP POLICY IF EXISTS "Public can view inscripciones" ON inscripciones;
CREATE POLICY "Public can view inscripciones" ON inscripciones
  FOR SELECT USING (true);

-- Clases: lectura pública (QR necesita leer la clase para verificar fecha; portal alumno muestra historial)
DROP POLICY IF EXISTS "Public can view clases" ON clases;
CREATE POLICY "Public can view clases" ON clases
  FOR SELECT USING (true);

-- Asistencias: lectura pública (portal alumno muestra historial de asistencia del estudiante)
DROP POLICY IF EXISTS "Public can view asistencias" ON asistencias;
CREATE POLICY "Public can view asistencias" ON asistencias
  FOR SELECT USING (true);

-- Notas: lectura pública (portal alumno muestra notas del estudiante)
DROP POLICY IF EXISTS "Public can view notas" ON notas;
CREATE POLICY "Public can view notas" ON notas
  FOR SELECT USING (true);

-- ─── 3. POLÍTICAS DE ESCRITURA ANÓNIMA (solo para flujo QR) ─────────────────
-- El registro de asistencia vía QR permite:
-- a) Insertar asistencias (ya existía "Anyone can insert asistencia")
-- b) Insertar/upsert inscripciones pendientes para alumnos no inscriptos

-- Inscripciones: permitir que el flujo QR cree inscripciones pendientes
-- (alumnos que escanean QR pero no están en el listado oficial)
DROP POLICY IF EXISTS "Anyone can insert inscripcion" ON inscripciones;
CREATE POLICY "Anyone can insert inscripcion" ON inscripciones
  FOR INSERT WITH CHECK (true);

-- Inscripciones: permitir update para que el upsert funcione en el flujo QR
DROP POLICY IF EXISTS "Anyone can update inscripcion for upsert" ON inscripciones;
CREATE POLICY "Anyone can update inscripcion for upsert" ON inscripciones
  FOR UPDATE USING (true);

-- Asistencias: la política "Anyone can insert asistencia" ya existe en el schema base.
-- La re-creamos por seguridad en caso de que no se haya aplicado.
DROP POLICY IF EXISTS "Anyone can insert asistencia" ON asistencias;
CREATE POLICY "Anyone can insert asistencia" ON asistencias
  FOR INSERT WITH CHECK (true);

-- ─── 4. POLÍTICAS DE UPDATE/DELETE PARA DOCENTES ────────────────────────────
-- Estas operaciones requieren autenticación. Las políticas del schema base
-- ya cubren la mayoría, pero agregamos las que faltan:

-- Asistencias: docentes pueden actualizar (upsert manual de asistencia)
DROP POLICY IF EXISTS "Docentes can update asistencias" ON asistencias;
CREATE POLICY "Docentes can update asistencias" ON asistencias
  FOR UPDATE USING (
    clase_id IN (
      SELECT c.id FROM clases c
      JOIN catedras cat ON c.catedra_id = cat.id
      WHERE cat.docente_id = auth.uid()
    )
  );

-- Inscripciones: docentes pueden eliminar inscripciones de sus cátedras
DROP POLICY IF EXISTS "Docentes can delete inscripciones" ON inscripciones;
CREATE POLICY "Docentes can delete inscripciones" ON inscripciones
  FOR DELETE USING (
    catedra_id IN (SELECT id FROM catedras WHERE docente_id = auth.uid())
  );

-- Clases: docentes pueden eliminar clases de sus cátedras
DROP POLICY IF EXISTS "Docentes can delete clases" ON clases;
CREATE POLICY "Docentes can delete clases" ON clases
  FOR DELETE USING (
    catedra_id IN (SELECT id FROM catedras WHERE docente_id = auth.uid())
  );

-- Notas: docentes pueden eliminar notas de sus cátedras
DROP POLICY IF EXISTS "Docentes can delete notas" ON notas;
CREATE POLICY "Docentes can delete notas" ON notas
  FOR DELETE USING (
    catedra_id IN (SELECT id FROM catedras WHERE docente_id = auth.uid())
  );
