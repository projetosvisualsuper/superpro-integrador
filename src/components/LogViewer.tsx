/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Terminal, Search, Trash2, RefreshCw, AlertCircle, CheckCircle2, Shield, Settings, Activity, Loader2 } from 'lucide-react';
import { LogEntry } from '../types';

interface LogViewerProps {
  token: string;
}

export default function LogViewer({ token }: LogViewerProps) {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<string>('todos');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchLogs();
  }, [category, search]);

  const fetchLogs = async () => {
    setIsLoading(true);
    try {
      const queryParams = new URLSearchParams();
      if (category !== 'todos') queryParams.append('categoria', category);
      if (search.trim() !== '') queryParams.append('search', search);

      const response = await fetch(`/api/sync/logs?${queryParams.toString()}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setLogs(data);
      }
    } catch (err) {
      console.error('Erro ao buscar logs:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearLogs = async () => {
    if (!confirm('Deseja realmente limpar todos os produtos e redefinir o banco de dados? Isso apagará também o histórico e logs de simulação.')) {
      return;
    }
    try {
      const response = await fetch('/api/sync/reset', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        fetchLogs();
      }
    } catch (err) {
      console.error('Erro ao redefinir logs:', err);
    }
  };

  const getCategoryBadge = (cat: LogEntry['categoria']) => {
    switch (cat) {
      case 'auth':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[10px] font-mono">
            <Shield className="w-3 h-3" />
            AUTH
          </span>
        );
      case 'bling':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[10px] font-mono">
            <Settings className="w-3 h-3" />
            BLING
          </span>
        );
      case 'sheets':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-mono">
            <CheckCircle2 className="w-3 h-3" />
            SHEETS
          </span>
        );
      case 'error':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-red-500/10 border border-red-500/20 text-red-400 text-[10px] font-mono">
            <AlertCircle className="w-3 h-3" />
            ERRO
          </span>
        );
      case 'performance':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[10px] font-mono">
            <Activity className="w-3 h-3" />
            PERF
          </span>
        );
    }
  };

  const categories = [
    { value: 'todos', label: 'Todos os Logs' },
    { value: 'auth', label: 'Autenticação' },
    { value: 'bling', label: 'Bling ERP' },
    { value: 'sheets', label: 'Planilhas' },
    { value: 'performance', label: 'Performance' },
    { value: 'error', label: 'Erros' }
  ];

  return (
    <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6 space-y-4 shadow-xl" id="logs-panel">
      {/* Header controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/10">
        <div className="space-y-0.5">
          <h2 className="text-sm font-bold text-white flex items-center gap-2 font-display">
            <Terminal className="w-4.5 h-4.5 text-indigo-400" />
            Logs de Sincronização e Sistema
          </h2>
          <p className="text-xs text-slate-400">
            Monitoramento de requisições de API, tokens, autenticação e tempo de execução.
          </p>
        </div>
        <div className="flex items-center gap-2 self-stretch sm:self-auto">
          <button
            onClick={fetchLogs}
            className="p-2 hover:bg-white/5 border border-white/10 rounded-xl text-slate-400 hover:text-white transition cursor-pointer"
            title="Recarregar logs"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={handleClearLogs}
            className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 text-xs font-semibold rounded-xl transition cursor-pointer"
            title="Zerar banco de dados"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Zerar Banco
          </button>
        </div>
      </div>

      {/* Filters & Search Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="md:col-span-2 relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">
            <Search className="w-4 h-4" />
          </span>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Pesquisar mensagens nos logs..."
            className="w-full bg-white/5 border border-white/10 focus:border-white/20 rounded-xl py-2.5 pl-9 pr-4 text-xs text-slate-100 outline-none transition placeholder-slate-500"
          />
        </div>

        <div className="flex gap-1.5 overflow-x-auto pb-1 md:pb-0">
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full bg-[#0a0c10]/60 border border-white/10 focus:border-white/20 text-xs text-slate-200 rounded-xl p-2.5 outline-none transition cursor-pointer"
          >
            {categories.map((cat) => (
              <option key={cat.value} value={cat.value} className="bg-[#0c0e12] text-slate-200">
                {cat.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Terminal View */}
      <div className="bg-[#07090d]/80 rounded-2xl border border-white/10 p-5 font-mono text-[11px] h-[340px] overflow-y-auto space-y-2.5 leading-relaxed custom-scrollbar">
        {isLoading ? (
          <div className="flex items-center justify-center h-full gap-2 text-slate-500">
            <Loader2 className="w-4 h-4 animate-spin text-indigo-400" />
            Carregando log de eventos...
          </div>
        ) : logs.length > 0 ? (
          logs.map((log) => {
            const time = new Date(log.timestamp).toLocaleTimeString('pt-BR');
            return (
              <div key={log.id} className="flex items-start gap-3 border-b border-white/5 pb-2 last:border-0 hover:bg-white/5 px-2 py-1 rounded-lg transition">
                <span className="text-slate-500 select-none shrink-0">{time}</span>
                <span className="shrink-0">{getCategoryBadge(log.categoria)}</span>
                <div className="space-y-0.5 min-w-0 flex-1">
                  <span className={`${
                    log.categoria === 'error' ? 'text-red-400' : 
                    log.categoria === 'performance' ? 'text-amber-300' : 
                    log.categoria === 'sheets' ? 'text-emerald-300' : 'text-slate-300'
                  } break-words block`}>
                    {log.mensagem}
                  </span>
                  {log.detalhes && (
                    <div className="text-slate-500 text-[10px] pl-2.5 border-l border-white/10 break-words mt-1">
                      {log.detalhes}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        ) : (
          <div className="flex items-center justify-center h-full text-slate-600">
            Nenhum evento registrado com as diretrizes atuais.
          </div>
        )}
      </div>

      {/* Info indicator */}
      <div className="flex justify-between text-[10px] text-slate-500 font-mono">
        <span>Fuso Horário: Local (America/Sao_Paulo)</span>
        <span>Mostrando {logs.length} registros</span>
      </div>
    </div>
  );
}
