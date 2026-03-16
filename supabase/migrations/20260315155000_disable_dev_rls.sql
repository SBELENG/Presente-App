-- Only for local development purposes so the user is not blocked by auth
-- Disabling RLS temporarily on these tables so that the frontend dev bypass scripts work flawlessly.
ALTER TABLE catedras DISABLE ROW LEVEL SECURITY;
ALTER TABLE inscripciones DISABLE ROW LEVEL SECURITY;
ALTER TABLE clases DISABLE ROW LEVEL SECURITY;
ALTER TABLE asistencias DISABLE ROW LEVEL SECURITY;
ALTER TABLE notas DISABLE ROW LEVEL SECURITY;
