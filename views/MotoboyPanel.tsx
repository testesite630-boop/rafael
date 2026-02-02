
import React, { useState, useEffect, useMemo, useCallback, lazy, Suspense, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Delivery, DeliveryStatus } from '../types';
import SettingsMenu from '../components/SettingsMenu';
import InRouteDeliveryItem from '../components/InRouteDeliveryItem'; 
import HistoryDeliveryItem from '../components/HistoryDeliveryItem'; 
import RouteOptimizer from '../components/RouteOptimizer';
import DeliveryDetailModal from '../components/DeliveryDetailModal';
import { useApp } from '../App';

const RouteMap = lazy(() => import('../components/RouteMap'));

const MotoboyPanel: React.FC = () => {
  const { user, setUser, settings, setSettings } = useApp();
  const navigate = useNavigate();
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [viewMode, setViewMode] = useState<'current' | 'all' | 'map' | 'history'>('current');
  const [motoboyLocation, setMotoboyLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [showProofModal, setShowProofModal] = useState(false);
  const [showPickupModal, setShowPickupModal] = useState(false);
  const [showFailureModal, setShowFailureModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showOptimizer, setShowOptimizer] = useState(false);
  const [selectedDelivery, setSelectedDelivery] = useState<Delivery | null>(null);
  const [previewPhoto, setPreviewPhoto] = useState<string | null>(null);
  const [receiverName, setReceiverName] = useState('');
  const [pickupPersonName, setPickupPersonName] = useState('');
  const [docNumber, setDocNumber] = useState('');
  const [photo, setPhoto] = useState<string | null>(null);
  const [pickupPhoto, setPickupPhoto] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [notes, setNotes] = useState('');
  const [isSharingAll, setIsSharingAll] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pickupFileInputRef = useRef<HTMLInputElement>(null);


  const inRouteDeliveries = useMemo(() =>
    deliveries.filter(d => d.status === DeliveryStatus.IN_ROUTE || d.status === DeliveryStatus.PICKED_UP),
    [deliveries]
  );

  const historyDeliveries = useMemo(() => 
    deliveries.filter(d => d.status === DeliveryStatus.DELIVERED || d.status === DeliveryStatus.FAILED),
    [deliveries]
  );
  
  const currentDelivery = inRouteDeliveries[currentIndex];

  useEffect(() => {
    const load = () => {
      const saved = localStorage.getItem('deliveries');
      if (saved) setDeliveries(JSON.parse(saved).sort((a: any, b: any) => a.order - b.order));
    };
    load();
    const handleStorage = (e: StorageEvent) => { if (e.key === 'deliveries') load(); };
    window.addEventListener('storage', handleStorage);

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        setMotoboyLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
      },
      (error) => {
        console.error("Erro de geolocalização:", error);
      },
      { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
    );

    return () => {
      window.removeEventListener('storage', handleStorage);
      navigator.geolocation.clearWatch(watchId);
    };
  }, []);

  const updateGlobal = useCallback((updated: Delivery[]) => {
    const sorted = updated.sort((a, b) => a.order - b.order);
    setDeliveries(sorted);
    localStorage.setItem('deliveries', JSON.stringify(sorted));
    window.dispatchEvent(new Event('storage'));
  }, []);

  const handleOpenPickupModal = useCallback((index: number) => {
    setCurrentIndex(index);
    setPickupPersonName('');
    setPickupPhoto(null);
    setShowPickupModal(true);
  }, []);

  const handleOpenFinalizeModal = useCallback((index: number) => {
    setCurrentIndex(index);
    setReceiverName('');
    setDocNumber('');
    setPhoto(null);
    setNotes('');
    setShowProofModal(true);
  }, []);

  const handleOpenFailureModal = useCallback((index: number) => {
    setCurrentIndex(index);
    setNotes('');
    setShowFailureModal(true);
  }, []);

  const handleConfirmPickup = () => {
    if (!currentDelivery) return;
    const updated = deliveries.map(d => d.id === currentDelivery.id ? { 
      ...d, 
      status: DeliveryStatus.PICKED_UP,
      pickupPersonName: pickupPersonName.trim() || 'Não informado',
      pickupPhotoUrl: pickupPhoto || undefined,
      pickedUpAt: new Date().toISOString()
    } : d);
    updateGlobal(updated);
    setShowPickupModal(false);
    setPickupPersonName('');
    setPickupPhoto(null);
  };

  const handleFinalize = (status: DeliveryStatus) => {
    if (!currentDelivery) return;
    if (status === DeliveryStatus.DELIVERED && !receiverName.trim()) return alert("Nome do recebedor é obrigatório.");
    if (status === DeliveryStatus.FAILED && !notes.trim()) return alert("O motivo da falha é obrigatório.");
    
    const updated = deliveries.map(d => d.id === currentDelivery.id ? { 
      ...d, status, receiverName, document: docNumber, photoUrl: photo || d.photoUrl,
      completedAt: new Date().toISOString(), failureReason: status === DeliveryStatus.FAILED ? notes : '',
      motoboyName: user?.name || 'Motoboy'
    } : d);
    
    updateGlobal(updated);
    setShowProofModal(false);
    setShowFailureModal(false);
    setReceiverName(''); setDocNumber(''); setPhoto(null); setNotes('');
    if (currentIndex >= inRouteDeliveries.length - 1) setCurrentIndex(Math.max(0, currentIndex - 1));
  };

  const handleConfirmFailureFromModal = () => {
    if (!currentDelivery) return;
    if (!notes.trim()) {
        alert("O motivo da falha é obrigatório.");
        return;
    }
    handleFinalize(DeliveryStatus.FAILED);
  };

  const handleShareDelivery = useCallback((d: Delivery) => {
    const text = `RL EXPRESS - Comprovante\nID: #${d.id}\nDestino: ${d.address}\nStatus: ${d.status === DeliveryStatus.DELIVERED ? 'ENTREGUE' : 'FALHA'}`;
    if (navigator.share) {
      navigator.share({ title: 'Comprovante', text }).catch(() => alert("Copiado!"));
    } else {
      navigator.clipboard.writeText(text);
      alert("Copiado!");
    }
  }, []);

  const handleWhatsApp = (d: Delivery) => {
    const text = `*RL EXPRESS - Comprovante*\n\nID: #${d.id}\nDestino: ${d.address}\nRecebedor: ${d.receiverName || 'N/A'}\nStatus: ${d.status === DeliveryStatus.DELIVERED ? 'ENTREGUE' : 'FALHA'}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  const handleShareAllPhotos = async () => {
    const deliveriesWithPhotos = historyDeliveries.filter(d => d.photoUrl);
    if (deliveriesWithPhotos.length === 0) return alert("Não há fotos de comprovantes para compartilhar.");
    
    setIsSharingAll(true);
    try {
      const files: File[] = [];
      for (const d of deliveriesWithPhotos) {
        const response = await fetch(d.photoUrl!);
        const blob = await response.blob();
        files.push(new File([blob], `rl-express-${d.id}.jpg`, { type: 'image/jpeg' }));
      }

      if (navigator.canShare && navigator.canShare({ files })) {
        await navigator.share({
          files,
          title: 'RL EXPRESS - Todos os Comprovantes',
          text: `Prestação de contas RL EXPRESS - ${new Date().toLocaleDateString()}`
        });
      } else {
        alert("Seu dispositivo não suporta o compartilhamento de múltiplos arquivos.");
      }
    } catch (err) {
      console.error("Erro ao compartilhar lote de fotos:", err);
      alert("Ocorreu um erro ao processar as imagens.");
    } finally {
      setIsSharingAll(false);
    }
  };

  const handleStartNavigation = useCallback((deliveriesToNavigate: Delivery[]) => {
    if (deliveriesToNavigate.length === 0) {
      alert("Nenhum endereço válido para iniciar a rota.");
      return;
    }

    const routePoints: string[] = [];
    const addedAddresses = new Set<string>();

    deliveriesToNavigate.forEach(delivery => {
      if (delivery.status === DeliveryStatus.IN_ROUTE && delivery.pickupAddress && !addedAddresses.has(delivery.pickupAddress)) {
        routePoints.push(delivery.pickupAddress);
        addedAddresses.add(delivery.pickupAddress);
      }
      if (delivery.address && !addedAddresses.has(delivery.address)) {
        routePoints.push(delivery.address);
        addedAddresses.add(delivery.address);
      }
    });

    if (routePoints.length === 0) {
      alert("Nenhum endereço válido para iniciar a rota.");
      return;
    }

    const baseUrl = "https://www.google.com/maps/dir/";
    const encodedPoints = routePoints.map(point => encodeURIComponent(point)).join('/');
    const googleMapsUrl = `${baseUrl}${encodedPoints}`;
    window.open(googleMapsUrl, '_blank');
  }, []);

  const navigateToPoint = (addr?: string) => {
    if (!addr) return;
    window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(addr)}`, '_blank');
  };

  const handleApplyOptimization = useCallback((orderedIds: string[]) => {
      const existingOrders = inRouteDeliveries.map(d => d.order).sort((a, b) => a - b);
      const orderMap = new Map<string, number>();
      orderedIds.forEach((id, index) => {
        orderMap.set(id, existingOrders[index]);
      });

      const updatedDeliveries = deliveries.map(delivery => {
        if (orderMap.has(delivery.id)) {
          return { ...delivery, order: orderMap.get(delivery.id)! };
        }
        return delivery;
      });

      updateGlobal(updatedDeliveries);
      setCurrentIndex(0);
      setShowOptimizer(false);
  }, [deliveries, inRouteDeliveries, updateGlobal]);

  const handleApplyAndNavigate = useCallback((orderedIds: string[]) => {
    const existingOrders = inRouteDeliveries.map(d => d.order).sort((a, b) => a - b);
    const orderMap = new Map<string, number>();
    orderedIds.forEach((id, index) => {
      orderMap.set(id, existingOrders[index]);
    });

    const updatedDeliveries = deliveries.map(delivery => {
      if (orderMap.has(delivery.id)) {
        return { ...delivery, order: orderMap.get(delivery.id)! };
      }
      return delivery;
    });

    updateGlobal(updatedDeliveries);
    setCurrentIndex(0);

    const updatedInRouteDeliveries = updatedDeliveries.filter(d => d.status === DeliveryStatus.IN_ROUTE || d.status === DeliveryStatus.PICKED_UP);
    handleStartNavigation(updatedInRouteDeliveries);
    
    setShowOptimizer(false);
  }, [deliveries, inRouteDeliveries, updateGlobal, handleStartNavigation]);

  const handleLogout = () => {
    setUser(null);
    navigate('/login');
  };

  const handlePhotoSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhoto(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePickupPhotoSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPickupPhoto(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const toggleTheme = () => {
    setSettings(s => ({ ...s, theme: s.theme === 'light' ? 'dark' : 'light' }));
  };


  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 transition-theme flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-sm h-[700px] bg-white dark:bg-gray-900 rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col border-4 border-white dark:border-gray-800 relative transition-theme">
        <header className="p-5 border-b border-gray-100 dark:border-gray-800 flex flex-col space-y-4 z-10 bg-white dark:bg-gray-900 transition-theme">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <img src={user?.avatar} alt={user?.name} className="w-8 h-8 rounded-full object-cover border-2 border-gray-100 dark:border-gray-700" />
              <h2 className="font-black dark:text-white uppercase italic">RL EXPRESS<span className="text-red-600">.</span></h2>
            </div>
            <div className="flex space-x-2">
              <button 
                onClick={() => navigate('/map')}
                className="flex items-center space-x-2 px-3 py-2 bg-red-50 dark:bg-red-900/20 rounded-xl text-red-600 shadow-sm active:scale-90 transition-all"
                title="Visualizar no Mapa"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" /></svg>
                <span className="text-[8px] font-black uppercase hidden xs:block">Mapa</span>
              </button>
              <button 
                onClick={toggleTheme} 
                className="p-2 bg-gray-50 dark:bg-gray-800 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all active:scale-95 group overflow-hidden shadow-sm"
                title="Trocar Tema"
              >
                {settings.theme === 'light' ? (
                  <svg className="w-4 h-4 group-hover:rotate-12 group-hover:scale-110 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>
                ) : (
                  <svg className="w-4 h-4 group-hover:rotate-90 group-hover:scale-110 transition-transform duration-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707M16.95 16.95l.707.707M7.05 7.05l.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                )}
              </button>
            </div>
          </div>
          <div className="flex bg-gray-100 dark:bg-gray-800 p-1 rounded-xl transition-theme">
            {(['current', 'all', 'map', 'history'] as const).map(m => (
              <button key={m} onClick={() => setViewMode(m)} className={`flex-1 py-2 rounded-lg text-[10px] font-black uppercase transition-all ${viewMode === m ? 'bg-white dark:bg-gray-700 text-red-600 shadow-sm' : 'text-gray-400'}`}>
                {m === 'current' ? 'Agora' : m === 'all' ? 'Rota' : m === 'map' ? 'Pequeno' : 'Visto'}
              </button>
            ))}
          </div>
        </header>
        <main className="flex-1 overflow-y-auto no-scrollbar relative">
          {viewMode === 'map' ? (
            <Suspense fallback={<div className="w-full h-full flex items-center justify-center"><span className="text-xs font-bold text-gray-400">Carregando Mapa...</span></div>}>
              <RouteMap deliveries={inRouteDeliveries} motoboyLocation={motoboyLocation} />
            </Suspense>
          ) : viewMode === 'current' && currentDelivery ? (
            <div className="p-4 space-y-4 animate-fade-in">
              <div className="bg-gray-50 dark:bg-gray-800/50 p-6 rounded-3xl border border-gray-100 dark:border-gray-700 transition-theme">
                 <div className="flex justify-between items-center mb-4">
                   <span className="text-[9px] font-black text-red-600 uppercase tracking-widest">Entrega {currentIndex + 1} de {inRouteDeliveries.length}</span>
                 </div>
                 <h3 className="text-xl font-black dark:text-white leading-tight mb-6 uppercase">{currentDelivery.address}</h3>
                 
                 <div className="mb-6">
                    <button 
                      onClick={() => navigateToPoint(currentDelivery.status === DeliveryStatus.IN_ROUTE ? currentDelivery.pickupAddress : currentDelivery.address)}
                      className="w-full bg-white dark:bg-gray-700 border-2 border-red-500 text-red-600 dark:text-red-400 py-3 rounded-2xl font-black text-[10px] uppercase flex items-center justify-center space-x-2 shadow-sm active:scale-95 transition-all"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                      <span>Ir para {currentDelivery.status === DeliveryStatus.IN_ROUTE ? 'Coleta' : 'Destino'}</span>
                    </button>
                 </div>

                 <div className="flex flex-col space-y-2">
                   {currentDelivery.status === DeliveryStatus.IN_ROUTE ? (
                     <button onClick={() => handleOpenPickupModal(currentIndex)} className="w-full bg-blue-500 text-white py-4 rounded-2xl font-black text-[10px] uppercase shadow-lg shadow-blue-100 dark:shadow-none">Coletar Pedido</button>
                   ) : (
                     <button onClick={() => handleOpenFinalizeModal(currentIndex)} className="w-full bg-emerald-500 text-white py-4 rounded-2xl font-black text-[10px] uppercase shadow-lg shadow-emerald-100 dark:shadow-none">Finalizar Entrega</button>
                   )}
                 </div>
              </div>
            </div>
          ) : viewMode === 'all' ? (
            <div className="p-4 space-y-3">
               <button 
                 onClick={() => navigate('/map')}
                 className="w-full bg-red-600 text-white p-4 rounded-2xl font-black text-xs uppercase shadow-lg shadow-red-100 dark:shadow-none flex items-center justify-center space-x-2"
               >
                 <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" /></svg>
                 <span>Visualizar no Mapa</span>
               </button>
               <button onClick={() => setShowOptimizer(true)} disabled={inRouteDeliveries.length < 2} className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-4 rounded-2xl font-black text-xs uppercase shadow-lg shadow-blue-100 disabled:opacity-50 disabled:cursor-not-allowed">
                 Otimizar Rota
               </button>
               <button 
                 onClick={() => handleStartNavigation(inRouteDeliveries)} 
                 disabled={inRouteDeliveries.length === 0}
                 className="w-full bg-emerald-500 hover:bg-emerald-600 text-white p-4 rounded-2xl font-black text-xs uppercase shadow-lg shadow-emerald-100 disabled:opacity-50"
               >
                 Iniciar Rota no Google Maps
               </button>
               {inRouteDeliveries.map((d, i) => (
                 <InRouteDeliveryItem 
                   key={d.id} 
                   delivery={d} 
                   index={i} 
                   currentIndex={currentIndex} 
                   setCurrentIndex={setCurrentIndex} 
                   setViewMode={setViewMode} 
                   onOpenPickupModal={handleOpenPickupModal}
                   onOpenFinalizeModal={handleOpenFinalizeModal}
                   onOpenFailureModal={handleOpenFailureModal}
                   onShowDetails={() => setSelectedDelivery(d)}
                 />
               ))}
            </div>
          ) : viewMode === 'history' ? (
            <div className="p-4 space-y-3">
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-gray-100 dark:border-gray-800">
                <h3 className="text-xs font-black uppercase text-gray-400">Seu Histórico</h3>
                <div className="flex items-center space-x-2">
                  <button 
                    onClick={handleShareAllPhotos}
                    disabled={isSharingAll || historyDeliveries.filter(d => d.photoUrl).length === 0}
                    className="flex items-center space-x-1.5 px-3 py-1.5 bg-red-50 dark:bg-red-900/20 text-red-600 rounded-lg text-[9px] font-black uppercase hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors disabled:opacity-40"
                  >
                    <svg className={`w-3 h-3 ${isSharingAll ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      {isSharingAll ? (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      ) : (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                      )}
                    </svg>
                    <span>{isSharingAll ? 'Enviando...' : 'Enviar Todas'}</span>
                  </button>
                  <button 
                    onClick={() => setViewMode('all')} 
                    className="flex items-center space-x-1.5 px-3 py-1.5 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 rounded-lg text-[9px] font-black uppercase hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 19l-7-7 7-7" /></svg>
                  </button>
                </div>
              </div>
              {historyDeliveries.length > 0 ? (
                historyDeliveries.map(d => (
                  <HistoryDeliveryItem key={d.id} delivery={d} isExpanded={expandedId === d.id} toggleExpand={setExpandedId} handleShareDelivery={handleShareDelivery} handleWhatsAppShare={handleWhatsApp} setPreviewPhoto={setPreviewPhoto} />
                ))
              ) : (
                <div className="text-center py-10">
                  <p className="text-sm font-bold text-gray-400">Nenhuma entrega finalizada.</p>
                  <p className="text-xs text-gray-400 mt-1">Seu histórico aparecerá aqui.</p>
                </div>
              )}
            </div>
          ) : null}
        </main>

        {showPickupModal && (
          <div className="absolute inset-0 bg-black/80 z-50 flex items-end p-4" onClick={() => setShowPickupModal(false)}>
            <div className="bg-white dark:bg-gray-800 w-full rounded-[2rem] p-6 space-y-4 shadow-2xl transition-theme" onClick={e => e.stopPropagation()}>
              <h3 className="font-black dark:text-white uppercase italic">Confirmar Coleta</h3>
              
              <input
                ref={pickupFileInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handlePickupPhotoSelect}
                className="hidden"
              />
              
              {pickupPhoto ? (
                <div className="relative group">
                  <img src={pickupPhoto} alt="Item Coletado" className="w-full h-32 object-cover rounded-xl border-2 border-gray-100 dark:border-gray-700" />
                  <button onClick={() => setPickupPhoto(null)} className="absolute top-2 right-2 bg-black/50 text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => pickupFileInputRef.current?.click()}
                  className="w-full flex flex-col items-center justify-center py-6 rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-700 text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                >
                  <svg className="w-8 h-8 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                  <span className="text-[10px] font-black uppercase">Foto do Item (Opcional)</span>
                </button>
              )}

              <input value={pickupPersonName} onChange={e => setPickupPersonName(e.target.value)} placeholder="Nome de quem entregou o pedido" className="w-full bg-gray-50 dark:bg-gray-700 p-4 rounded-xl text-xs font-bold dark:text-white outline-none transition-colors" />
              <button onClick={handleConfirmPickup} className="w-full py-4 bg-blue-500 text-white rounded-xl font-black text-[10px] uppercase">Confirmar Retirada</button>
            </div>
          </div>
        )}

        {showFailureModal && (
          <div className="absolute inset-0 bg-black/80 z-50 flex items-end p-4" onClick={() => setShowFailureModal(false)}>
            <div className="bg-white dark:bg-gray-800 w-full rounded-[2rem] p-6 space-y-4 shadow-2xl transition-theme" onClick={e => e.stopPropagation()}>
              <h3 className="font-black dark:text-white uppercase italic">Registrar Falha</h3>
              <textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="Descreva o motivo da falha (obrigatório)"
                rows={3}
                className="w-full bg-gray-50 dark:bg-gray-700 p-4 rounded-xl text-xs font-bold dark:text-white outline-none resize-none transition-colors"
              />
              <button onClick={handleConfirmFailureFromModal} disabled={!notes.trim()} className="w-full py-4 bg-red-600 text-white rounded-xl font-black text-[10px] uppercase disabled:opacity-50">Confirmar Falha</button>
            </div>
          </div>
        )}
        
        {showProofModal && (
          <div className="absolute inset-0 bg-black/80 z-50 flex items-end p-4" onClick={() => setShowProofModal(false)}>
            <div className="bg-white dark:bg-gray-800 w-full rounded-[2rem] p-6 space-y-4 shadow-2xl transition-theme" onClick={e => e.stopPropagation()}>
              <h3 className="font-black dark:text-white uppercase italic">Finalizar Entrega</h3>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handlePhotoSelect}
                className="hidden"
              />
              {photo ? (
                <div className="relative group">
                  <img src={photo} alt="Comprovante" className="w-full h-32 object-cover rounded-xl border-2 border-gray-100 dark:border-gray-700" />
                  <button onClick={() => setPhoto(null)} className="absolute top-2 right-2 bg-black/50 text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full flex flex-col items-center justify-center py-6 rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-700 text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                >
                  <svg className="w-8 h-8 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                  <span className="text-[10px] font-black uppercase">Adicionar Foto</span>
                </button>
              )}
              <input value={receiverName} onChange={e => setReceiverName(e.target.value)} placeholder="Nome do Recebedor (obrigatório)" className="w-full bg-gray-50 dark:bg-gray-700 p-4 rounded-xl text-xs font-bold dark:text-white outline-none transition-colors" />
              <div className="flex space-x-2">
                <button onClick={() => handleFinalize(DeliveryStatus.FAILED)} className="flex-1 py-4 bg-gray-100 dark:bg-gray-700 text-gray-500 rounded-xl font-black text-[10px] uppercase">Falhou</button>
                <button onClick={() => handleFinalize(DeliveryStatus.DELIVERED)} disabled={!receiverName.trim()} className="flex-1 py-4 bg-emerald-500 text-white rounded-xl font-black text-[10px] uppercase disabled:opacity-50">Entregue</button>
              </div>
            </div>
          </div>
        )}

        {showSettingsModal && (
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-6" onClick={() => setShowSettingsModal(false)}>
            <div className="w-full max-sm" onClick={e => e.stopPropagation()}><SettingsMenu /></div>
          </div>
        )}

        {showOptimizer && (
          <RouteOptimizer 
            deliveries={inRouteDeliveries}
            onApply={handleApplyOptimization}
            onApplyAndNavigate={handleApplyAndNavigate}
            onClose={() => setShowOptimizer(false)}
          />
        )}

        {selectedDelivery && (
          <DeliveryDetailModal 
            delivery={selectedDelivery} 
            onClose={() => setSelectedDelivery(null)} 
            onPreviewPhoto={setPreviewPhoto} 
          />
        )}
      </div>
    </div>
  );
};

export default MotoboyPanel;
