
import React, { useState, useEffect, useCallback, useMemo, Suspense } from 'react';
import { useNavigate } from 'react-router-dom';
import { extractAddressesFromImages, optimizeRoute } from '../services/geminiService';
import { Delivery, DeliveryStatus } from '../types';
import SettingsMenu from '../components/SettingsMenu';
import DeliveryItemAdmin from '../components/DeliveryItemAdmin'; 
import HistoryDeliveryItem from '../components/HistoryDeliveryItem';
import DeliveryDetailModal from '../components/DeliveryDetailModal';
import DeliveryReports from '../components/DeliveryReports';
import { useApp } from '../App';


const AdminPanel: React.FC = () => {
  const { user, setUser, settings, setSettings } = useApp();
  const navigate = useNavigate();
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeTab, setActiveTab] = useState<'list' | 'history' | 'reports'>('list'); 
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [selectedDelivery, setSelectedDelivery] = useState<Delivery | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [previewPhoto, setPreviewPhoto] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [motoboyFilter] = useState('all');
  const [statusFilter] = useState('all');

  useEffect(() => {
    const loadData = () => {
      const saved = localStorage.getItem('deliveries');
      if (saved) {
        try {
          setDeliveries(JSON.parse(saved));
        } catch (e) {
          console.error("Erro ao carregar entregas", e);
        }
      }
    };
    loadData();
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'deliveries') loadData();
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const saveDeliveries = useCallback((updater: Delivery[] | ((prev: Delivery[]) => Delivery[])) => {
    setDeliveries(prev => {
      const newState = typeof updater === 'function' ? updater(prev) : updater;
      const sortedState = newState.sort((a, b) => a.order - b.order);
      localStorage.setItem('deliveries', JSON.stringify(sortedState));
      window.dispatchEvent(new Event('storage'));
      return sortedState;
    });
  }, []);

  const handleLogout = useCallback(() => {
    setUser(null);
    navigate('/login');
  }, [setUser, navigate]);

  const activeDeliveries = useMemo(() => 
    deliveries.filter(d => 
      (d.status === DeliveryStatus.PENDING || d.status === DeliveryStatus.IN_ROUTE || d.status === DeliveryStatus.PICKED_UP) &&
      (searchTerm === '' || d.address.toLowerCase().includes(searchTerm.toLowerCase()))
    ).sort((a, b) => a.order - b.order),
    [deliveries, searchTerm]
  );

  const historyDeliveries = useMemo(() => 
    deliveries.filter(d => 
      (d.status === DeliveryStatus.DELIVERED || d.status === DeliveryStatus.FAILED) &&
      (motoboyFilter === 'all' || d.motoboyName === motoboyFilter) &&
      (statusFilter === 'all' || d.status === statusFilter) &&
      (searchTerm === '' || d.address.toLowerCase().includes(searchTerm.toLowerCase()))
    ).sort((a, b) => new Date(b.completedAt || 0).getTime() - new Date(a.completedAt || 0).getTime()),
    [deliveries, motoboyFilter, statusFilter, searchTerm]
  );
  
  const allAddresses = useMemo(() => {
    const addressSet = new Set<string>();
    deliveries.forEach(d => {
        if (d.address && d.address.trim()) addressSet.add(d.address);
        if (d.pickupAddress && d.pickupAddress.trim()) addressSet.add(d.pickupAddress);
    });
    return Array.from(addressSet);
  }, [deliveries]);


  const handleClearHistory = useCallback(() => {
    if (historyDeliveries.length === 0) {
      alert("Não há histórico para limpar.");
      return;
    }
    if (window.confirm("Tem certeza de que deseja apagar TODO o histórico de entregas? Esta ação não pode ser desfeita.")) {
      saveDeliveries(prev => prev.filter(d => d.status !== DeliveryStatus.DELIVERED && d.status !== DeliveryStatus.FAILED));
      alert("Histórico de entregas apagado com sucesso.");
    }
  }, [historyDeliveries.length, saveDeliveries]);

  const handleShareDelivery = useCallback((d: Delivery) => {
    const text = `RL EXPRESS - Comprovante\nID: #${d.id}\nDestino: ${d.address}\nRecebedor: ${d.receiverName || 'N/A'}\nStatus: ${d.status === DeliveryStatus.DELIVERED ? 'ENTREGUE' : 'FALHA'}`;
    if (navigator.share) {
      navigator.share({ title: 'Comprovante RL EXPRESS', text }).catch(() => {
        navigator.clipboard.writeText(text);
        alert("Copiado!");
      });
    } else {
      navigator.clipboard.writeText(text);
      alert("Copiado!");
    }
  }, []);

  const handleWhatsAppShare = useCallback((d: Delivery) => {
    const text = `*RL EXPRESS - Comprovante*\n\nID: #${d.id}\nDestino: ${d.address}\nRecebedor: ${d.receiverName || 'N/A'}\nStatus: ${d.status === DeliveryStatus.DELIVERED ? 'ENTREGUE' : 'FALHA'}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  }, []);

  const generateMockCoordinates = () => {
    const center = { lat: -23.5505, lng: -46.6333 };
    return {
      lat: center.lat + (Math.random() - 0.5) * 0.1, 
      lng: center.lng + (Math.random() - 0.5) * 0.1,
    };
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (!fileList || fileList.length === 0) return;
    setIsProcessing(true);
    try {
      const base64s = await Promise.all(Array.from(fileList).map((f: File) => new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(f);
      })));
      const extracted = await extractAddressesFromImages(base64s);
      
      saveDeliveries(prev => {
        const newItems: Delivery[] = extracted.map((addr, i) => {
          const coords = generateMockCoordinates();
          return {
            id: Math.random().toString(36).substring(2, 11),
            pickupAddress: '', 
            address: addr, 
            status: DeliveryStatus.PENDING,
            createdAt: new Date().toISOString(), 
            order: prev.length + i,
            lat: coords.lat,
            lng: coords.lng,
          };
        });
        return [...prev, ...newItems];
      });

      setIsMobileSidebarOpen(false);
    } catch (err: any) { 
      alert("Erro ao processar imagens."); 
      console.error(err);
    } finally { 
      setIsProcessing(false); 
      if (e.target) e.target.value = ''; 
    }
  };

  const handleOptimize = async () => {
    if (activeDeliveries.length < 2) return alert("Mínimo 2 entregas para otimizar.");
    setIsProcessing(true);
    try {
      const result = await optimizeRoute(activeDeliveries); 
      
      if (!result.orderedIds || result.orderedIds.length !== activeDeliveries.length) {
        throw new Error("A IA retornou uma rota inválida.");
      }
      
      const existingOrders = activeDeliveries.map(d => d.order).sort((a, b) => a - b);
      const orderMap = new Map<string, number>();
      result.orderedIds.forEach((id, index) => {
        orderMap.set(id, existingOrders[index]);
      });

      const updated = deliveries.map(d => {
        if (orderMap.has(d.id)) {
          return { ...d, order: orderMap.get(d.id)! };
        }
        return d;
      });

      saveDeliveries(updated);
      alert(`✅ Rota Otimizada!\nEconomia Estimada: ${result.estimatedTimeSaved}`);
    } catch (err: any) { 
      alert(`Erro ao otimizar: ${err.message}`); 
      console.error(err);
    } finally { 
      setIsProcessing(false); 
    }
  };

  const handleDispatch = useCallback(() => {
    if (!deliveries.some(d => d.status === DeliveryStatus.PENDING)) return alert("Nenhuma entrega pendente para despachar.");
    saveDeliveries(deliveries.map(d => d.status === DeliveryStatus.PENDING ? { ...d, status: DeliveryStatus.IN_ROUTE } : d));
    alert("Rota enviada para o motoboy!");
  }, [deliveries, saveDeliveries]);

  const toggleTheme = () => {
    setSettings(s => ({ ...s, theme: s.theme === 'light' ? 'dark' : 'light' }));
  };

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50 dark:bg-gray-950 transition-theme">
      {isMobileSidebarOpen && <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setIsMobileSidebarOpen(false)} />}
      
      <aside className={`fixed lg:relative z-50 h-full w-64 bg-white dark:bg-gray-900 border-r border-gray-100 dark:border-gray-800 transition-transform ${isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'} p-5 flex flex-col`}>
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-xl font-black dark:text-white italic">RL EXPRESS<span className="text-red-600">.</span></h2>
          <button onClick={() => setIsMobileSidebarOpen(false)} className="lg:hidden text-gray-400">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6" /></svg>
          </button>
        </div>

        <div className="space-y-4 flex-1 overflow-y-auto no-scrollbar">
          <input type="file" multiple accept="image/*" onChange={handleImageUpload} className="hidden" id="file-upload" disabled={isProcessing} />
          <label htmlFor="file-upload" className={`w-full flex items-center justify-center py-4 rounded-2xl border-2 border-dashed border-red-200 dark:border-red-900/30 text-red-600 font-black text-[10px] uppercase cursor-pointer ${isProcessing ? 'opacity-50' : 'hover:bg-red-50 dark:hover:bg-red-900/10'}`}>
            {isProcessing ? 'Processando Fotos...' : 'Adicionar por Fotos'}
          </label>
          
          <div className="space-y-2 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-2xl border border-gray-100 dark:border-gray-800">
             <button onClick={handleOptimize} disabled={isProcessing || activeDeliveries.length < 2} className="w-full py-4 bg-red-600 text-white rounded-2xl font-black text-[10px] uppercase shadow-lg shadow-red-100 dark:shadow-none hover:bg-red-700 transition-all disabled:opacity-50">
               {isProcessing ? 'Otimizando...' : 'Otimizar Rota'}
             </button>
             <button 
                onClick={() => navigate('/map')}
                className="w-full py-4 bg-white dark:bg-gray-800 text-red-600 dark:text-red-500 border-2 border-red-100 dark:border-red-900/20 rounded-2xl font-black text-[10px] uppercase hover:bg-red-50 dark:hover:bg-red-900/10 transition-all flex items-center justify-center space-x-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" /></svg>
                <span>Visualizar no Mapa</span>
             </button>
          </div>

          <button onClick={handleDispatch} className="w-full py-4 bg-emerald-500 text-white rounded-2xl font-black text-[10px] uppercase hover:bg-emerald-600 transition-all">Despachar Motoboy</button>
        </div>

        <div className="pt-4 border-t border-gray-100 dark:border-gray-800 flex items-center space-x-2">
            <img src={user?.avatar} alt={user?.name} className="w-10 h-10 rounded-full object-cover border-2 border-gray-100 dark:border-gray-700" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold truncate dark:text-white">{user?.name}</p>
              <p className="text-xs text-gray-400 font-medium">{user?.email}</p>
            </div>
            <div className="flex flex-col items-center">
              <button onClick={() => setShowSettingsModal(true)} className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200" title="Ajustes">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
              </button>
              <button onClick={handleLogout} className="p-1.5 text-red-500 hover:text-red-700" title="Sair">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7" /></svg>
              </button>
            </div>
        </div>
      </aside>

      <main className="flex-1 flex flex-col min-w-0">
        <header className="h-16 border-b border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 flex items-center px-6 justify-between transition-theme">
          <div className="flex items-center space-x-4">
            <button onClick={() => setIsMobileSidebarOpen(true)} className="lg:hidden p-2 text-gray-400"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 6h16M4 12h16" /></svg></button>
            <div className="flex space-x-6">
              {(['list', 'history', 'reports'] as const).map(tab => (
                <button key={tab} onClick={() => setActiveTab(tab)} className={`py-4 border-b-2 font-black text-[10px] uppercase tracking-widest transition-all ${activeTab === tab ? 'border-red-600 text-red-600' : 'border-transparent text-gray-400'}`}>
                  {tab === 'list' ? 'Entregas' : tab === 'history' ? 'Visto' : 'Relatórios'}
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <button 
              onClick={toggleTheme} 
              className="p-2.5 rounded-xl bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all active:scale-95 group shadow-sm overflow-hidden"
              title={settings.theme === 'light' ? 'Modo Escuro' : 'Modo Claro'}
            >
              {settings.theme === 'light' ? (
                <svg className="w-5 h-5 group-hover:rotate-12 group-hover:scale-110 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>
              ) : (
                <svg className="w-5 h-5 group-hover:rotate-90 group-hover:scale-110 transition-transform duration-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707M16.95 16.95l.707.707M7.05 7.05l.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
              )}
            </button>
            <input type="text" placeholder="Buscar..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="hidden md:block bg-gray-100 dark:bg-gray-800 border-none rounded-xl px-4 py-2 text-[10px] font-bold w-48 focus:ring-1 focus:ring-red-500 transition-colors" />
          </div>
        </header>

        <div className="flex-1 overflow-hidden relative">
          {activeTab === 'list' && (
            <div className="h-full overflow-y-auto p-6 space-y-3 no-scrollbar max-w-4xl mx-auto">
              {activeDeliveries.map((d, i) => (
                <DeliveryItemAdmin 
                  key={d.id} 
                  delivery={d} 
                  index={i} 
                  updateDeliveryField={(id, f, v) => saveDeliveries(prev => prev.map(dl => dl.id === id ? {...dl, [f]: v} : dl))} 
                  removeDelivery={id => saveDeliveries(prev => prev.filter(dl => dl.id !== id))}
                  addressSuggestions={allAddresses}
                  onShowDetails={() => setSelectedDelivery(d)}
                />
              ))}
            </div>
          )}

          {activeTab === 'history' && (
            <div className="h-full overflow-y-auto p-6 space-y-4 no-scrollbar max-w-4xl mx-auto">
              <div className="pb-2 mb-2 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center">
                <h3 className="text-xs font-black uppercase text-gray-400">Histórico de Entregas</h3>
                <button
                  onClick={handleClearHistory}
                  disabled={historyDeliveries.length === 0}
                  className="px-3 py-1.5 bg-red-50 dark:bg-red-900/20 text-red-600 rounded-lg text-[9px] font-black uppercase disabled:opacity-50 disabled:cursor-not-allowed hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors flex items-center space-x-1.5"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                  <span>Limpar Tudo ({historyDeliveries.length})</span>
                </button>
              </div>

              {historyDeliveries.map(d => (
                <HistoryDeliveryItem key={d.id} delivery={d} isExpanded={expandedId === d.id} toggleExpand={setExpandedId} handleShareDelivery={handleShareDelivery} handleWhatsAppShare={handleWhatsAppShare} setPreviewPhoto={setPreviewPhoto} onRemove={id => saveDeliveries(prev => prev.filter(dl => dl.id !== id))} />
              ))}
            </div>
          )}

          {activeTab === 'reports' && (
            <div className="h-full overflow-y-auto p-6 no-scrollbar max-w-4xl mx-auto">
              <DeliveryReports deliveries={deliveries} />
            </div>
          )}
        </div>
      </main>

      {showSettingsModal && (
        <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-6 backdrop-blur-sm animate-fade-in" onClick={() => setShowSettingsModal(false)}>
          <div className="w-full max-w-sm" onClick={e => e.stopPropagation()}><SettingsMenu /></div>
        </div>
      )}
      {selectedDelivery && (
        <DeliveryDetailModal 
          delivery={selectedDelivery} 
          onClose={() => setSelectedDelivery(null)} 
          onPreviewPhoto={setPreviewPhoto} 
        />
      )}
      {previewPhoto && (
        <div className="fixed inset-0 bg-black/95 z-[200] flex items-center justify-center p-6" onClick={() => setPreviewPhoto(null)}>
          <img src={previewPhoto} className="max-w-full max-h-full object-contain rounded-3xl" alt="Preview" />
        </div>
      )}
    </div>
  );
};

export default AdminPanel;
