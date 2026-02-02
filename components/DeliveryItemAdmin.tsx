
import React, { memo, useState } from 'react';
import { Delivery, DeliveryStatus } from '../types';

interface DeliveryItemAdminProps {
  delivery: Delivery;
  index: number;
  updateDeliveryField: (id: string, field: 'address' | 'pickupAddress', value: string) => void;
  removeDelivery: (id: string) => void;
  isDuplicateWarning?: boolean;
  addressSuggestions: string[];
  onShowDetails?: () => void;
}

const SuggestionsList: React.FC<{ suggestions: string[], onSelect: (value: string) => void }> = ({ suggestions, onSelect }) => {
  if (suggestions.length === 0) return null;
  return (
      <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg shadow-xl z-10 max-h-40 overflow-y-auto no-scrollbar">
          <ul>
              {suggestions.map((suggestion, idx) => (
                  <li key={idx}>
                      <button
                          type="button"
                          onMouseDown={(e) => { e.preventDefault(); onSelect(suggestion); }}
                          className="w-full text-left px-3 py-2 text-xs text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                      >
                          {suggestion}
                      </button>
                  </li>
              ))}
          </ul>
      </div>
  );
};


const DeliveryItemAdmin: React.FC<DeliveryItemAdminProps> = memo(({
  delivery,
  index,
  updateDeliveryField,
  removeDelivery,
  isDuplicateWarning = false,
  addressSuggestions,
  onShowDetails
}) => {
  const isFinalized = delivery.status === DeliveryStatus.DELIVERED || delivery.status === DeliveryStatus.FAILED;
  
  const [pickupSuggestions, setPickupSuggestions] = useState<string[]>([]);
  const [destSuggestions, setDestSuggestions] = useState<string[]>([]);

  const handleInputChange = (field: 'pickupAddress' | 'address', value: string) => {
    updateDeliveryField(delivery.id, field, value);

    if (value.trim().length > 2) {
        const filtered = addressSuggestions
            .filter(addr => addr.toLowerCase().includes(value.toLowerCase()) && addr.toLowerCase() !== value.toLowerCase())
            .slice(0, 5);
        
        if (field === 'pickupAddress') setPickupSuggestions(filtered);
        else setDestSuggestions(filtered);
    } else {
        if (field === 'pickupAddress') setPickupSuggestions([]);
        else setDestSuggestions([]);
    }
  };

  const handleSelectSuggestion = (field: 'pickupAddress' | 'address', value: string) => {
      updateDeliveryField(delivery.id, field, value);
      if (field === 'pickupAddress') setPickupSuggestions([]);
      else setDestSuggestions([]);
  };

  const handleRemove = () => {
    if (window.confirm("Tem certeza de que deseja apagar esta entrega? Esta ação não pode ser desfeita.")) {
      removeDelivery(delivery.id);
    }
  };

  const openInMaps = (addr: string) => {
    if (!addr) return;
    window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(addr)}`, '_blank');
  };

  return (
    <div className={`bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-sm border transition-all ${isDuplicateWarning ? 'border-yellow-400 bg-yellow-50/10 dark:bg-yellow-900/5' : 'border-gray-100 dark:border-gray-700'} flex items-start space-x-4 ${isFinalized ? 'opacity-60' : ''}`}>
      <div 
        onClick={onShowDetails}
        className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-[10px] shrink-0 mt-1.5 cursor-pointer hover:scale-105 transition-transform ${delivery.status === DeliveryStatus.DELIVERED ? 'bg-green-100 text-green-600' : delivery.status === DeliveryStatus.IN_ROUTE ? 'bg-yellow-100 text-yellow-600' : 'bg-red-50 text-red-600'}`}
        title="Ver Detalhes Completos"
      >
        {index + 1}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex space-x-3">
          <div className="flex flex-col items-center h-full">
            <div className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center shrink-0">
              <svg className="w-3.5 h-3.5 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.27 6.96 12 12.01 20.73 6.96" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 22.08V12" />
              </svg>
            </div>
            <div className="w-px flex-1 border-l-2 border-dashed border-gray-200 dark:border-gray-700 my-1"></div>
          </div>
          <div className="flex-1 pb-5 min-w-0 relative">
            <span className="text-[8px] font-black uppercase text-gray-400 tracking-widest">Ponto de Coleta</span>
            <input 
              type="text" 
              value={delivery.pickupAddress || ''} 
              onChange={(e) => handleInputChange('pickupAddress', e.target.value)}
              onFocus={(e) => handleInputChange('pickupAddress', e.target.value)}
              onBlur={() => setTimeout(() => setPickupSuggestions([]), 150)}
              placeholder="Rua, Número, Bairro (Coleta)..." 
              className="w-full bg-transparent border-none focus:ring-0 text-[11px] text-gray-600 dark:text-gray-400 font-medium p-0"
              autoComplete="off"
            />
            <SuggestionsList suggestions={pickupSuggestions} onSelect={(value) => handleSelectSuggestion('pickupAddress', value)} />
          </div>
        </div>

        <div className="flex space-x-3">
           <div className="w-6 h-6 rounded-full bg-red-100 dark:bg-red-900/50 flex items-center justify-center shrink-0">
              <svg className="w-3.5 h-3.5 text-red-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0z" />
              </svg>
            </div>
          <div className="flex-1 min-w-0 relative">
            <div className="flex justify-between items-center">
              <span className="text-[8px] font-black uppercase text-gray-400 tracking-widest">Destino Final</span>
              {isDuplicateWarning && (
                <div className="flex items-center space-x-1 animate-pulse">
                   <svg className="w-3 h-3 text-yellow-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                   <span className="text-[7px] font-black text-yellow-600 dark:text-yellow-400 uppercase tracking-widest">Já existe</span>
                </div>
              )}
            </div>
            <input 
              type="text" 
              value={delivery.address} 
              onChange={(e) => handleInputChange('address', e.target.value)}
              onFocus={(e) => handleInputChange('address', e.target.value)}
              onBlur={() => setTimeout(() => setDestSuggestions([]), 150)}
              placeholder="Endereço de Entrega..." 
              className={`w-full bg-transparent border-none focus:ring-0 text-[12px] font-bold p-0 ${isDuplicateWarning ? 'text-yellow-700 dark:text-yellow-400' : 'text-gray-900 dark:text-gray-100'}`}
              autoComplete="off"
            />
            <SuggestionsList suggestions={destSuggestions} onSelect={(value) => handleSelectSuggestion('address', value)} />
          </div>
        </div>
      </div>

      <div className="flex flex-col items-center space-y-2 pt-1.5">
        <div className={`px-2 py-0.5 rounded text-[7px] font-black uppercase whitespace-nowrap ${delivery.status === DeliveryStatus.DELIVERED ? 'bg-green-100 text-green-600' : delivery.status === DeliveryStatus.IN_ROUTE ? 'bg-yellow-100 text-yellow-600' : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400'}`}>
          {delivery.status}
        </div>
        <div className="flex flex-wrap justify-center gap-1">
          <button 
            onClick={() => openInMaps(delivery.address)}
            className="p-1.5 bg-gray-100 dark:bg-gray-700 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
            title="Ver no Google Maps"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
          </button>
          <button 
            onClick={onShowDetails}
            className="p-1.5 bg-gray-100 dark:bg-gray-700 text-gray-400 hover:text-red-600 rounded-lg transition-colors"
            title="Mais Detalhes"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          </button>
          <button 
            onClick={handleRemove} 
            className="p-1.5 bg-red-50 dark:bg-red-900/20 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
            title="Apagar Entrega"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
});

export default DeliveryItemAdmin;
