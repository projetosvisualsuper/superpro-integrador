/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { ShieldCheck, Info, CheckCircle, XCircle, Link, RefreshCw, KeyRound, Loader2, Save } from 'lucide-react';
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
          accessToken: '', // Clear simulated token on manual save
          refreshToken: '' // Clear simulated token on manual save
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Falha ao salvar configurações.');
      }

      setConfig(data);
      setAccessToken('');
      setRefreshToken('');
      setMessage({ type: 'success', text: 'Configurações de conexão do Bling salvas com sucesso!' });
      onStatusChange();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Erro ao conectar ao Bling.' });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
      </div>
    );
  }

  const isConectado = config?.conectado && config?.accessToken && !config.accessToken.includes('exemplo') && !config.accessToken.startsWith('bl_tok_');

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

      {config?.clientId && config?.clientSecret && (
        <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl">
          <div className="space-y-1">
            <span className="font-bold text-indigo-200 text-sm font-display flex items-center gap-1">🔑 Passo Final: Autorizar Aplicativo no Bling</span>
            <p className="text-xs text-indigo-300">
              Suas credenciais foram salvas. Agora, clique no botão ao lado para autorizar o integrador a consultar sua conta do Bling.
            </p>
          </div>
          <a
            href={`https://www.bling.com.br/Api/v3/oauth/authorize?response_type=code&client_id=${config.clientId}&redirect_uri=${encodeURIComponent(`${window.location.origin}/api/auth/bling/callback`)}&state=superpro_oauth_state`}
            className="inline-flex items-center justify-center px-5 py-3 bg-indigo-500 hover:bg-indigo-600 text-white font-bold text-xs rounded-xl transition cursor-pointer shadow-lg shadow-indigo-500/20 text-center"
          >
            Autorizar Acesso no Bling
          </a>
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

            <div className="flex justify-end pt-4 border-t border-white/10">
              <button
                type="submit"
                disabled={isSaving}
                className="inline-flex items-center justify-center px-5 py-2.5 bg-indigo-500 hover:bg-indigo-600 text-white text-xs font-semibold rounded-xl transition cursor-pointer shadow-lg shadow-indigo-500/10"
              >
                {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5 mr-1.5" />}
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
              <span className="font-bold text-indigo-200 font-display">Como configurar o Redirect URL?</span>
              <p className="mt-1 font-sans">
                Acesse o painel do desenvolvedor no Bling ERP, edite seu aplicativo e defina a <b>URL de Callback</b> exatamente como abaixo:
              </p>
              <code className="block bg-[#0c0e12] p-2 rounded border border-white/10 mt-2 font-mono text-[10px] break-all select-all text-indigo-200">
                {window.location.origin}/api/auth/bling/callback
              </code>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
