
import React from 'react';
import { Delivery, DeliveryStatus } from '../types';

interface DeliveryDetailModalProps {
  delivery: Delivery;
  onClose: () => void;
  onPreviewPhoto: (url: string) => void;
}

const DeliveryDetailModal: React.FC<DeliveryDetailModalProps> = ({ delivery, onClose, onPreviewPhoto }) => {
  const statusColors = {
    [DeliveryStatus.PENDING]: 'bg-gray-100 text-gray-600',
    [DeliveryStatus.IN_ROUTE]: 'bg-yellow-100 text-yellow-600',
    [DeliveryStatus.PICKED_UP]: 'bg-blue-100 text-blue-600',
    [DeliveryStatus.DELIVERED]: 'bg-green-100 text-green-600',
    [DeliveryStatus.FAILED]: 'bg-red-100 text-red-600',
  };

  const formatTime = (dateStr?: string) => {
    if (!dateStr) return null;
    return new Date(dateStr).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="fixed inset-0 z-[150] flex items-end sm:items-center justify-center sm:justify-end p-0 sm:p-4 bg-black/40 backdrop-blur-sm animate-fade-in" onClick={onClose}>
      <div 
        className="w-full sm:max-w-md h-[90vh] sm:h-full bg-white dark:bg-gray-900 rounded-t-[2.5rem] sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-slide-up sm:animate-slide-in-right"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center">
          <div>
            <h2 className="text-lg font-black dark:text-white uppercase italic">Detalhes da Entrega</h2>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">ID: #{delivery.id}</p>
          </div>
          <button onClick={onClose} className="p-2 bg-gray-50 dark:bg-gray-800 rounded-xl text-gray-400 hover:text-gray-600 transition-colors">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-8 no-scrollbar">
          {/* Status Badge */}
          <div className="flex justify-center">
            <span className={`px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest ${statusColors[delivery.status]}`}>
              {delivery.status}
            </span>
          </div>

          {/* Timeline */}
          <div className="space-y-4">
            <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Linha do Tempo</h3>
            <div className="space-y-4">
              <div className="flex items-center space-x-3 text-xs">
                <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-sm shadow-emerald-200"></div>
                <span className="font-bold dark:text-gray-300">Criada:</span>
                <span className="font-black text-gray-500">{formatTime(delivery.createdAt)}</span>
              </div>
              {delivery.pickedUpAt && (
                <div className="flex items-center space-x-3 text-xs">
                  <div className="w-2 h-2 rounded-full bg-blue-500 shadow-sm shadow-blue-200"></div>
                  <span className="font-bold dark:text-gray-300">Coletada:</span>
                  <span className="font-black text-gray-500">{formatTime(delivery.pickedUpAt)}</span>
                </div>
              )}
              {delivery.completedAt && (
                <div className="flex items-center space-x-3 text-xs">
                  <div className={`w-2 h-2 rounded-full ${delivery.status === DeliveryStatus.DELIVERED ? 'bg-green-500' : 'bg-red-500'} shadow-sm`}></div>
                  <span className="font-bold dark:text-gray-300">Finalizada:</span>
                  <span className="font-black text-gray-500">{formatTime(delivery.completedAt)}</span>
                </div>
              )}
            </div>
          </div>

          {/* Addresses */}
          <div className="bg-gray-50 dark:bg-gray-800/50 p-5 rounded-3xl border border-gray-100 dark:border-gray-800 space-y-6">
            <div className="space-y-1">
              <span className="text-[9px] font-black text-blue-500 uppercase tracking-widest block">Ponto de Coleta</span>
              <p className="text-xs font-bold dark:text-white uppercase leading-tight">{delivery.pickupAddress || 'Endereço não informado'}</p>
              {delivery.pickupPersonName && <p className="text-[9px] text-gray-400 font-bold uppercase mt-1">Por: {delivery.pickupPersonName}</p>}
            </div>
            
            <div className="w-full h-px bg-gray-200 dark:bg-gray-700"></div>

            <div className="space-y-1">
              <span className="text-[9px] font-black text-red-600 uppercase tracking-widest block">Destino Final</span>
              <p className="text-sm font-black dark:text-white uppercase leading-tight">{delivery.address}</p>
            </div>
          </div>

          {/* Receiver Info */}
          {(delivery.receiverName || delivery.document) && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest block">Recebedor</span>
                <p className="text-xs font-bold dark:text-white uppercase">{delivery.receiverName || 'N/A'}</p>
              </div>
              <div className="space-y-1">
                <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest block">Documento</span>
                <p className="text-xs font-bold dark:text-white uppercase">{delivery.document || 'N/A'}</p>
              </div>
            </div>
          )}

          {/* Failure Info */}
          {delivery.failureReason && (
            <div className="bg-red-50 dark:bg-red-900/10 p-4 rounded-2xl border border-red-100 dark:border-red-900/20">
              <span className="text-[9px] font-black text-red-600 dark:text-red-400 uppercase tracking-widest block mb-2">Motivo da Falha</span>
              <p className="text-xs font-bold dark:text-gray-300 italic">"{delivery.failureReason}"</p>
            </div>
          )}

          {/* Photos */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {delivery.pickupPhotoUrl && (
              <div className="space-y-2">
                <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest block">Foto da Coleta</span>
                <div 
                  className="relative group h-32 bg-gray-100 dark:bg-gray-800 rounded-2xl overflow-hidden border border-gray-100 dark:border-gray-700 cursor-pointer"
                  onClick={() => onPreviewPhoto(delivery.pickupPhotoUrl!)}
                >
                  <img src={delivery.pickupPhotoUrl} className="w-full h-full object-cover transition-transform group-hover:scale-105" alt="Coleta" />
                  <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" /></svg>
                  </div>
                </div>
              </div>
            )}
            
            {delivery.photoUrl && (
              <div className="space-y-2">
                <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest block">Comprovante de Entrega</span>
                <div 
                  className="relative group h-32 bg-gray-100 dark:bg-gray-800 rounded-2xl overflow-hidden border border-gray-100 dark:border-gray-700 cursor-pointer"
                  onClick={() => onPreviewPhoto(delivery.photoUrl!)}
                >
                  <img src={delivery.photoUrl} className="w-full h-full object-cover transition-transform group-hover:scale-105" alt="Entrega" />
                  <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" /></svg>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-6 bg-gray-50 dark:bg-gray-900/50 border-t border-gray-100 dark:border-gray-800 flex space-x-3">
          <button 
            onClick={() => {
              const text = `Entrega: ${delivery.address}\nStatus: ${delivery.status}`;
              if (navigator.share) navigator.share({ title: 'Info Entrega', text });
              else { navigator.clipboard.writeText(text); alert("Copiado!"); }
            }}
            className="flex-1 py-4 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl text-[10px] font-black uppercase shadow-sm active:scale-95 transition-all"
          >
            Compartilhar Info
          </button>
          <button onClick={onClose} className="flex-1 py-4 bg-red-600 text-white rounded-2xl text-[10px] font-black uppercase shadow-lg shadow-red-100 dark:shadow-none active:scale-95 transition-all">
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeliveryDetailModal;
