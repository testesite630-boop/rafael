
import React, { useState, useMemo } from 'react';
import { Delivery, DeliveryStatus } from '../types';

interface DeliveryReportsProps {
  deliveries: Delivery[];
}

type Period = 'day' | 'week' | 'month';

const DeliveryReports: React.FC<DeliveryReportsProps> = ({ deliveries }) => {
  const [period, setPeriod] = useState<Period>('day');

  const stats = useMemo(() => {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const startOfWeek = now.getTime() - 7 * 24 * 60 * 60 * 1000;
    const startOfMonth = now.getTime() - 30 * 24 * 60 * 60 * 1000;

    const threshold = period === 'day' ? startOfToday : period === 'week' ? startOfWeek : startOfMonth;

    const filtered = deliveries.filter(d => {
      const date = d.completedAt ? new Date(d.completedAt).getTime() : new Date(d.createdAt).getTime();
      return date >= threshold;
    });

    const total = filtered.length;
    const deliveredCount = filtered.filter(d => d.status === DeliveryStatus.DELIVERED).length;
    const failedCount = filtered.filter(d => d.status === DeliveryStatus.FAILED).length;
    
    const successRate = total > 0 ? (deliveredCount / (deliveredCount + failedCount || 1)) * 100 : 0;
    
    // Calcula tempo médio de entrega (em minutos) para os que foram entregues
    const completedItems = filtered.filter(d => d.status === DeliveryStatus.DELIVERED && d.completedAt);
    let avgTime = 0;
    if (completedItems.length > 0) {
      const totalTime = completedItems.reduce((acc, d) => {
        const start = new Date(d.createdAt).getTime();
        const end = new Date(d.completedAt!).getTime();
        return acc + (end - start);
      }, 0);
      avgTime = Math.round(totalTime / completedItems.length / 60000);
    }

    return {
      total,
      deliveredCount,
      failedCount,
      successRate: Math.min(100, Math.round(successRate)),
      avgTime
    };
  }, [deliveries, period]);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center pb-4 border-b border-gray-100 dark:border-gray-800">
        <h3 className="text-sm font-black uppercase text-gray-400 tracking-widest italic">Performance de Logística</h3>
        <div className="flex bg-gray-100 dark:bg-gray-800 p-1 rounded-xl">
          {(['day', 'week', 'month'] as const).map(p => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-4 py-1.5 rounded-lg text-[9px] font-black uppercase transition-all ${period === p ? 'bg-white dark:bg-gray-700 text-red-600 shadow-sm' : 'text-gray-400'}`}
            >
              {p === 'day' ? 'Hoje' : p === 'week' ? 'Semana' : 'Mês'}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Entregas */}
        <div className="bg-white dark:bg-gray-800 p-5 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm transition-theme">
          <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">Total Registrado</span>
          <div className="flex items-baseline space-x-2">
            <span className="text-3xl font-black dark:text-white">{stats.total}</span>
            <span className="text-xs font-bold text-gray-400">items</span>
          </div>
          <div className="mt-4 w-full bg-gray-100 dark:bg-gray-900 h-1.5 rounded-full overflow-hidden">
             <div className="bg-blue-500 h-full rounded-full" style={{ width: '100%' }}></div>
          </div>
        </div>

        {/* Taxa de Sucesso */}
        <div className="bg-white dark:bg-gray-800 p-5 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm transition-theme">
          <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">Taxa de Sucesso</span>
          <div className="flex items-baseline space-x-2">
            <span className={`text-3xl font-black ${stats.successRate > 80 ? 'text-emerald-500' : stats.successRate > 50 ? 'text-amber-500' : 'text-red-500'}`}>
              {stats.successRate}%
            </span>
          </div>
          <div className="mt-4 w-full bg-gray-100 dark:bg-gray-900 h-1.5 rounded-full overflow-hidden">
             <div className="bg-emerald-500 h-full rounded-full transition-all duration-1000" style={{ width: `${stats.successRate}%` }}></div>
          </div>
        </div>

        {/* Tempo Médio */}
        <div className="bg-white dark:bg-gray-800 p-5 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm transition-theme">
          <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">Tempo Médio</span>
          <div className="flex items-baseline space-x-2">
            <span className="text-3xl font-black dark:text-white">{stats.avgTime}</span>
            <span className="text-xs font-bold text-gray-400">min/entrega</span>
          </div>
          <div className="mt-4 flex items-center space-x-2">
            <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            <span className="text-[8px] font-bold text-gray-400 uppercase">Desde a criação</span>
          </div>
        </div>

        {/* Entregas vs Falhas */}
        <div className="bg-white dark:bg-gray-800 p-5 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm transition-theme">
          <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">Status Final</span>
          <div className="flex justify-between items-center">
            <div className="space-y-1">
              <div className="flex items-center space-x-1.5">
                <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                <span className="text-[10px] font-black dark:text-white">{stats.deliveredCount}</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <div className="w-2 h-2 rounded-full bg-red-500"></div>
                <span className="text-[10px] font-black dark:text-white">{stats.failedCount}</span>
              </div>
            </div>
            <div className="text-right">
               <span className="text-[9px] font-black text-gray-400 uppercase">Concluídas</span>
            </div>
          </div>
        </div>
      </div>

      {/* Gráfico Visual Simples (Barras de Comparação) */}
      <div className="bg-white dark:bg-gray-800 p-8 rounded-[2.5rem] border border-gray-100 dark:border-gray-700 shadow-sm">
        <h4 className="text-xs font-black uppercase text-gray-800 dark:text-white mb-6">Volume por Status</h4>
        <div className="space-y-6">
          <div className="space-y-2">
            <div className="flex justify-between text-[10px] font-black uppercase tracking-tighter">
              <span className="text-emerald-600">Entregues com Sucesso</span>
              <span className="dark:text-white">{stats.deliveredCount}</span>
            </div>
            <div className="w-full bg-gray-50 dark:bg-gray-900 h-4 rounded-lg overflow-hidden">
               <div className="bg-emerald-500 h-full rounded-lg transition-all duration-1000" style={{ width: `${stats.total > 0 ? (stats.deliveredCount / stats.total) * 100 : 0}%` }}></div>
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between text-[10px] font-black uppercase tracking-tighter">
              <span className="text-red-600">Falhas / Não Entregues</span>
              <span className="dark:text-white">{stats.failedCount}</span>
            </div>
            <div className="w-full bg-gray-50 dark:bg-gray-900 h-4 rounded-lg overflow-hidden">
               <div className="bg-red-500 h-full rounded-lg transition-all duration-1000" style={{ width: `${stats.total > 0 ? (stats.failedCount / stats.total) * 100 : 0}%` }}></div>
            </div>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-gray-50 dark:border-gray-700 flex flex-col md:flex-row md:items-center justify-between gap-4">
           <div>
              <p className="text-xs font-bold dark:text-gray-300 italic">"Relatórios baseados nos dados locais de entregas finalizadas."</p>
           </div>
           <button 
            onClick={() => window.print()}
            className="px-6 py-3 bg-red-600 text-white rounded-2xl text-[10px] font-black uppercase hover:bg-red-700 active:scale-95 transition-all shadow-lg shadow-red-100 dark:shadow-none"
           >
             Exportar PDF
           </button>
        </div>
      </div>
    </div>
  );
};

export default DeliveryReports;
