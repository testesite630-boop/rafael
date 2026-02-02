
import React, { memo, useState } from 'react';
import { Delivery, DeliveryStatus } from '../types';

interface HistoryDeliveryItemProps {
  delivery: Delivery;
  isExpanded: boolean;
  toggleExpand: (id: string) => void;
  handleShareDelivery: (delivery: Delivery) => void;
  handleWhatsAppShare?: (delivery: Delivery) => void;
  setPreviewPhoto: (url: string | null) => void;
  onRemove?: (id: string) => void;
}

const HistoryDeliveryItem: React.FC<HistoryDeliveryItemProps> = memo(({
  delivery,
  isExpanded,
  toggleExpand,
  handleShareDelivery,
  handleWhatsAppShare,
  setPreviewPhoto,
  onRemove
}) => {
  const isDelivered = delivery.status === DeliveryStatus.DELIVERED;
  const dateObj = new Date(delivery.completedAt!);
  const pickedUpDate = delivery.pickedUpAt ? new Date(delivery.pickedUpAt) : null;
  const [isSharingPhoto, setIsSharingPhoto] = useState(false);

  const sharePhotoFile = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!delivery.photoUrl) return;
    
    setIsSharingPhoto(true);
    try {
      const response = await fetch(delivery.photoUrl);
      const blob = await response.blob();
      const file = new File([blob], `comprovante-${delivery.id}.jpg`, { type: 'image/jpeg' });
      
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: 'RL EXPRESS - Comprovante',
          text: `Comprovante de entrega: ${delivery.address}`
        });
      } else {
        alert("Seu dispositivo não suporta o compartilhamento deste arquivo.");
      }
    } catch (err) {
      console.error("Erro ao compartilhar foto:", err);
      alert("Não foi possível processar a imagem para compartilhamento.");
    } finally {
      setIsSharingPhoto(false);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 overflow-hidden shadow-sm animate-slide-up transition-all">
      <div
        className="p-4 flex items-center space-x-3 cursor-pointer active:bg-gray-50 dark:active:bg-gray-700/50"
        onClick={() => toggleExpand(delivery.id)}
      >
        <div className={`w-10 h-10 rounded-full shrink-0 flex items-center justify-center ${isDelivered ? 'bg-green-50 text-green-500' : 'bg-red-50 text-red-500'}`}>
          {isDelivered ? (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
          ) : (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-center mb-0.5">
            <span className={`text-[8px] font-black uppercase ${isDelivered ? 'text-green-600' : 'text-red-600'}`}>
              {isDelivered ? 'Entregue' : 'Falhou'}
            </span>
            <span className="text-[8px] font-bold text-gray-400 uppercase tracking-tight">
              {dateObj.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
          
          <div className="space-y-0.5">
            <div className="flex items-center space-x-1.5 opacity-60">
               <div className="w-1 h-1 rounded-full bg-blue-400"></div>
               <span className="text-[8px] font-bold text-gray-500 truncate uppercase">{delivery.pickupAddress || 'Coleta s/ endereço'}</span>
            </div>
            <h4 className="text-[11px] font-black dark:text-white leading-tight uppercase truncate">
              <span className="text-red-600 mr-1">●</span>{delivery.address}
            </h4>
          </div>
        </div>

        {delivery.photoUrl && !isExpanded && (
          <div className="w-10 h-10 rounded-lg overflow-hidden border border-gray-100 dark:border-gray-700 shrink-0 shadow-sm">
            <img src={delivery.photoUrl} className="w-full h-full object-cover" alt="Comprovante" />
          </div>
        )}

        <svg className={`w-4 h-4 text-gray-300 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" /></svg>
      </div>

      {isExpanded && (
        <div className="px-4 pb-4 animate-fade-in bg-gray-50/30 dark:bg-gray-900/30 border-t border-gray-50 dark:border-gray-700/50">
          <div className="pt-4 space-y-4">
            
            <div className="bg-white dark:bg-gray-800/40 p-3 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm space-y-3">
              <div className="flex items-start space-x-3">
                <div className="mt-1 w-2.5 h-2.5 rounded-full bg-blue-500 shrink-0 shadow-sm shadow-blue-100 dark:shadow-none"></div>
                <div className="flex-1 min-w-0">
                  <span className="text-[7px] font-black text-gray-400 uppercase block tracking-widest mb-0.5">Ponto de Coleta</span>
                  <span className="text-[10px] font-bold dark:text-gray-200 uppercase block leading-tight">
                    {delivery.pickupAddress || 'Endereço de Coleta não informado'}
                  </span>
                  {delivery.pickupPersonName && (
                    <div className="mt-1 flex items-center space-x-1">
                      <span className="text-[7px] text-gray-400 uppercase">Entregue por:</span>
                      <span className="text-[8px] font-black text-blue-600 dark:text-blue-400 uppercase">{delivery.pickupPersonName}</span>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <div className="mt-1 w-2.5 h-2.5 rounded-full bg-red-600 shrink-0 shadow-sm shadow-red-100 dark:shadow-none"></div>
                <div className="flex-1 min-w-0">
                  <span className="text-[7px] font-black text-gray-400 uppercase block tracking-widest mb-0.5">Destino Final</span>
                  <span className="text-[11px] font-black dark:text-white uppercase block leading-tight">
                    {delivery.address}
                  </span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-0.5">
                <span className="text-[7px] font-black text-gray-400 uppercase block tracking-widest">Recebedor</span>
                <span className="text-[10px] font-bold dark:text-gray-200 uppercase truncate block">{delivery.receiverName || 'N/A'}</span>
              </div>
              <div className="space-y-0.5">
                <span className="text-[7px] font-black text-gray-400 uppercase block tracking-widest">Documento</span>
                <span className="text-[10px] font-bold dark:text-gray-200 uppercase truncate block">{delivery.document || 'N/A'}</span>
              </div>
            </div>

            {delivery.failureReason && (
              <div className="bg-amber-50/50 dark:bg-amber-900/10 p-3 rounded-xl border border-amber-100/50 dark:border-amber-900/20">
                <span className="text-[7px] font-black text-amber-600 dark:text-amber-400 uppercase block tracking-widest mb-1.5">
                   Relatório do Motoboy
                </span>
                <p className="text-[10px] font-bold dark:text-gray-300 italic leading-snug">
                  "{delivery.failureReason}"
                </p>
              </div>
            )}
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3">
            {delivery.pickupPhotoUrl && (
              <div className="space-y-2">
                 <span className="text-[7px] font-black text-gray-400 uppercase block tracking-widest">Foto Coleta</span>
                 <div
                    className="relative w-full h-24 bg-gray-100 dark:bg-gray-900 rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 shadow-sm cursor-pointer"
                    onClick={(e) => { e.stopPropagation(); setPreviewPhoto(delivery.pickupPhotoUrl!); }}
                  >
                    <img src={delivery.pickupPhotoUrl} className="w-full h-full object-cover" alt="Coleta" />
                  </div>
              </div>
            )}
            {delivery.photoUrl && (
              <div className="space-y-2">
                 <div className="flex items-center justify-between">
                    <span className="text-[7px] font-black text-gray-400 uppercase block tracking-widest">Foto Entrega</span>
                    <button 
                      onClick={sharePhotoFile}
                      disabled={isSharingPhoto}
                      className="text-red-600 dark:text-red-400 active:scale-90 transition-all disabled:opacity-50"
                    >
                      <svg className={`w-3 h-3 ${isSharingPhoto ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        {isSharingPhoto ? (
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        ) : (
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                        )}
                      </svg>
                    </button>
                 </div>
                 <div
                    className="relative w-full h-24 bg-gray-100 dark:bg-gray-900 rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 shadow-sm cursor-pointer"
                    onClick={(e) => { e.stopPropagation(); setPreviewPhoto(delivery.photoUrl!); }}
                  >
                    <img src={delivery.photoUrl} className="w-full h-full object-cover" alt="Entrega" />
                  </div>
              </div>
            )}
          </div>

          <div className="flex flex-col space-y-2 mt-4">
            <div className="flex space-x-2">
              <button
                onClick={(e) => { e.stopPropagation(); handleShareDelivery(delivery); }}
                className="flex-1 py-3 border border-gray-100 dark:border-gray-700 text-gray-500 dark:text-gray-400 rounded-xl text-[9px] font-black uppercase active:scale-95 transition-all flex items-center justify-center space-x-2"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
                <span>Info Texto</span>
              </button>
              
              {handleWhatsAppShare && (
                <button
                  onClick={(e) => { e.stopPropagation(); handleWhatsAppShare(delivery); }}
                  className="flex-1 py-3 bg-green-500 hover:bg-green-600 text-white rounded-xl text-[9px] font-black uppercase active:scale-95 transition-all flex items-center justify-center space-x-2 shadow-lg shadow-green-100 dark:shadow-none"
                >
                  <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                  </svg>
                  <span>WhatsApp</span>
                </button>
              )}
            </div>

            {onRemove && (
              <button
                onClick={(e) => { e.stopPropagation(); onRemove(delivery.id); }}
                className="w-full py-3 border border-red-50 dark:border-red-900/20 text-red-600 dark:text-red-400 rounded-xl text-[9px] font-black uppercase active:scale-95 transition-all flex items-center justify-center space-x-2"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7" /></svg>
                <span>Excluir Registro</span>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
});

export default HistoryDeliveryItem;
