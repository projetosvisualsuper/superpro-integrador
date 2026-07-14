/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { User, Plus, Trash2, Lock, Mail, UserCheck, Loader2, Users } from 'lucide-react';

interface UsersSetupProps {
  token: string;
  currentUserEmail?: string;
}

interface UserAccount {
  name: string;
  email: string;
}

export default function UsersSetup({ token, currentUserEmail }: UsersSetupProps) {
  const [users, setUsers] = useState<UserAccount[]>([]);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/users', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setUsers(data);
      } else {
        throw new Error('Falha ao carregar lista de usuários.');
      }
    } catch (err: any) {
      console.error(err);
      setMessage({ type: 'error', text: err.message || 'Erro ao carregar usuários.' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAdding(true);
    setMessage(null);

    try {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ name, email, password })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Erro ao criar usuário.');
      }

      setUsers(prev => [...prev, { name: data.name, email: data.email }]);
      setName('');
      setEmail('');
      setPassword('');
      setMessage({ type: 'success', text: 'Usuário cadastrado com sucesso!' });
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Falha ao adicionar usuário.' });
    } finally {
      setIsAdding(false);
    }
  };

  const handleDeleteUser = async (emailToDelete: string) => {
    if (emailToDelete === currentUserEmail) {
      setMessage({ type: 'error', text: 'Você não pode excluir o seu próprio usuário logado.' });
      return;
    }
    if (!window.confirm(`Tem certeza de que deseja excluir o acesso de "${emailToDelete}"?`)) {
      return;
    }

    setIsDeleting(emailToDelete);
    setMessage(null);

    try {
      const response = await fetch(`/api/users/${encodeURIComponent(emailToDelete)}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Erro ao excluir usuário.');
      }

      setUsers(prev => prev.filter(u => u.email !== emailToDelete));
      setMessage({ type: 'success', text: 'Usuário excluído com sucesso!' });
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Falha ao deletar usuário.' });
    } finally {
      setIsDeleting(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6" id="users-setup-panel">
      {/* Header */}
      <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-xl">
            <Users className="w-6 h-6 text-indigo-400" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white font-display">Gestão de Usuários</h2>
            <p className="text-xs text-slate-400">Gerencie quem tem acesso ao painel do integrador.</p>
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
        {/* Add User Form */}
        <div className="lg:col-span-1">
          <form onSubmit={handleAddUser} className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-5 space-y-4 sticky top-4 shadow-xl">
            <h3 className="text-xs font-bold uppercase text-slate-400 tracking-wider flex items-center gap-1.5 pb-2.5 border-b border-white/10 font-display">
              <Plus className="w-4.5 h-4.5 text-indigo-400" />
              Novo Usuário
            </h3>

            <div className="space-y-1.5">
              <label htmlFor="user-name" className="text-xs text-slate-300 font-medium">Nome Completo</label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500">
                  <User className="w-4 h-4" />
                </span>
                <input
                  id="user-name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="w-full bg-white/5 border border-white/10 focus:border-white/20 rounded-xl py-2 pl-10 pr-4 text-xs text-slate-100 placeholder-slate-600 outline-none transition"
                  placeholder="Ex: João Silva"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="user-email" className="text-xs text-slate-300 font-medium">E-mail de Acesso</label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500">
                  <Mail className="w-4 h-4" />
                </span>
                <input
                  id="user-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full bg-white/5 border border-white/10 focus:border-white/20 rounded-xl py-2 pl-10 pr-4 text-xs text-slate-100 placeholder-slate-600 outline-none transition"
                  placeholder="Ex: joao@empresa.com"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="user-password" className="text-xs text-slate-300 font-medium">Senha</label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500">
                  <Lock className="w-4 h-4" />
                </span>
                <input
                  id="user-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full bg-white/5 border border-white/10 focus:border-white/20 rounded-xl py-2 pl-10 pr-4 text-xs text-slate-100 placeholder-slate-600 outline-none transition"
                  placeholder="Defina uma senha"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isAdding}
              className="w-full inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-indigo-500 hover:bg-indigo-600 text-white font-semibold disabled:opacity-50 text-xs rounded-xl transition-all cursor-pointer shadow-lg shadow-indigo-500/10"
            >
              {isAdding ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
              Adicionar Usuário
            </button>
          </form>
        </div>

        {/* Users List */}
        <div className="lg:col-span-2 bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6 space-y-4 shadow-xl">
          <h3 className="text-sm font-bold text-white flex items-center gap-1.5 pb-3 border-b border-white/10 font-display">
            <UserCheck className="w-4.5 h-4.5 text-indigo-400" />
            Usuários com Acesso ({users.length})
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {users.map((u) => {
              const isSelf = u.email === currentUserEmail;
              return (
                <div key={u.email} className="bg-white/5 border border-white/5 hover:border-white/10 rounded-xl p-4 flex items-center justify-between transition gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center flex-shrink-0">
                      <span className="font-bold text-indigo-400 text-sm font-display">
                        {u.name.substring(0, 2).toUpperCase()}
                      </span>
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-slate-100 flex items-center gap-1.5 truncate font-display">
                        {u.name}
                        {isSelf && (
                          <span className="px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-400 text-[8px] font-bold uppercase tracking-wider">
                            Você
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-slate-400 truncate">{u.email}</div>
                    </div>
                  </div>

                  {!isSelf && (
                    <button
                      onClick={() => handleDeleteUser(u.email)}
                      disabled={isDeleting === u.email}
                      className="p-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 hover:border-red-500/30 text-red-400 rounded-xl transition cursor-pointer"
                      title="Excluir Usuário"
                    >
                      {isDeleting === u.email ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Trash2 className="w-3.5 h-3.5" />
                      )}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
