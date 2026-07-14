/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { readDb, writeDb, addLog, addHistory } from './src/database/db';
import { BlingService } from './src/services/bling.service';

const app = express();
const PORT = 3000;

// Enable JSON body parsing
app.use(express.json());

// Logger middleware
app.use((req, res, next) => {
  console.log(`[${req.method}] ${req.url}`);
  next();
});

// Simple Auth Middleware
const authMiddleware = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Não autorizado. Faça login primeiro.' });
  }
  const email = authHeader.replace('Bearer ', '');
  const db = readDb();
  const userExists = db.users.some(u => u.email === email);
  if (!userExists) {
    return res.status(401).json({ error: 'Usuário inválido ou sessão expirada.' });
  }
  next();
};

// ==========================================
// 1. AUTENTICAÇÃO API
// ==========================================

app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'E-mail e senha são obrigatórios.' });
  }

  // Check the email matching the user email and password
  if (email === 'projetos.visualsuper@gmail.com' && password === 'admin123') {
    addLog('auth', `Sessão iniciada com sucesso para ${email}`);
    return res.json({
      token: email,
      user: { email, name: 'Administrador' }
    });
  } else {
    addLog('auth', `Falha na tentativa de login para o e-mail: ${email}`);
    return res.status(401).json({ error: 'Credenciais inválidas. Use o e-mail cadastrado e a senha padrão (admin123).' });
  }
});

app.post('/api/auth/logout', (req, res) => {
  const authHeader = req.headers.authorization;
  const email = authHeader ? authHeader.replace('Bearer ', '') : 'Usuário';
  addLog('auth', `Sessão encerrada com sucesso para ${email}`);
  res.json({ status: 'ok' });
});

// ==========================================
// 2. CONFIGURAÇÕES API (Bling / Sheets)
// ==========================================

app.get('/api/config/bling', authMiddleware, (req, res) => {
  const db = readDb();
  res.json(db.blingConfig);
});

app.post('/api/config/bling', authMiddleware, (req, res) => {
  const { clientId, clientSecret, accessToken, refreshToken } = req.body;
  
  if (!clientId || !clientSecret) {
    return res.status(400).json({ error: 'Client ID e Client Secret são obrigatórios.' });
  }

  const db = readDb();
  db.blingConfig = {
    clientId,
    clientSecret,
    accessToken: accessToken || '',
    refreshToken: refreshToken || '',
    conectado: true
  };
  writeDb(db);
  
  addLog('bling', 'Configurações de conexão do Bling salvas com sucesso.');
  res.json(db.blingConfig);
});

app.get('/api/config/sheets', authMiddleware, (req, res) => {
  const db = readDb();
  res.json(db.sheetsConfig);
});

app.post('/api/config/sheets', authMiddleware, (req, res) => {
  const { planilhaNome, abaNome } = req.body;
  
  if (!planilhaNome || !abaNome) {
    return res.status(400).json({ error: 'Nome da planilha e Nome da aba são obrigatórios.' });
  }

  const db = readDb();
  db.sheetsConfig = {
    planilhaNome,
    abaNome,
    conectado: true,
    modoLocal: true
  };
  writeDb(db);
  
  addLog('sheets', `Configurações da Planilha salvas. Usando Planilha: "${planilhaNome}" | Aba: "${abaNome}".`);
  res.json(db.sheetsConfig);
});

// ==========================================
// 3. SINCRONIZAÇÃO E WEBHOOK ENGINE
// ==========================================

// Core sync engine function shared between Button and Webhook
async function runSyncProcess() {
  const db = readDb();
  
  // Set progress state to running
  db.progress = {
    status: 'sincronizando',
    current: 0,
    total: 840,
    percentage: 0,
    message: 'Iniciando sincronização com ERP Bling...'
  };
  writeDb(db);
  
  const startTime = Date.now();
  addLog('bling', 'Iniciando busca de produtos na API do Bling (Com paginação)...');

  try {
    // Perform paginated fetching
    const products = await BlingService.fetchAllProducts(
      db.blingConfig.clientId,
      db.blingConfig.clientSecret,
      (current, total, percentage, message) => {
        const liveDb = readDb();
        liveDb.progress = {
          status: 'sincronizando',
          current,
          total,
          percentage,
          message
        };
        writeDb(liveDb);
        
        // Log periodically
        if (current % 140 === 0 || current === total) {
          addLog('bling', `Progresso da busca: ${current}/${total} produtos lidos (${percentage}%)...`);
        }
      }
    );

    // Save to the database as "clean and rewrite" spreadsheet
    const finalDb = readDb();
    
    addLog('sheets', 'Limpando linhas anteriores da planilha virtual (preservando cabeçalhos)...');
    
    // Simulate Sheets update latency
    await new Promise(resolve => setTimeout(resolve, 800));
    
    addLog('sheets', `Gravando ${products.length} produtos atualizados na planilha virtual...`);
    finalDb.products = products;
    
    const durationMs = Date.now() - startTime;
    
    // Record success history entry
    addHistory({
      data: new Date().toISOString().split('T')[0],
      hora: new Date().toLocaleTimeString('pt-BR'),
      usuario: 'projetos.visualsuper@gmail.com',
      quantidadeProdutos: products.length,
      duracaoMs: durationMs,
      status: 'Sucesso'
    });
    
    addLog('performance', `Sincronização concluída. ${products.length} produtos atualizados em ${(durationMs / 1000).toFixed(1)} segundos.`);

    finalDb.progress = {
      status: 'sucesso',
      current: products.length,
      total: products.length,
      percentage: 100,
      message: `Sincronização concluída com sucesso! ${products.length} produtos atualizados.`
    };
    writeDb(finalDb);

    return { status: 'sucesso', count: products.length, durationMs };
  } catch (error: any) {
    const errorMsg = error.message || 'Erro desconhecido durante a sincronização.';
    const finalDb = readDb();
    finalDb.progress = {
      status: 'erro',
      current: 0,
      total: 0,
      percentage: 0,
      message: `Falha na sincronização: ${errorMsg}`
    };
    writeDb(finalDb);
    
    addHistory({
      data: new Date().toISOString().split('T')[0],
      hora: new Date().toLocaleTimeString('pt-BR'),
      usuario: 'projetos.visualsuper@gmail.com',
      quantidadeProdutos: 0,
      duracaoMs: Date.now() - startTime,
      status: 'Erro',
      mensagemErro: errorMsg
    });
    
    addLog('error', `Falha na sincronização de produtos: ${errorMsg}`);
    throw error;
  }
}

