import React, { useState, useEffect, useCallback } from 'react';
import { Delivery } from '../types';
import { optimizeRoute, OptimizationResult } from '../services/geminiService';

interface RouteOptimizerProps {
  deliveries: Delivery[];
  onApply: (orderedIds: string[]) => void;
  onApplyAndNavigate: (orderedIds: string[]) => void;
  onClose: () => void;
}

type Status = 'locating' | 'optimizing' | 'success' | 'error';

const Spinner: React.FC = () => (
  <svg className="animate-spin h-8 w-8 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
  </svg>
);

const RouteOptimizer: React.FC<RouteOptimizerProps> = ({ deliveries, onApply, onApplyAndNavigate, onClose }) => {
  const [status, setStatus] = useState<Status>('locating');
  const [result, setResult] = useState<OptimizationResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const runOptimization = useCallback(() => {
    setStatus('locating');
    setError(null);
    setResult(null);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        setStatus('optimizing');
        const startLocation = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };

        try {
          const apiResult = await optimizeRoute(deliveries, startLocation);
          if (!apiResult.orderedIds || apiResult.orderedIds.length === 0) {
             throw new Error("A IA não retornou uma rota válida. Tente novamente.");
          }
          setResult(apiResult);
          setStatus('success');
        } catch (err) {
          console.error("API Error:", err);
          setError("Falha ao se comunicar com a IA para otimização.");
          setStatus('error');
        }
      },
      (geoError) => {
        let errorMessage = "Não foi possível obter sua localização. ";
        switch (geoError.code) {
          case geoError.PERMISSION_DENIED:
            errorMessage += "Permissão negada.";
            break;
          case geoError.POSITION_UNAVAILABLE:
            errorMessage += "Sinal de GPS indisponível.";
            break;
          case geoError.TIMEOUT:
            errorMessage += "Tempo esgotado para obter localização.";
            break;
        }
        setError(errorMessage);
        setStatus('error');
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  }, [deliveries]);

  useEffect(() => {
    runOptimization();
  }, [runOptimization]);

  const renderContent = () => {
    switch (status) {
      case 'locating':
      case 'optimizing':
        return (
          <>
            <Spinner />
            <h2 className="text-xl font-bold text-white mt-4">{status === 'locating' ? 'Obtendo sua localização...' : 'Calculando a rota mais eficiente...'}</h2>
            <p className="text-white/60 text-sm mt-1">Isso pode levar alguns instantes.</p>
          </>
        );
      case 'success':
        return (
          <>
            <div className="w-16 h-16 rounded-full bg-emerald-500 flex items-center justify-center mb-4 border-4 border-white/20">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
            </div>
            <h2 className="text-2xl font-black text-white">Rota Otimizada!</h2>
            <div className="my-6 w-full text-left bg-white/10 p-4 rounded-xl">
              <div className="flex justify-between items-center border-b border-white/10 pb-3 mb-3">
                <span className="text-sm font-bold text-white/70">Economia de Tempo</span>
                <span className="text-lg font-black text-emerald-400">{result?.estimatedTimeSaved}</span>
              </div>
              <p className="text-xs text-white/70 font-bold mb-1">Recomendação da IA:</p>
              <p className="text-sm text-white italic">"{result?.insights}"</p>
            </div>
            <div className="w-full space-y-2">
              <button onClick={() => onApplyAndNavigate(result!.orderedIds)} className="w-full bg-white text-blue-600 py-3 rounded-lg font-bold text-sm flex items-center justify-center space-x-2 shadow-lg">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
                <span>Aplicar e Abrir no Maps</span>
              </button>
              <button onClick={() => onApply(result!.orderedIds)} className="w-full text-white/60 py-2 rounded-lg font-bold text-xs hover:text-white transition-colors">
                Aplicar somente na lista
              </button>
            </div>
          </>
        );
      case 'error':
        return (
          <>
            <div className="w-16 h-16 rounded-full bg-red-500 flex items-center justify-center mb-4 border-4 border-white/20">
               <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
            </div>
            <h2 className="text-xl font-bold text-white">Falha na Otimização</h2>
            <p className="text-white/60 text-sm mt-2 bg-red-500/30 px-4 py-2 rounded-lg">{error}</p>
             <div className="w-full space-y-2 mt-6">
              <button onClick={runOptimization} className="w-full bg-white text-blue-600 py-3 rounded-lg font-bold text-sm">Tentar Novamente</button>
              <button onClick={onClose} className="w-full bg-transparent text-white/50 py-2 rounded-lg font-bold text-sm">Fechar</button>
            </div>
          </>
        );
    }
  };

  return (
    <div className="absolute inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in" onClick={onClose}>
      <div className="w-full max-w-sm bg-gradient-to-br from-blue-600 to-indigo-700 rounded-3xl p-6 flex flex-col items-center text-center shadow-2xl" onClick={e => e.stopPropagation()}>
        {renderContent()}
      </div>
    </div>
  );
};

export default RouteOptimizer;