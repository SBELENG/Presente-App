'use client';
import { useEffect } from 'react';

export default function WalkthroughPage() {
  useEffect(() => {
    // Establecer cookies para el bypass de demo usando el ID de la Profesora Presti
    document.cookie = "demo_bypass=true; path=/";
    document.cookie = "demo_user=a56bc6ec-f239-423d-b4be-886ec4ec1780; path=/";
    
    // Redirigir al dashboard
    window.location.href = "/docente/catedras";
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white font-sans">
      <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-6"></div>
      <h1 className="text-2xl font-black tracking-tighter">Preparando recorrido...</h1>
      <p className="text-slate-400 mt-2">Configurando acceso de demostración para la Profesora Presti</p>
    </div>
  );
}
