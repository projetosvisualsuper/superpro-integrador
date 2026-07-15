/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { RefreshCw, Play, Clock, ArrowUpRight, CheckCircle2, AlertCircle, Database, Server, Calendar, Loader2 } from 'lucide-react';
import { SyncHistoryEntry, DashboardStats } from '../types';

interface DashboardViewProps {
  token: string;
  onNavigateToBling: () => void;
  onNavigateToSheets: () => void;
}

export default function DashboardView({ token, onNavigateToBling, onNavigateToSheets }: DashboardViewProps) {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [history, setHistory] = useState<SyncHistoryEntry[]>([]);
  const [progress, setProgress] = useState<{
    status: 'idle' | 'sincronizando' | 'sucesso' | 'erro';
    current: number;
    total: number;
    percentage: number;
    message: string;
  }>({
    status: 'idle',
    current: 0,
    total: 0,
    percentage: 0,
    message: ''
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isStartingSync, setIsStartingSync] = useState(false);

  // Polling interval ID
  const [pollingActive, setPollingActive] = useState(false);

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (pollingActive) {
      interval = setInterval(() => {
        pollProgress();
      }, 500);
    }
    return () => clearInterval(interval);
  }, [pollingActive]);

  const fetchInitialData = async () => {
    setIsLoading(true);
    try {
      await Promise.all([
        fetchStats(),
        fetchHistory(),
        checkCurrentProgress()
      ]);
    } catch (err) {
      console.error('Erro ao buscar dados iniciais:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const dbRes = await fetch('/api/products', { headers: { Authorization: `Bearer ${token}` } });
      const configBlingRes = await fetch('/api/config/bling', { headers: { Authorization: `Bearer ${token}` } });
      const configSheetsRes = await fetch('/api/config/sheets', { headers: { Authorization: `Bearer ${token}` } });
      const historyRes = await fetch('/api/sync/history', { headers: { Authorization: `Bearer ${token}` } });

      const products = await dbRes.json();
      const bling = await configBlingRes.json();
      const sheets = await configSheetsRes.json();
      const hist = await historyRes.json();

      const lastSuccess = hist.find((h: SyncHistoryEntry) => h.status === 'Sucesso');

      setStats({
        blingConectado: bling.conectado && bling.accessToken !== '',
        sheetsConectado: sheets.conectado,
        ultimaSincronizacao: lastSuccess ? `${lastSuccess.data} às ${lastSuccess.hora}` : 'Nenhuma',
        quantidadeProdutos: products.length,
        duracaoUltimaSincronizacao: lastSuccess ? lastSuccess.duracaoMs : 0
      });
    } catch (err) {
      console.error('Erro ao buscar estatísticas:', err);
    }
  };

  const fetchHistory = async () => {
    try {
      const response = await fetch('/api/sync/history', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setHistory(data);
      }
    } catch (err) {
      console.error('Erro ao buscar histórico:', err);
    }
  };

  const checkCurrentProgress = async () => {
    try {
      const response = await fetch('/api/sync/progress', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setProgress(data);
        if (data.status === 'sincronizando') {
          setPollingActive(true);
        }
      }
    } catch (err) {
      console.error('Erro ao checar progresso:', err);
    }
  };

  const pollProgress = async () => {
    try {
      const response = await fetch('/api/sync/progress', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setProgress(data);
        
        if (data.status !== 'sincronizando') {
          setPollingActive(false);
          // Refresh statistics and history when sync is complete
          fetchStats();
          fetchHistory();
        }
      }
    } catch (err) {
      console.error('Erro no polling do progresso:', err);
      setPollingActive(false);
    }
  };

  const [isAbortingSync, setIsAbortingSync] = useState(false);

  const handleStartSync = async () => {
    if (progress.status === 'sincronizando') return;
    
    setIsStartingSync(true);
    try {
      const response = await fetch('/api/sync/start', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Erro ao iniciar sincronização.');
      }

      setProgress({
        status: 'sincronizando',
        current: 0,
        total: 840,
        percentage: 0,
        message: 'Conectando ao ERP Bling...'
      });
      setPollingActive(true);
    } catch (err: any) {
      alert(err.message || 'Falha ao iniciar sincronização.');
    } finally {
      setIsStartingSync(false);
    }
  };

  const handleAbortSync = async () => {
    if (!window.confirm('Tem certeza que deseja abortar a sincronização atual?')) return;
    setIsAbortingSync(true);
    try {
      const response = await fetch('/api/sync/abort', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setProgress(data);
        setPollingActive(false);
        fetchStats();
        fetchHistory();
      } else {
        alert('Falha ao abortar a sincronização.');
      }
    } catch (err) {
      console.error('Erro ao abortar:', err);
      alert('Erro ao tentar abortar a sincronização.');
    } finally {
      setIsAbortingSync(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
      </div>
    );
  }

  const formatDuration = (ms: number) => {
    if (!ms) return '0s';
    return `${(ms / 1000).toFixed(1)}s`;
  };

  return (
    <div className="space-y-6" id="dashboard-view-panel">
      {/* Overview header */}
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-2">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white mb-1 font-display">Cockpit de Sincronização</h1>
          <p className="text-xs text-slate-400">Monitore a integração entre o Bling ERP e a planilha virtual em tempo real.</p>
        </div>
      </header>

      {/* INTEGRATION STATUS BENTO GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Status Card 1: Bling ERP */}
        <div className="bg-white/5 backdrop-blur-md border border-white/10 p-5 rounded-2xl flex items-center gap-4 hover:border-white/20 transition-all duration-300 shadow-xl">
          <div className={`p-3 rounded-xl ${stats?.blingConectado ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
            <Server className="w-5 h-5" />
          </div>
          <div className="space-y-0.5">
            <span className="text-[10px] uppercase text-slate-400 font-semibold tracking-wider font-display block">ERP Bling</span>
            <div className="flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${stats?.blingConectado ? 'bg-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.5)] animate-pulse' : 'bg-red-400 shadow-[0_0_8px_rgba(239,68,68,0.5)]'}`} />
              <span className="text-xs font-semibold text-slate-200">{stats?.blingConectado ? 'Conectado' : 'Desconectado'}</span>
            </div>
            <button onClick={onNavigateToBling} className="text-[10px] text-indigo-400 hover:text-indigo-300 transition block text-left cursor-pointer">
              Configurar conexões →
            </button>
          </div>
        </div>

        {/* Status Card 2: Google Sheets */}
        <div className="bg-white/5 backdrop-blur-md border border-white/10 p-5 rounded-2xl flex items-center gap-4 hover:border-white/20 transition-all duration-300 shadow-xl">
          <div className={`p-3 rounded-xl ${stats?.sheetsConectado ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
            <Database className="w-5 h-5" />
          </div>
          <div className="space-y-0.5">
            <span className="text-[10px] uppercase text-slate-400 font-semibold tracking-wider font-display block">Google Sheets</span>
            <div className="flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${stats?.sheetsConectado ? 'bg-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.5)] animate-pulse' : 'bg-red-400 shadow-[0_0_8px_rgba(239,68,68,0.5)]'}`} />
              <span className="text-xs font-semibold text-slate-200">{stats?.sheetsConectado ? 'Planilha Ativa' : 'Desconectado'}</span>
            </div>
            <button onClick={onNavigateToSheets} className="text-[10px] text-emerald-400 hover:text-emerald-300 transition block text-left cursor-pointer">
              Ver planilha virtual →
            </button>
          </div>
        </div>

        {/* Status Card 3: Products Counter */}
        <div className="bg-white/5 backdrop-blur-md border border-white/10 p-5 rounded-2xl flex items-center gap-4 hover:border-white/20 transition-all duration-300 shadow-xl">
          <div className="p-3 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
            <Calendar className="w-5 h-5" />
          </div>
          <div className="space-y-0.5">
            <span className="text-[10px] uppercase text-slate-400 font-semibold tracking-wider font-display block">Produtos Sincronizados</span>
            <span className="text-lg font-bold text-white block leading-none font-display">{stats?.quantidadeProdutos.toLocaleString('pt-BR')}</span>
            <span className="text-[10px] text-slate-400 block mt-0.5">Duração: {formatDuration(stats?.duracaoUltimaSincronizacao || 0)}</span>
          </div>
        </div>

        {/* Status Card 4: Last Sync Date */}
        <div className="bg-white/5 backdrop-blur-md border border-white/10 p-5 rounded-2xl flex items-center gap-4 hover:border-white/20 transition-all duration-300 shadow-xl">
          <div className="p-3 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <Clock className="w-5 h-5" />
          </div>
          <div className="space-y-0.5 max-w-[150px]">
            <span className="text-[10px] uppercase text-slate-400 font-semibold tracking-wider font-display block">Última Sincronização</span>
            <span className="text-xs font-semibold text-slate-200 block truncate" title={stats?.ultimaSincronizacao}>{stats?.ultimaSincronizacao}</span>
            <span className="text-[10px] text-slate-400 block mt-0.5">Fila de Webhooks</span>
          </div>
        </div>
      </div>

      {/* CORE INTEGRATION ACTION HERO BAR */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sync trigger and progress */}
        <div className="lg:col-span-2 bg-white/5 backdrop-blur-md border border-white/10 rounded-3xl p-8 flex flex-col justify-between shadow-2xl relative overflow-hidden">
          {/* Background overlay lights */}
          <div className="absolute top-[-40%] right-[-10%] w-[60%] h-[60%] rounded-full bg-indigo-500/10 blur-[100px] pointer-events-none" />

          <div className="space-y-2 relative z-10">
            <h3 className="text-lg font-bold text-white font-display">Sincronizador Manual de Produtos</h3>
            <p className="text-xs text-slate-300 leading-relaxed max-w-lg">
              Clique no botão abaixo para buscar os produtos cadastrados na API do Bling. O sistema realizará a paginação completa de 100% dos registros, limpará os dados anteriores da planilha virtual e gravará os produtos atualizados com todos os metadados fiscais, estoques e dimensões.
            </p>
          </div>

          {/* Sync Trigger CTA */}
          <div className="my-8 flex flex-col sm:flex-row items-center gap-4 relative z-10">
            <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
              <button
                onClick={handleStartSync}
                disabled={progress.status === 'sincronizando' || isStartingSync}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-indigo-500 hover:bg-indigo-600 disabled:bg-indigo-800 text-white font-semibold text-sm tracking-wide rounded-xl shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/35 transition-all cursor-pointer font-sans"
              >
                {progress.status === 'sincronizando' ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Sincronizando...
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 fill-current" />
                    Atualizar Produtos
                  </>
                )}
              </button>

              {progress.status === 'sincronizando' && (
                <button
                  onClick={handleAbortSync}
                  disabled={isAbortingSync}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-red-500/25 hover:bg-red-500/35 text-red-400 border border-red-500/30 font-semibold text-sm tracking-wide rounded-xl transition-all cursor-pointer disabled:opacity-50 font-sans"
                >
                  {isAbortingSync ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Abortando...
                    </>
                  ) : (
                    'Abortar Processo'
                  )}
                </button>
              )}
            </div>

            <div className="text-xs text-slate-400 font-mono text-center sm:text-left">
              <span>Webhook Endpoint Ativo:</span>
              <span className="block text-indigo-400 text-[10px] select-all bg-[#0a0c10]/60 backdrop-blur-sm px-2.5 py-1 rounded-lg border border-white/10 mt-1 font-mono">
                POST /webhook/update-products
              </span>
            </div>
          </div>

          {/* Animated Progress Bar */}
          {progress.status === 'sincronizando' && (
            <div className="space-y-2 border-t border-white/10 pt-5 relative z-10">
              <div className="flex items-center justify-between text-xs font-medium text-slate-200">
                <span className="flex items-center gap-1.5 text-indigo-400 font-mono">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse"></span>
                  {progress.message}
                </span>
                <span className="font-mono text-indigo-300">
                  {progress.current.toLocaleString('pt-BR')} / {progress.total.toLocaleString('pt-BR')} ({progress.percentage}%)
                </span>
              </div>
              
              {/* Progress Container */}
              <div className="w-full h-3 bg-white/5 rounded-full overflow-hidden border border-white/5">
                <div 
                  className="h-full bg-gradient-to-r from-indigo-600 to-indigo-400 transition-all duration-300 ease-out rounded-full shadow-[0_0_12px_rgba(99,102,241,0.3)]"
                  style={{ width: `${progress.percentage}%` }}
                />
              </div>
            </div>
          )}

          {progress.status === 'sucesso' && (
            <div className="bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-xl flex items-center gap-2.5 text-xs text-emerald-400 relative z-10">
              <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-400" />
              <span>Sincronização concluída: <b>{progress.current} produtos</b> foram importados com sucesso!</span>
            </div>
          )}

          {progress.status === 'erro' && (
            <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-xl flex items-center gap-2.5 text-xs text-red-400 relative z-10">
              <AlertCircle className="w-5 h-5 shrink-0 text-red-400" />
              <span className="truncate">Erro: {progress.message}</span>
            </div>
          )}
        </div>

        {/* Short integration tips */}
        <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6 flex flex-col justify-between shadow-xl">
          <div className="space-y-4">
            <h4 className="text-xs font-bold uppercase text-slate-400 tracking-wider flex items-center gap-1.5 font-display">
              <Database className="w-4 h-4 text-indigo-400" />
              Metadados do Bling Extraídos
            </h4>
            
            <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-[11px] text-slate-300">
              <div className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-indigo-500" /> Código / SKU</div>
              <div className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-indigo-500" /> Unidade / Situação</div>
              <div className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-indigo-500" /> NCM / GTIN</div>
              <div className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-indigo-500" /> Categoria / Marca</div>
              <div className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-indigo-500" /> Preço Regular</div>
              <div className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-indigo-500" /> Estoque Atual</div>
              <div className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-indigo-500" /> Peso Líquido</div>
              <div className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-indigo-500" /> Dimensões (AxLxC)</div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-white/10 text-[10px] text-slate-500 leading-relaxed font-mono">
            Seu Bling ERP atualizará automaticamente esta planilha virtual local sempre que houver requisições de webhooks disparadas por ERP externo.
          </div>
        </div>
      </div>

      {/* SYNCHRONIZATION HISTORY TABLE */}
      <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6 space-y-4 shadow-xl">
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <h3 className="text-sm font-bold text-white font-display">Histórico de Operações</h3>
          <span className="text-[10px] bg-white/5 text-slate-400 border border-white/10 px-2.5 py-1 rounded-lg font-mono">
            Últimos registros
          </span>
        </div>

        <div className="overflow-x-auto border border-white/10 rounded-xl bg-white/5">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-white/10 bg-white/5 text-slate-400 font-semibold text-[10px] tracking-wider uppercase">
                <th className="px-5 py-3">DATA / HORA</th>
                <th className="px-5 py-3">USUÁRIO AUTOR</th>
                <th className="px-5 py-3 text-right">PRODUTOS IMPORTADOS</th>
                <th className="px-5 py-3 text-right">TEMPO DE EXECUÇÃO</th>
                <th className="px-5 py-3 text-center">STATUS</th>
                <th className="px-5 py-3">MENSAGEM / DETALHES DE ERRO</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {history.length > 0 ? (
                history.map((h) => (
                  <tr key={h.id} className="hover:bg-white/5 text-slate-300 transition-colors">
                    <td className="px-5 py-3 font-mono text-[11px] text-slate-400 whitespace-nowrap">
                      {h.data} às {h.hora}
                    </td>
                    <td className="px-5 py-3 font-medium whitespace-nowrap">{h.usuario}</td>
                    <td className="px-5 py-3 text-right font-mono font-medium text-slate-200">
                      {h.status === 'Sucesso' ? h.quantidadeProdutos.toLocaleString('pt-BR') : '-'}
                    </td>
                    <td className="px-5 py-3 text-right font-mono text-slate-400">
                      {formatDuration(h.duracaoMs)}
                    </td>
                    <td className="px-5 py-3 text-center whitespace-nowrap">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase border ${
                        h.status === 'Sucesso'
                          ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                          : 'bg-red-500/10 border-red-500/20 text-red-400'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${h.status === 'Sucesso' ? 'bg-emerald-400' : 'bg-red-400'}`} />
                        {h.status}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-slate-400 text-[11px] truncate max-w-xs" title={h.mensagemErro || 'Nenhuma anormalidade'}>
                      {h.mensagemErro || <span className="text-slate-600 font-normal">—</span>}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-5 py-8 text-center text-slate-500 text-xs">
                    Nenhuma sincronização registrada até o momento.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
