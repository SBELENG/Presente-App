'use client';
import Link from 'next/link';

export default function Home() {
  return (
    <div style={{ backgroundColor: '#0f172a', color: 'white', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '20px' }}>
      <h1 style={{ fontSize: '3rem', marginBottom: '20px' }}>Presente - Sistema de Asistencia</h1>
      <p style={{ fontSize: '1.5rem', opacity: 0.8, maxWidth: '600px', marginBottom: '40px' }}>El sistema inteligente que automatiza tu aula.</p>
      <div style={{ display: 'flex', gap: '20px' }}>
        <Link href="/login" style={{ backgroundColor: '#3b82f6', color: 'white', padding: '15px 30px', borderRadius: '8px', textDecoration: 'none', fontWeight: 'bold' }}>
          Entrar ahora
        </Link>
      </div>
      <p style={{ marginTop: '50px', fontSize: '0.8rem', opacity: 0.5 }}>Actualizado el 23/03/2026</p>
    </div>
  );
}
