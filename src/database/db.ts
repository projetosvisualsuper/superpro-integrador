/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import fs from 'fs';
import path from 'path';
import { Pool } from 'pg';
import { Product, SyncHistoryEntry, LogEntry, BlingConfig, SheetsConfig } from '../types';

interface DbSchema {
  users: Array<{ email: string; name: string; password?: string }>;
  blingConfig: BlingConfig;
  sheetsConfig: SheetsConfig;
  progress: {
    status: 'idle' | 'sincronizando' | 'sucesso' | 'erro';
    current: number;
    total: number;
    percentage: number;
    message: string;
  };
  history: SyncHistoryEntry[];
  logs: LogEntry[];
  products: Product[];
}

const DB_FILE = path.join(process.cwd(), 'data', 'db.json');

const initialDb: DbSchema = {
  users: [
    { email: 'projetos.visualsuper@gmail.com', name: 'Administrador', password: 'admin123' }
  ],
  blingConfig: {
    clientId: 'bling_client_id_exemplo_123',
    clientSecret: 'bling_secret_exemplo_abc',
    accessToken: '',
    refreshToken: '',
    conectado: false
  },
  sheetsConfig: {
    planilhaNome: 'Produtos e Composição Bling',
    planilhaId: '1C-w7eEjn0w2Zp24yLr-tB-u-uBTYbnSk6zOfbUtoJ8Y',
    abaNome: 'Produtos',
    clientEmail: '',
    privateKey: '',
    webAppUrl: '',
    tipoConexao: 'script',
    conectado: false,
    modoLocal: false
  },
  progress: {
    status: 'idle',
    current: 0,
    total: 0,
    percentage: 0,
    message: ''
  },
  history: [
    {
      id: 'h-1',
      data: '2026-07-13',
      hora: '14:30:15',
      usuario: 'projetos.visualsuper@gmail.com',
      quantidadeProdutos: 142,
      duracaoMs: 4200,
      status: 'Sucesso'
    },
    {
      id: 'h-2',
      data: '2026-07-12',
      hora: '09:15:22',
      usuario: 'projetos.visualsuper@gmail.com',
      quantidadeProdutos: 138,
      duracaoMs: 3850,
      status: 'Sucesso'
    }
  ],
  logs: [
    {
      id: 'log-1',
      timestamp: '2026-07-13T14:30:15.000Z',
      categoria: 'auth',
      mensagem: 'Sessão iniciada com sucesso para projetos.visualsuper@gmail.com'
    },
    {
      id: 'log-2',
      timestamp: '2026-07-13T14:30:16.000Z',
      categoria: 'bling',
      mensagem: 'Iniciando chamada da API Bling (Produtos - Página 1)'
    },
    {
      id: 'log-3',
      timestamp: '2026-07-13T14:30:19.000Z',
      categoria: 'sheets',
      mensagem: 'Planilha virtual limpa. Inserindo 142 produtos'
    },
    {
      id: 'log-4',
      timestamp: '2026-07-13T14:30:20.000Z',
      categoria: 'performance',
      mensagem: 'Sincronização concluída com sucesso em 4.2 segundos'
    }
  ],
  products: [
    {
      id: 'p-1',
      codigo: 'PROD001',
      sku: 'CEL-S23-128',
      nome: 'Smartphone Samsung Galaxy S23 128GB',
      descricao: 'Smartphone Samsung Galaxy S23 128GB 5G Tela 6.1\" Câmera Tripla 50MP',
      categoria: 'Celulares e Smartphones',
      marca: 'Samsung',
      unidade: 'UN',
      situacao: 'Ativo',
      preco: 3999.00,
      precoPromocional: 3599.10,
      estoqueAtual: 24,
      estoqueMinimo: 5,
      ncm: '8517.13.00',
      gtinEan: '7892509127324',
      pesoLiquido: 0.168,
      pesoBruto: 0.350,
      altura: 14.6,
      largura: 7.0,
      comprimento: 0.7,
      dataCadastro: '2026-01-15',
      ultimaAtualizacao: '2026-07-13'
    },
    {
      id: 'p-2',
      codigo: 'PROD002',
      sku: 'NOTE-DELL-I15',
      nome: 'Notebook Dell Inspiron 15',
      descricao: 'Notebook Dell Inspiron 15 Intel Core i5 8GB 512GB SSD Windows 11 Tela 15.6\"',
      categoria: 'Informática e Notebooks',
      marca: 'Dell',
      unidade: 'UN',
      situacao: 'Ativo',
      preco: 3499.00,
      precoPromocional: 0,
      estoqueAtual: 12,
      estoqueMinimo: 2,
      ncm: '8471.30.12',
      gtinEan: '7892509127325',
      pesoLiquido: 1.65,
      pesoBruto: 2.20,
      altura: 1.8,
      largura: 35.8,
      comprimento: 23.5,
      dataCadastro: '2026-02-10',
      ultimaAtualizacao: '2026-07-13'
    },
    {
      id: 'p-3',
      codigo: 'PROD003',
      sku: 'FONE-JBL-510BT',
      nome: 'Fone de Ouvido Bluetooth JBL Tune 510BT',
      descricao: 'Fone de Ouvido Bluetooth JBL Tune 510BT On-Ear Preto',
      categoria: 'Áudio e Fones',
      marca: 'JBL',
      unidade: 'UN',
      situacao: 'Ativo',
      preco: 299.00,
      precoPromocional: 249.00,
      estoqueAtual: 45,
      estoqueMinimo: 10,
      ncm: '8518.30.00',
      gtinEan: '7892509127326',
      pesoLiquido: 0.160,
      pesoBruto: 0.280,
      altura: 18.0,
      largura: 15.0,
      comprimento: 4.0,
      dataCadastro: '2026-03-05',
      ultimaAtualizacao: '2026-07-12'
    }
  ]
};

