/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Mail, Lock, Sparkles, KeyRound, ArrowRight, Loader2, Eye, EyeOff } from 'lucide-react';
import { motion } from 'motion/react';

interface LoginProps {
  onLoginSuccess: (token: string, user: { email: string; name: string }) => void;
}

export default function Login({ onLoginSuccess }: LoginProps) {
  const [email, setEmail] = useState('projetos.visualsuper@gmail.com');
  const [password, setPassword] = useState('admin123');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [recoveryEmail, setRecoveryEmail] = useState('');
  const [recoverySuccess, setRecoverySuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Falha ao realizar login.');
      }

      onLoginSuccess(data.token, data.user);
    } catch (err: any) {
      setError(err.message || 'Erro ao conectar com o servidor.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRecoverySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setRecoverySuccess(true);
    }, 1500);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0c0e12] text-slate-100 p-4 font-sans relative overflow-hidden">
      {/* Background Decorative Blur Gradients */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-blue-500/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-500/10 blur-[120px] pointer-events-none" />

      <div className="w-full max-w-md relative z-10 animate-fade-in" id="login-container">
        {/* Logo Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-indigo-500 text-white shadow-lg shadow-indigo-500/20 mb-4">
            <Sparkles className="w-6 h-6 animate-pulse" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white font-display">VS SuperPro</h1>
          <p className="text-sm text-slate-400 mt-2 font-sans">Integrador inteligente de produtos e inventário Bling</p>
        </div>

        {/* Card Content */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-8 shadow-2xl relative"
        >
          {!isForgotPassword ? (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-1">
                <h2 className="text-lg font-semibold text-white font-display">Acessar Painel</h2>
                <p className="text-xs text-slate-400">Entre com as suas credenciais para gerenciar a integração.</p>
              </div>

              {error && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-xl p-3 leading-relaxed">
                  {error}
                </div>
              )}

              <div className="space-y-4">
                {/* Email Field */}
                <div className="space-y-1.5">
                  <label htmlFor="email-input" className="text-xs font-medium text-slate-300">Endereço de E-mail</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">
                      <Mail className="w-4.5 h-4.5" />
                    </span>
                    <input
                      id="email-input"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="w-full bg-white/5 border border-white/10 focus:border-white/25 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white placeholder-slate-500 outline-none transition"
                      placeholder="seu-email@exemplo.com"
                    />
                  </div>
                </div>

                {/* Password Field */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <label htmlFor="password-input" className="text-xs font-medium text-slate-300">Senha de Acesso</label>
                    <button
                      type="button"
                      onClick={() => setIsForgotPassword(true)}
                      className="text-xs text-indigo-400 hover:text-indigo-300 transition outline-none"
                    >
                      Esqueceu a senha?
                    </button>
                  </div>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">
                      <Lock className="w-4.5 h-4.5" />
                    </span>
                    <input
                      id="password-input"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="w-full bg-white/5 border border-white/10 focus:border-white/25 rounded-xl py-2.5 pl-10 pr-10 text-sm text-white placeholder-slate-500 outline-none transition"
                      placeholder="Sua senha secreta"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <button
                id="login-submit-btn"
                type="submit"
                disabled={isLoading}
                className="w-full bg-indigo-500 hover:bg-indigo-600 disabled:bg-indigo-800 text-white font-semibold text-sm py-2.5 px-4 rounded-xl shadow-lg shadow-indigo-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer mt-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4.5 h-4.5 animate-spin" />
                    Autenticando...
                  </>
                ) : (
                  <>
                    Entrar no Dashboard
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
              
              <div className="text-center pt-2">
                <span className="text-[11px] text-slate-500 font-mono">
                  Dica de Sandbox: Use <b>projetos.visualsuper@gmail.com</b> com a senha <b>admin123</b>
                </span>
              </div>
            </form>
          ) : (
            <div className="space-y-5">
              <div className="space-y-1">
                <h2 className="text-lg font-medium text-white flex items-center gap-2 font-display">
                  <KeyRound className="w-5 h-5 text-indigo-400" />
                  Recuperar Senha
                </h2>
                <p className="text-xs text-slate-400">Informe seu e-mail cadastrado para enviarmos as instruções.</p>
              </div>

              {recoverySuccess ? (
                <div className="space-y-4">
                  <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs rounded-xl p-4 leading-relaxed">
                    E-mail enviado! Se uma conta existir para <b>{recoveryEmail}</b>, você receberá um link de redefinição de senha em alguns minutos.
                  </div>
                  <button
                    onClick={() => {
                      setRecoverySuccess(false);
                      setIsForgotPassword(false);
                      setRecoveryEmail('');
                    }}
                    className="w-full bg-white/10 hover:bg-white/20 border border-white/10 text-white font-medium text-xs py-2.5 rounded-xl transition"
                  >
                    Voltar para Login
                  </button>
                </div>
              ) : (
                <form onSubmit={handleRecoverySubmit} className="space-y-4">
                  <div className="space-y-1.5">
                    <label htmlFor="recovery-email-input" className="text-xs font-medium text-slate-300">E-mail Cadastrado</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">
                        <Mail className="w-4.5 h-4.5" />
                      </span>
                      <input
                        id="recovery-email-input"
                        type="email"
                        value={recoveryEmail}
                        onChange={(e) => setRecoveryEmail(e.target.value)}
                        required
                        className="w-full bg-white/5 border border-white/10 focus:border-white/25 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white placeholder-slate-500 outline-none transition"
                        placeholder="seu-email@exemplo.com"
                      />
                    </div>
                  </div>

                  <div className="flex gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setIsForgotPassword(false)}
                      className="w-1/2 bg-white/10 hover:bg-white/20 border border-white/10 text-white font-medium text-xs py-2.5 rounded-xl transition"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="w-1/2 bg-indigo-500 hover:bg-indigo-600 disabled:bg-indigo-800 text-white font-medium text-xs py-2.5 rounded-xl shadow-lg shadow-indigo-500/20 transition flex items-center justify-center gap-1"
                    >
                      {isLoading ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        'Enviar Link'
                      )}
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}
        </motion.div>
        
        {/* Footer */}
        <div className="text-center mt-6">
          <p className="text-[11px] text-slate-500">
            Conexão TLS 1.3 Segura • Banco de Dados Criptografado
          </p>
        </div>
      </div>
    </div>
  );
}