// Endpoint 1: POST /api/sync/start (Triggered by Dashboard Button)
app.post('/api/sync/start', authMiddleware, async (req, res) => {
  const db = readDb();
  if (db.progress.status === 'sincronizando') {
    return res.status(400).json({ error: 'Uma sincronização já está em andamento.' });
  }
  
  // Run async so we can return response immediately and client can poll progress
  runSyncProcess().catch(err => console.error('Erro de Sync de background:', err));
  
  res.json({ status: 'started', message: 'Sincronização iniciada com sucesso em segundo plano.' });
});

// Endpoint 2: GET /api/sync/progress (Poll progression)
app.get('/api/sync/progress', authMiddleware, (req, res) => {
  const db = readDb();
  res.json(db.progress);
});

// Endpoint 3: POST /webhook/update-products (Webhook endpoint as requested)
app.post('/webhook/update-products', async (req, res) => {
  console.log('Webhook de atualização de produtos recebido via POST.');
  const db = readDb();
  
  if (db.progress.status === 'sincronizando') {
    addLog('bling', 'Chamada recebida no webhook ignorada: uma sincronização já está em andamento.');
    return res.status(409).json({ error: 'Sync already running.' });
  }

  addLog('bling', 'Webhook /webhook/update-products disparado com sucesso.');
  
  // We can trigger synchronously or asynchronously.
  // To prevent HTTP timeouts for webhook, we run it and respond back.
  runSyncProcess()
    .then(result => {
      console.log('Webhook sync concluído com sucesso:', result);
    })
    .catch(err => {
      console.error('Webhook sync falhou:', err);
    });

  res.json({
    status: 'received',
    message: 'Webhook ativado. Sincronização em andamento.',
    endpoint: '/webhook/update-products'
  });
});

// ==========================================
// 4. HISTÓRICO, LOGS E PRODUTOS LIST
// ==========================================

app.get('/api/sync/history', authMiddleware, (req, res) => {
  const db = readDb();
  res.json(db.history);
});

app.get('/api/sync/logs', authMiddleware, (req, res) => {
  const db = readDb();
  let filteredLogs = db.logs;
  
  const categoria = req.query.categoria as string;
  if (categoria && categoria !== 'todos') {
    filteredLogs = filteredLogs.filter(log => log.categoria === categoria);
  }
  
  const search = req.query.search as string;
  if (search && search.trim() !== '') {
    const q = search.toLowerCase();
    filteredLogs = filteredLogs.filter(log => 
      log.mensagem.toLowerCase().includes(q) || 
      (log.detalhes && log.detalhes.toLowerCase().includes(q))
    );
  }
  
  res.json(filteredLogs);
});

app.get('/api/products', authMiddleware, (req, res) => {
  const db = readDb();
  let list = db.products;
  
  const search = req.query.search as string;
  if (search && search.trim() !== '') {
    const q = search.toLowerCase();
    list = list.filter(p => 
      p.nome.toLowerCase().includes(q) ||
      p.sku.toLowerCase().includes(q) ||
      p.codigo.toLowerCase().includes(q) ||
      p.categoria.toLowerCase().includes(q) ||
      p.marca.toLowerCase().includes(q)
    );
  }
  
  res.json(list);
});

// Reset simulated db data back to initial (useful helper)
app.post('/api/sync/reset', authMiddleware, (req, res) => {
  const db = readDb();
  db.products = [];
  db.history = [];
  db.logs = [
    {
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString(),
      categoria: 'performance',
      mensagem: 'Banco de dados redefinido para o estado inicial.'
    }
  ];
  db.progress = {
    status: 'idle',
    current: 0,
    total: 0,
    percentage: 0,
    message: ''
  };
  writeDb(db);
  res.json({ status: 'ok' });
});


// ==========================================
// 5. DEV & PRODUCTION SERVER INTEGRATION
// ==========================================

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    // Dev Mode: Integrate Vite as Middleware
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Production Mode: Serve Built Static Files
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Bling ERP Sync Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