// PostgreSQL Connection Pool Configuration
let pool: Pool | null = null;
if (process.env.DATABASE_URL) {
  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false
    }
  });
}

// Ensure local directory exists
function ensureDirectoryExists(filePath: string) {
  const dirname = path.dirname(filePath);
  if (!fs.existsSync(dirname)) {
    fs.mkdirSync(dirname, { recursive: true });
  }
}

export async function readDb(): Promise<DbSchema> {
  if (pool) {
    try {
      // Ensure config table exists
      await pool.query(`
        CREATE TABLE IF NOT EXISTS integrador_config (
          id INT PRIMARY KEY DEFAULT 1,
          data JSONB NOT NULL
        )
      `);

      const res = await pool.query('SELECT data FROM integrador_config WHERE id = 1');
      if (res.rows.length === 0) {
        // Initialize config row
        await pool.query('INSERT INTO integrador_config (id, data) VALUES (1, $1)', [JSON.stringify(initialDb)]);
        return initialDb;
      }
      return res.rows[0].data as DbSchema;
    } catch (error) {
      console.error('Erro ao conectar ou ler do Supabase PostgreSQL:', error);
      // Fallback to local files
    }
  }

  // Local file fallback
  try {
    ensureDirectoryExists(DB_FILE);
    if (!fs.existsSync(DB_FILE)) {
      fs.writeFileSync(DB_FILE, JSON.stringify(initialDb, null, 2), 'utf-8');
      return initialDb;
    }
    const content = fs.readFileSync(DB_FILE, 'utf-8');
    return JSON.parse(content);
  } catch (error) {
    console.error('Erro ao ler banco de dados JSON local:', error);
    return initialDb;
  }
}

export async function writeDb(data: DbSchema): Promise<void> {
  if (pool) {
    try {
      await pool.query('INSERT INTO integrador_config (id, data) VALUES (1, $1) ON CONFLICT (id) DO UPDATE SET data = $1', [JSON.stringify(data)]);
      return;
    } catch (error) {
      console.error('Erro ao gravar no Supabase PostgreSQL:', error);
    }
  }

  // Local file fallback
  try {
    ensureDirectoryExists(DB_FILE);
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (error) {
    console.error('Erro ao gravar no banco de dados JSON local:', error);
  }
}

// Helpers to work with DB
export async function addLog(categoria: LogEntry['categoria'], mensagem: string, detalhes?: string) {
  const db = await readDb();
  const newLog: LogEntry = {
    id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
    timestamp: new Date().toISOString(),
    categoria,
    mensagem,
    detalhes
  };
  db.logs.unshift(newLog);
  if (db.logs.length > 500) {
    db.logs = db.logs.slice(0, 500);
  }
  await writeDb(db);
  return newLog;
}

export async function addHistory(entry: Omit<SyncHistoryEntry, 'id'>) {
  const db = await readDb();
  const newEntry: SyncHistoryEntry = {
    id: `h-${Date.now()}`,
    ...entry
  };
  db.history.unshift(newEntry);
  await writeDb(db);
  return newEntry;
}
