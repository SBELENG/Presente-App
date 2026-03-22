-- Habilitar Realtime para la tabla de asistencias para que funcione el contador del QR
begin;
  -- Remove from publication if it exists to avoid errors on repeat
  drop publication if exists supabase_realtime;
  create publication supabase_realtime;
commit;
alter publication supabase_realtime add table asistencias;
