-- Add dias_practica to catedras table
ALTER TABLE catedras ADD COLUMN IF NOT EXISTS dias_practica TEXT[] DEFAULT '{}';
