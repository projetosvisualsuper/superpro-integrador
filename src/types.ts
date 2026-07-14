/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Product {
  id: string;
  codigo: string;
  sku: string;
  nome: string;
  descricao: string;
  categoria: string;
  marca: string;
  unidade: string;
  situacao: 'Ativo' | 'Inativo';
  preco: number;
  precoPromocional: number;
  estoqueAtual: number;
  estoqueMinimo: number;
  ncm: string;
  gtinEan: string;
  pesoLiquido: number;
  pesoBruto: number;
  altura: number;
  largura: number;
  comprimento: number;
  dataCadastro: string;
  ultimaAtualizacao: string;
}

export interface SyncHistoryEntry {
  id: string;
  data: string; // YYYY-MM-DD
  hora: string; // HH:MM:SS
  usuario: string;
  quantidadeProdutos: number;
  duracaoMs: number;
  status: 'Sucesso' | 'Erro';
  mensagemErro?: string;
}

export interface LogEntry {
  id: string;
  timestamp: string;
  categoria: 'auth' | 'bling' | 'sheets' | 'error' | 'performance';
  mensagem: string;
  detalhes?: string;
}

export interface BlingConfig {
  clientId: string;
  clientSecret: string;
  accessToken: string;
  refreshToken: string;
  expiresAt?: string; // ISO date string
  conectado: boolean;
}

export interface SheetsConfig {
  planilhaNome: string;
  planilhaId?: string;
  abaNome: string;
  clientEmail?: string;
  privateKey?: string;
  webAppUrl?: string;
  tipoConexao: 'local' | 'script' | 'service_account';
  conectado: boolean;
  modoLocal: boolean; // Indicates we are utilizing the local spreadsheet sandbox as requested
}

export interface DashboardStats {
  blingConectado: boolean;
  sheetsConectado: boolean;
  ultimaSincronizacao: string;
  quantidadeProdutos: number;
  duracaoUltimaSincronizacao: number; // in ms
}
