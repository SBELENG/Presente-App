-- Añadir un UNIQUE constraint en la tabla notas para permitir UPSERT
ALTER TABLE notas DROP CONSTRAINT IF EXISTS notas_inscripcion_catedra_tipo_unique;
ALTER TABLE notas ADD CONSTRAINT notas_inscripcion_catedra_tipo_unique UNIQUE (inscripcion_id, catedra_id, tipo);
