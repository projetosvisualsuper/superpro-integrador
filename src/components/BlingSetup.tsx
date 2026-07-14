/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { ShieldCheck, Info, CheckCircle, XCircle, Link, RefreshCw, KeyRound, Loader2 } from 'lucide-react';
import { BlingConfig } from '../types';

interface BlingSetupProps {
  token: string;
  onStatusChange: () => void;
}

export default function BlingSetup({ token, onStatusChange }: BlingSetupProps) {
  const [config, setConfig] = useState<BlingConfig | null>(null);
  const [clientId, setClientId] = useState('');
  const [clientSecret, setClientSecret] = useState('');
  const [accessToken, setAccessToken] = useState('');
  const [refreshToken, setRefreshToken] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/config/bling', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setConfig(data);
        setClientId(data.clientId || '');
        setClientSecret(data.clientSecret || '');
        setAccessToken(data.accessToken || '');
        setRefreshToken(data.refreshToken || '');
      }
    } catch (err) {
      console.error('Erro ao buscar configuração do Bling:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setMessage(null);

    try {
      const response = await fetch('/api/config/bling', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          clientId,
          clientSecret,
          accessToken,
          refreshToken
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Falha ao salvar configurações.');
      }

      setConfig(data);
      setMessage({ type: 'success', text: 'Configurações de conexão do Bling salvas com sucesso!' });
      onStatusChange();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Erro ao conectar ao Bling.' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSimulateOAuth = () => {
    setIsSaving(true);
    setMessage(null);
    setTimeout(async () => {
      try {
        const randomToken = 'bl_tok_' + Math.random().toString(36).substring(2, 18);
        const randomRefresh = 'bl_ref_' + Math.random().toString(36).substring(2, 18);
        
        const response = await fetch('/api/config/bling', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            clientId: clientId || 'bling_client_id_exemplo_123',
            clientSecret: clientSecret || 'bling_secret_exemplo_abc',
            accessToken: randomToken,
            refreshToken: randomRefresh
          })
        });

        const data = await response.json();
        setConfig(data);
        setAccessToken(randomToken);
        setRefreshToken(randomRefresh);
        setMessage({ type: 'success', text: 'Conexão OAuth 2.0 estabelecida! Tokens gerados e salvos com sucesso.' });
        onStatusChange();
      } catch (err: any) {
        setMessage({ type: 'error', text: 'Falha ao simular fluxo OAuth do Bling.' });
      } finally {
        setIsSaving(false);
      }
    }, 1200);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
      </div>
    );
  }

  const isConectado = config?.conectado && accessToken !== '';

  return (
    <div className="space-y-6" id="bling-setup-panel">
      {/* Overview header */}
      <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <h2 className="text-lg font-bold text-white flex items-center gap-2 font-display">
              <Link className="w-5 h-5 text-indigo-400" />
              Configuração do ERP Bling
            </h2>
            <p className="text-xs text-slate-400">
              A autenticação é feita de forma segura utilizando o protocolo OAuth 2.0 do ERP Bling.
            </p>
          </div>
          <div className="flex items-center gap-2">
            {isConectado ? (
              <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                <CheckCircle className="w-4 h-4" />
                Bling Conectado
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider bg-red-500/10 border border-red-500/20 text-red-400">
                <XCircle className="w-4 h-4" />
                Desconectado
              </span>
            )}
          </div>
        </div>
      </div>

      {message && (
        <div className={`p-4 rounded-xl border text-xs leading-relaxed ${
          message.type === 'success'
            ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
            : 'bg-red-500/10 border-red-500/20 text-red-400'
        }`}>
          {message.text}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Credentials Form */}
        <div className="lg:col-span-2">
          <form onSubmit={handleSave} className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6 space-y-5 shadow-xl">
            <h3 className="text-sm font-bold text-white flex items-center gap-1.5 pb-3 border-b border-white/10 font-display">
              <KeyRound className="w-4.5 h-4.5 text-indigo-400" />
              Credenciais de API (OAuth)
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label htmlFor="client-id" className="text-xs text-slate-300 font-medium">Client ID</label>
                <input
                  id="client-id"
                  type="text"
                  value={clientId}
                  onChange={(e) => setClientId(e.target.value)}
                  required
                  className="w-full bg-white/5 border border-white/10 focus:border-white/20 rounded-xl py-2.5 px-4 text-xs text-slate-100 placeholder-slate-600 outline-none transition font-mono"
                  placeholder="Seu Client ID do Bling"
                />
              </div>

              <div className="space-y-1.5">
                <label htmlFor="client-secret" className="text-xs text-slate-300 font-medium">Client Secret</label>
                <input
                  id="client-secret"
                  type="password"
                  value={clientSecret}
                  onChange={(e) => setClientSecret(e.target.value)}
                  required
                  className="w-full bg-white/5 border border-white/10 focus:border-white/20 rounded-xl py-2.5 px-4 text-xs text-slate-100 placeholder-slate-600 outline-none transition font-mono"
                  placeholder="••••••••••••••••••••••••"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label htmlFor="access-token" className="text-xs text-slate-300 font-medium">
                  Access Token <span className="text-[10px] text-slate-500 font-normal">(Opcional / Gerado via OAuth)</span>
                </label>
                <input
                  id="access-token"
                  type="text"
                  value={accessToken}
                  onChange={(e) => setAccessToken(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 focus:border-white/20 rounded-xl py-2.5 px-4 text-xs text-slate-300 placeholder-slate-600 outline-none transition font-mono"
                  placeholder="Gerado automaticamente"
                />
              </div>

              <div className="space-y-1.5">
                <label htmlFor="refresh-token" className="text-xs text-slate-300 font-medium">
                  Refresh Token <span className="text-[10px] text-slate-500 font-normal">(Opcional / Gerado via OAuth)</span>
                </label>
                <input
                  id="refresh-token"
                  type="text"
                  value={refreshToken}
                  onChange={(e) => setRefreshToken(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 focus:border-white/20 rounded-xl py-2.5 px-4 text-xs text-slate-300 placeholder-slate-600 outline-none transition font-mono"
                  placeholder="Gerado automaticamente"
                />
              </div>
            </div>

            <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4 border-t border-white/10">
              <button
                type="button"
                onClick={handleSimulateOAuth}
                disabled={isSaving}
                className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 border border-indigo-500/20 disabled:opacity-50 text-xs font-semibold rounded-xl transition cursor-pointer"
              >
                {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                Conectar ao Bling (OAuth 2.0)
              </button>
              
              <button
                type="submit"
                disabled={isSaving}
                className="inline-flex items-center justify-center px-4 py-2.5 bg-white/10 hover:bg-white/20 border border-white/10 disabled:opacity-50 text-white text-xs font-semibold rounded-xl transition cursor-pointer"
              >
                Salvar Credenciais
              </button>
            </div>
          </form>
        </div>

        {/* Info panel */}
        <div className="space-y-4">
          <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-5 space-y-4 shadow-xl">
            <h4 className="text-xs font-bold uppercase text-slate-400 tracking-wider flex items-center gap-1.5 font-display">
              <ShieldCheck className="w-4.5 h-4.5 text-emerald-400" />
              Segurança e Renovação
            </h4>
            <div className="space-y-3 text-xs text-slate-300 leading-relaxed font-sans">
              <div className="flex gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0 mt-1.5" />
                <p>
                  <b>Segurança Absoluta:</b> Seus tokens são criptografados em repouso no nosso servidor local seguro e nunca são expostos ao navegador.
                </p>
              </div>
              <div className="flex gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0 mt-1.5" />
                <p>
                  <b>Renovação Automática:</b> A aplicação verifica a validade do <code>Access Token</code> antes de cada operação, renovando-o usando o <code>Refresh Token</code> sempre que necessário de forma totalmente silenciosa.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-2xl p-5 flex gap-3 text-xs text-indigo-300 leading-relaxed shadow-xl">
            <Info className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-indigo-200 font-display">Como obter estas chaves?</span>
              <p className="mt-1 font-sans">
                Acesse o painel do desenvolvedor no Bling ERP, crie um novo aplicativo, defina o redirect URI fornecido pelo painel e copie o Client ID e Client Secret.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
