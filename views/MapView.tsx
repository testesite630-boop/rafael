
import React, { useState, useEffect, Suspense, lazy } from 'react';
import { useNavigate } from 'react-router-dom';
import { Delivery, DeliveryStatus } from '../types';
import { useApp } from '../App';

const RouteMap = lazy(() => import('../components/RouteMap'));

const MapView: React.FC = () => {
  const navigate = useNavigate();
  const { user, settings, setSettings } = useApp();
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [motoboyLocation, setMotoboyLocation] = useState<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    const load = () => {
      const saved = localStorage.getItem('deliveries');
      if (saved) {
        const all = JSON.parse(saved);
        // Exibe TODAS as entregas para visão completa
        setDeliveries(all);
      }
    };
    load();
    const handleStorage = (e: StorageEvent) => { if (e.key === 'deliveries') load(); };
    window.addEventListener('storage', handleStorage);

    let watchId: number;
    if (user?.role === 'MOTOBOY') {
      watchId = navigator.geolocation.watchPosition(
        (pos) => setMotoboyLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        (err) => console.error(err),
        { enableHighAccuracy: true }
      );
    }

    return () => {
      window.removeEventListener('storage', handleStorage);
      if (watchId) navigator.geolocation.clearWatch(watchId);
    };
  }, [user]);

  const handleBack = () => {
    navigate(user?.role === 'ADMIN' ? '/admin' : '/motoboy');
  };

  const toggleTheme = () => {
    setSettings(s => ({ ...s, theme: s.theme === 'light' ? 'dark' : 'light' }));
  };

  return (
    <div className="fixed inset-0 z-50 bg-white dark:bg-gray-950 flex flex-col overflow-hidden">
      {/* HUD Superior */}
      <div className="absolute top-6 left-6 right-6 z-[1000] flex justify-between items-center pointer-events-none">
        <button 
          onClick={handleBack}
          className="pointer-events-auto bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 p-3 rounded-2xl shadow-xl flex items-center space-x-2 text-gray-700 dark:text-gray-200 active:scale-95 transition-all"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" /></svg>
          <span className="text-[10px] font-black uppercase tracking-widest">Sair do Mapa</span>
        </button>

        <div className="flex space-x-2 pointer-events-auto">
          <button 
            onClick={toggleTheme}
            className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 p-3 rounded-2xl shadow-xl text-gray-700 dark:text-gray-200 active:scale-95 transition-all"
          >
             {settings.theme === 'light' ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707M16.95 16.95l.707.707M7.05 7.05l.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
              )}
          </button>
        </div>
      </div>

      {/* Info Flutuante e Legenda */}
      <div className="absolute bottom-6 left-6 z-[1000] pointer-events-none flex flex-col space-y-3">
        <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border border-white/20 p-4 rounded-3xl shadow-2xl">
          <h2 className="text-[10px] font-black uppercase text-red-600 tracking-widest mb-1 italic">RL EXPRESS LOGISTICA</h2>
          <p className="text-xs font-bold dark:text-white">Mostrando {deliveries.length} pontos de entrega</p>
        </div>
        
        <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border border-white/20 p-4 rounded-3xl shadow-2xl flex flex-col space-y-2">
           <div className="flex items-center space-x-2">
              <div className="w-3 h-3 rounded-full bg-red-600 border border-white"></div>
              <span className="text-[9px] font-black dark:text-gray-300 uppercase tracking-tight">Ativas / Pendentes</span>
           </div>
           <div className="flex items-center space-x-2">
              <div className="w-3 h-3 rounded-full bg-green-500 border border-white"></div>
              <span className="text-[9px] font-black dark:text-gray-300 uppercase tracking-tight">Finalizadas</span>
           </div>
           {user?.role === 'MOTOBOY' && (
             <div className="flex items-center space-x-2">
                <div className="w-3 h-3 rounded-full bg-gray-900 border border-white animate-pulse"></div>
                <span className="text-[9px] font-black dark:text-gray-300 uppercase tracking-tight">Sua Posição</span>
             </div>
           )}
        </div>
      </div>

      <div className="flex-1 w-full h-full relative">
        <Suspense fallback={<div className="w-full h-full flex items-center justify-center bg-gray-50 dark:bg-gray-950 font-black text-gray-300">CARREGANDO MAPA...</div>}>
          <RouteMap deliveries={deliveries} motoboyLocation={motoboyLocation} />
        </Suspense>
      </div>
    </div>
  );
};

export default MapView;
