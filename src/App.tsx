/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  LayoutDashboard, 
  Link, 
  FileSpreadsheet, 
  Terminal, 
  LogOut, 
  Sun, 
  Moon, 
  Menu, 
  X,
  Server,
  Database,
  User,
  ShieldAlert
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Login from './components/Login';
import DashboardView from './components/DashboardView';
import BlingSetup from './components/BlingSetup';
import SheetsSetup from './components/SheetsSetup';
import LogViewer from './components/LogViewer';
import UsersSetup from './components/UsersSetup';

export default function App() {
  // Authentication states
  const [token, setToken] = useState<string | null>(localStorage.getItem('bling_sync_token'));
  const [user, setUser] = useState<{ email: string; name: string } | null>(null);
  
  // View states: 'dashboard' | 'bling' | 'sheets' | 'logs'
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  
  // UI states
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [navMetrics, setNavMetrics] = useState({ bling: false, sheets: false });

  // Load user profile on startup if token exists
  useEffect(() => {
    if (token) {
      // Decode user from mock token (email)
      setUser({
        email: token,
        name: 'Administrador'
      });
      fetchIntegrationStatus();
    }
  }, [token]);

  // Handle browser theme changes
  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [theme]);

  const fetchIntegrationStatus = async () => {
    try {
      const blingRes = await fetch('/api/config/bling', { headers: { Authorization: `Bearer ${token}` } });
      const sheetsRes = await fetch('/api/config/sheets', { headers: { Authorization: `Bearer ${token}` } });
      if (blingRes.ok && sheetsRes.ok) {
        const bling = await blingRes.json();
        const sheets = await sheetsRes.json();
        setNavMetrics({
          bling: bling.conectado && bling.accessToken !== '',
          sheets: sheets.conectado
        });
      }
    } catch (err) {
      console.error('Erro ao buscar status de navegação:', err);
    }
  };

  const handleLoginSuccess = (newToken: string, newUser: { email: string; name: string }) => {
    localStorage.setItem('bling_sync_token', newToken);
    setToken(newToken);
    setUser(newUser);
    fetchIntegrationStatus();
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
    } catch (err) {
      console.error(err);
    } finally {
      localStorage.removeItem('bling_sync_token');
      setToken(null);
      setUser(null);
    }
  };

  // Switch tab and close mobile drawer
  const navigateTo = (tab: string) => {
    setActiveTab(tab);
    setIsMobileMenuOpen(false);
  };

  if (!token) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  const navigationItems = [
    { id: 'dashboard', label: 'Painel Geral', icon: LayoutDashboard },
    { id: 'bling', label: 'ERP Bling', icon: Link, status: navMetrics.bling },
    { id: 'sheets', label: 'Planilha Virtual', icon: FileSpreadsheet, status: navMetrics.sheets },
    { id: 'logs', label: 'Logs de Eventos', icon: Terminal },
    { id: 'usuarios', label: 'Usuários', icon: User }
  ];

  const getTitle = () => {
    switch (activeTab) {
      case 'dashboard': return 'Cockpit Integrador';
      case 'bling': return 'Parâmetros Bling ERP';
      case 'sheets': return 'Aba de Planilhas e Sincronização';
      case 'logs': return 'Terminal do Sistema';
      case 'usuarios': return 'Gestão de Usuários';
      default: return 'VS SuperPro - Integrador';
    }
  };

  return (
    <div className="h-screen font-sans bg-[#0c0e12] text-slate-200 overflow-hidden relative flex">
      {/* Glow Effects */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-500/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-500/10 rounded-full blur-[120px]" />
      </div>

      {/* SIDEBAR ON DESKTOP */}
      <aside className="hidden md:flex flex-col w-64 shrink-0 border-r border-white/10 bg-white/5 backdrop-blur-xl p-5 justify-between z-10">
        <div className="space-y-6">
          {/* Brand header */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-500/20 text-white">
              <Sparkles className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h2 className="text-base font-bold tracking-tight text-white font-display">VS SuperPro</h2>
              <span className="text-[10px] text-indigo-400 font-mono block leading-none mt-0.5">Integrador Bling</span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  id={`nav-link-${item.id}`}
                  key={item.id}
                  onClick={() => navigateTo(item.id)}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium transition duration-150 cursor-pointer ${
                    isActive 
                      ? 'bg-white/10 text-white border border-white/10 shadow-lg'
                      : 'text-slate-400 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </div>
                  {item.status !== undefined && (
                    <span className={`w-1.5 h-1.5 rounded-full ${item.status ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]'}`} />
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* User Card Info and Logout */}
        <div className="pt-4 border-t border-white/10 space-y-3">
          <div className="flex items-center gap-3 p-2 bg-white/5 rounded-xl border border-white/10">
            <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-xs font-bold text-white uppercase">
              {user?.name ? user.name.split(' ').map(n => n[0]).join('') : 'JD'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-white truncate">{user?.name}</p>
              <p className="text-[10px] text-slate-400 truncate" title={user?.email}>{user?.email}</p>
            </div>
            <button 
              id="nav-logout-btn"
              onClick={handleLogout}
              className="text-slate-500 hover:text-white transition cursor-pointer"
              title="Sair do Painel"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* MOBILE HEADER & DRAWER */}
      <div className="flex-1 flex flex-col min-w-0 relative z-10">
        <header className="flex items-center justify-between px-4 py-3 border-b border-white/10 md:px-6 md:py-4 bg-white/5 backdrop-blur-xl">
          <div className="flex items-center gap-3">
            {/* Mobile drawer toggle */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-1.5 rounded-lg border border-white/10 hover:bg-white/5 text-white transition cursor-pointer"
            >
              {isMobileMenuOpen ? <X className="w-4.5 h-4.5" /> : <Menu className="w-4.5 h-4.5" />}
            </button>
            
            <h1 className="text-base font-bold tracking-tight text-white font-display md:text-lg block">
              {getTitle()}
            </h1>
          </div>

          {/* Right Controls (Navigation Indicators) */}
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2">
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-medium border ${
                navMetrics.bling ? 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400' : 'bg-red-500/10 border-red-500/20 text-red-400'
              }`}>
                <Server className="w-3 h-3" />
                Bling
              </span>
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-medium border ${
                navMetrics.sheets ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-red-500/10 border-red-500/20 text-red-400'
              }`}>
                <Database className="w-3 h-3" />
                Planilha
              </span>
            </div>
          </div>
        </header>

        {/* MOBILE MENU PANEL */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden border-b bg-[#0c0e12]/95 border-white/10 px-4 py-4 space-y-4"
            >
              <nav className="space-y-1">
                {navigationItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => navigateTo(item.id)}
                      className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium transition cursor-pointer ${
                        isActive 
                          ? 'bg-white/10 text-white'
                          : 'text-slate-400 hover:bg-white/5 hover:text-white'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <Icon className="w-4 h-4" />
                        <span>{item.label}</span>
                      </div>
                      {item.status !== undefined && (
                        <span className={`w-1.5 h-1.5 rounded-full ${item.status ? 'bg-emerald-400' : 'bg-red-400'}`} />
                      )}
                    </button>
                  );
                })}
              </nav>

              <div className="pt-3 border-t border-white/10 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <User className="w-4.5 h-4.5 text-indigo-400" />
                  <span className="text-xs text-slate-300 font-medium">{user?.email}</span>
                </div>
                <button
                  onClick={handleLogout}
                  className="inline-flex items-center gap-1 text-red-400 text-xs font-medium cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                  Sair
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* MAIN BODY AREA */}
        <main className="flex-1 p-4 md:p-6 overflow-y-auto max-w-7xl w-full mx-auto relative z-10">
          {activeTab === 'dashboard' && (
            <DashboardView 
              token={token} 
              onNavigateToBling={() => navigateTo('bling')}
              onNavigateToSheets={() => navigateTo('sheets')}
            />
          )}

          {activeTab === 'bling' && (
            <BlingSetup 
              token={token} 
              onStatusChange={fetchIntegrationStatus} 
            />
          )}

          {activeTab === 'sheets' && (
            <SheetsSetup 
              token={token} 
            />
          )}

          {activeTab === 'logs' && (
            <LogViewer 
              token={token} 
            />
          )}

          {activeTab === 'usuarios' && (
            <UsersSetup 
              token={token}
              currentUserEmail={user?.email}
            />
          )}
        </main>
      </div>
    </div>
  );
}
