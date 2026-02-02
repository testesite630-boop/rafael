
import React, { memo } from 'react';
import { Delivery, DeliveryStatus } from '../types';

interface InRouteDeliveryItemProps {
  delivery: Delivery;
  index: number;
  currentIndex: number;
  setCurrentIndex: (index: number) => void;
  setViewMode: (mode: 'current' | 'all' | 'history') => void;
  onOpenPickupModal: (index: number) => void;
  onOpenFinalizeModal: (index: number) => void;
  onOpenFailureModal: (index: number) => void;
  onShowDetails?: () => void;
}

const InRouteDeliveryItem: React.FC<InRouteDeliveryItemProps> = memo(({
  delivery,
  index,
  currentIndex,
  setCurrentIndex,
  setViewMode,
  onOpenPickupModal,
  onOpenFinalizeModal,
  onOpenFailureModal,
  onShowDetails
}) => {
  const isPickedUp = delivery.status === DeliveryStatus.PICKED_UP;

  const openInMaps = (e: React.MouseEvent, addr?: string) => {
    e.stopPropagation();
    if (!addr) return;
    window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(addr)}`, '_blank');
  };

  return (
    <div className={`w-full bg-white dark:bg-gray-800 p-3 rounded-2xl flex items-center space-x-3 border transition-all text-left group ${currentIndex === index ? 'border-red-600 ring-1 ring-red-100 dark:ring-red-900/20 shadow-md' : 'border-gray-100 dark:border-gray-700'}`}>
      {/* Lado Esquerdo: Navegação para Modo Foco */}
      <div
        className="flex-1 flex items-center space-x-3 min-w-0"
      >
        <div 
          onClick={() => { setCurrentIndex(index); setViewMode('current'); }}
          className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-[10px] shrink-0 transition-colors cursor-pointer ${currentIndex === index ? 'bg-red-600 text-white' : 'bg-red-50 dark:bg-red-900/30 text-red-600'}`}
        >
          {index + 1}
        </div>
        
        <div className="flex-1 min-w-0 cursor-pointer" onClick={() => { setCurrentIndex(index); setViewMode('current'); }}>
          <div className="flex items-center justify-between group/row">
            <div className="flex items-center space-x-2 mb-0.5 overflow-hidden">
               <div className={`w-1 h-1 rounded-full ${isPickedUp ? 'bg-gray-300' : 'bg-blue-500 animate-pulse'}`}></div>
               <span className="text-[7px] font-black text-gray-400 uppercase tracking-widest">Coleta:</span>
               <span className={`text-[8px] font-bold truncate uppercase ${isPickedUp ? 'text-gray-400 line-through' : 'text-gray-500 dark:text-gray-400'}`}>
                 {delivery.pickupAddress || 'Não informado'}
               </span>
            </div>
            {!isPickedUp && delivery.pickupAddress && (
              <button onClick={(e) => openInMaps(e, delivery.pickupAddress)} className="ml-1 text-blue-500 opacity-0 group-hover/row:opacity-100 transition-opacity">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /></svg>
              </button>
            )}
          </div>
          <div className="flex items-center justify-between group/row">
            <div className="flex items-center space-x-2 overflow-hidden">
               <div className={`w-1 h-1 rounded-full ${isPickedUp ? 'bg-red-600' : 'bg-gray-300'}`}></div>
               <span className="text-[7px] font-black text-gray-400 uppercase tracking-widest">Entrega:</span>
               <p className="text-[10px] font-black dark:text-white truncate uppercase tracking-tight flex-1">{delivery.address}</p>
            </div>
            <button onClick={(e) => openInMaps(e, delivery.address)} className="ml-1 text-red-500 opacity-0 group-hover/row:opacity-100 transition-opacity">
               <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /></svg>
            </button>
          </div>
        </div>
      </div>

      {/* Lado Direito: Ação Contextual (Coletar, Falhar ou Finalizar) */}
      <div className="flex items-center space-x-2 shrink-0">
        <button 
          onClick={(e) => { e.stopPropagation(); onShowDetails?.(); }}
          className="p-2 text-gray-300 hover:text-red-600 transition-colors"
          title="Ver Mais Detalhes"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
        </button>
        <div className="w-px h-8 bg-gray-100 dark:bg-gray-700 mx-1"></div>
        {delivery.status === DeliveryStatus.IN_ROUTE ? (
          <>
            <button
              onClick={(e) => { e.stopPropagation(); onOpenFailureModal(index); }}
              className="px-3 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-red-600 dark:text-red-400 rounded-xl flex flex-col items-center justify-center active:scale-90 transition-all shadow-sm dark:shadow-none min-w-[60px]"
              title="Registrar Falha na Coleta"
            >
              <span className="text-[8px] font-black uppercase tracking-tighter">Falha</span>
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onOpenPickupModal(index); }}
              className="w-10 h-10 bg-amber-500 hover:bg-amber-600 text-white rounded-xl flex items-center justify-center active:scale-90 transition-all shadow-lg shadow-amber-100 dark:shadow-none"
              title="Registrar Coleta"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
            </button>
          </>
        ) : (
          <>
            <button
              onClick={(e) => { e.stopPropagation(); onOpenFailureModal(index); }}
              className="px-3 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-red-600 dark:text-red-400 rounded-xl flex flex-col items-center justify-center active:scale-90 transition-all shadow-sm dark:shadow-none min-w-[60px]"
              title="Registrar Falha"
            >
              <span className="text-[8px] font-black uppercase tracking-tighter">Falha</span>
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onOpenFinalizeModal(index); }}
              className="w-10 h-10 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl flex items-center justify-center active:scale-90 transition-all shadow-lg shadow-emerald-100 dark:shadow-none"
              title="Finalizar Entrega"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            </button>
          </>
        )}
      </div>
    </div>
  );
});

export default InRouteDeliveryItem;
