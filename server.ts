/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import 'dotenv/config';
import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { readDb, writeDb, addLog, addHistory } from './src/database/db';
import { BlingService } from './src/services/bling.service';
import { SheetsService } from './src/services/sheets.service';

const app = express();
const PORT = 3000;

// Helper to get date and time in America/Sao_Paulo timezone
function getBrazilDateTime() {
  const now = new Date();
  const dtf = new Intl.DateTimeFormat('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  });
  const parts = dtf.formatToParts(now);
  const day = parts.find(p => p.type === 'day')?.value;
  const month = parts.find(p => p.type === 'month')?.value;
  const year = parts.find(p => p.type === 'year')?.value;
  const hour = parts.find(p => p.type === 'hour')?.value;
  const minute = parts.find(p => p.type === 'minute')?.value;
  const second = parts.find(p => p.type === 'second')?.value;
  return {
    date: `${year}-${month}-${day}`,
    time: `${hour}:${minute}:${second}`
  };
}

// Enable JSON body parsing
app.use(express.json());

// Logger middleware
app.use((req, res, next) => {
  console.log(`[${req.method}] ${req.url}`);
  next();
});

// Simple Auth Middleware
const authMiddleware = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Não autorizado. Faça login primeiro.' });
  }
  const email = authHeader.replace('Bearer ', '');
  const db = await readDb();
  const userExists = db.users.some(u => u.email === email);
  if (!userExists) {
    return res.status(401).json({ error: 'Usuário inválido ou sessão expirada.' });
  }
  next();
};

// ==========================================
// 1. AUTENTICAÇÃO API
// ==========================================

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'E-mail e senha são obrigatórios.' });
  }

  const db = await readDb();
  const user = db.users.find(u => u.email === email && u.password === password);
  if (user) {
    await addLog('auth', `Sessão iniciada com sucesso para ${email}`);
    return res.json({
      token: email,
      user: { email: user.email, name: user.name }
    });
  } else {
    await addLog('auth', `Falha na tentativa de login para o e-mail: ${email}`);
    return res.status(401).json({ error: 'Credenciais inválidas. Verifique o e-mail e a senha digitada.' });
  }
});

app.get('/api/users', authMiddleware, async (req, res) => {
  const db = await readDb();
  // Remove password field for safety
  const safeUsers = db.users.map(({ email, name }) => ({ email, name }));
  res.json(safeUsers);
});

app.post('/api/users', authMiddleware, async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Nome, E-mail e Senha são obrigatórios.' });
  }

  const db = await readDb();
  if (db.users.some(u => u.email === email)) {
    return res.status(400).json({ error: 'Um usuário com este e-mail já existe.' });
  }

  db.users.push({ name, email, password });
  await writeDb(db);
  
  await addLog('auth', `Novo usuário registrado: ${email} (${name})`);
  res.json({ email, name });
});

app.delete('/api/users/:email', authMiddleware, async (req, res) => {
  const { email } = req.params;
  const callerHeader = req.headers.authorization;
  const callerEmail = callerHeader ? callerHeader.replace('Bearer ', '') : '';

  if (email === callerEmail) {
    return res.status(400).json({ error: 'Você não pode excluir o seu próprio usuário logado.' });
  }

  const db = await readDb();
  const userIndex = db.users.findIndex(u => u.email === email);
  if (userIndex === -1) {
    return res.status(404).json({ error: 'Usuário não encontrado.' });
  }

  const deletedUser = db.users.splice(userIndex, 1)[0];
  await writeDb(db);

  await addLog('auth', `Usuário excluído: ${email} (${deletedUser.name})`);
  res.json({ status: 'ok', message: `Usuário ${email} excluído com sucesso.` });
});

app.post('/api/auth/logout', async (req, res) => {
  const authHeader = req.headers.authorization;
  const email = authHeader ? authHeader.replace('Bearer ', '') : 'Usuário';
  await addLog('auth', `Sessão encerrada com sucesso para ${email}`);
  res.json({ status: 'ok' });
});

// ==========================================
// 2. CONFIGURAÇÕES API (Bling / Sheets)
// ==========================================

app.get('/api/config/bling', authMiddleware, async (req, res) => {
  const db = await readDb();
  res.json(db.blingConfig);
});

app.post('/api/config/bling', authMiddleware, async (req, res) => {
  const { clientId, clientSecret, accessToken, refreshToken } = req.body;
  
  if (!clientId || !clientSecret) {
    return res.status(400).json({ error: 'Client ID e Client Secret são obrigatórios.' });
  }

  const db = await readDb();
  db.blingConfig = {
    clientId,
    clientSecret,
    accessToken: accessToken || '',
    refreshToken: refreshToken || '',
    conectado: true
  };
  await writeDb(db);
  
  await addLog('bling', 'Configurações de conexão do Bling salvas com sucesso.');
  res.json(db.blingConfig);
});

// OAuth Callback for Bling API v3
app.get('/api/auth/bling/callback', async (req, res) => {
  const { code } = req.query;
  if (!code) {
    return res.status(400).send('Código de autorização ausente.');
  }

  const db = await readDb();
  const { clientId, clientSecret } = db.blingConfig;

  if (!clientId || !clientSecret) {
    return res.status(400).send('Client ID e Client Secret não configurados no integrador. Configure-os primeiro.');
  }

  try {
    const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
    const redirectUri = `${req.protocol}://${req.get('host')}/api/auth/bling/callback`;
    
    const tokenResponse = await fetch('https://www.bling.com.br/Api/v3/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${credentials}`
      },
      body: JSON.stringify({
        grant_type: 'authorization_code',
        code: String(code),
        redirect_uri: redirectUri
      })
    });

    if (!tokenResponse.ok) {
      throw new Error(`Erro na troca de código do Bling: ${tokenResponse.status} - ${await tokenResponse.text()}`);
    }

    const tokenData = await tokenResponse.json();
    
    db.blingConfig.accessToken = tokenData.access_token;
    db.blingConfig.refreshToken = tokenData.refresh_token || db.blingConfig.refreshToken;
    db.blingConfig.conectado = true;
    await writeDb(db);

    await addLog('bling', 'Conexão OAuth 2.0 estabelecida com sucesso via redirecionamento.');

    // Redirect user back to dashboard setup page
    res.redirect('/');
  } catch (error: any) {
    console.error('Erro no callback do Bling:', error);
    res.status(500).send(`Erro ao conectar ao Bling: ${error.message}`);
  }
});

app.get('/api/config/sheets', authMiddleware, async (req, res) => {
  const db = await readDb();
  res.json(db.sheetsConfig);
});

app.post('/api/config/sheets', authMiddleware, async (req, res) => {
  const { planilhaNome, abaNome, planilhaId, clientEmail, privateKey, webAppUrl, tipoConexao, modoLocal } = req.body;
  
  if (!planilhaNome || !abaNome) {
    return res.status(400).json({ error: 'Nome da planilha e Nome da aba são obrigatórios.' });
  }

  const db = await readDb();
  db.sheetsConfig = {
    planilhaNome,
    abaNome,
    planilhaId: planilhaId || '',
    clientEmail: clientEmail || '',
    privateKey: privateKey || '',
    webAppUrl: webAppUrl || '',
    tipoConexao: tipoConexao || (modoLocal ? 'local' : 'service_account'),
    conectado: true,
    modoLocal: tipoConexao === 'local'
  };
  await writeDb(db);
  
  await addLog('sheets', `Configurações da Planilha salvas. Tipo de conexão: ${db.sheetsConfig.tipoConexao} | Planilha: "${planilhaNome}" | Aba: "${abaNome}".`);
  res.json(db.sheetsConfig);
});

// ==========================================
// 3. SINCRONIZAÇÃO E WEBHOOK ENGINE
// ==========================================

// Core sync engine function shared between Button and Webhook
async function runSyncProcess() {
  const db = await readDb();
  
  // Set progress state to running
  db.progress = {
    status: 'sincronizando',
    current: 0,
    total: 840,
    percentage: 0,
    message: 'Iniciando sincronização com ERP Bling...'
  };
  await writeDb(db);
  
  const startTime = Date.now();
  await addLog('bling', 'Iniciando busca de produtos na API do Bling (Com paginação)...');

  try {
    // Perform paginated fetching
    const { products, structures } = await BlingService.fetchAllProducts(
      db.blingConfig.clientId,
      db.blingConfig.clientSecret,
      db.blingConfig.accessToken,
      db.blingConfig.refreshToken,
      async (newTokens) => {
        const liveDb = await readDb();
        liveDb.blingConfig.accessToken = newTokens.accessToken;
        liveDb.blingConfig.refreshToken = newTokens.refreshToken;
        await writeDb(liveDb);
        await addLog('bling', 'Tokens de acesso atualizados com sucesso.');
      },
      async (current, total, percentage, message) => {
        const liveDb = await readDb();
        liveDb.progress = {
          status: 'sincronizando',
          current,
          total,
          percentage,
          message
        };
        await writeDb(liveDb);
        
        // Log periodically
        if (current % 140 === 0 || current === total) {
          await addLog('bling', `Progresso da busca: ${current}/${total} produtos lidos (${percentage}%)...`);
        }
      }
    );

    // Save to the database as "clean and rewrite" spreadsheet
    const finalDb = await readDb();
    
    if (finalDb.sheetsConfig.tipoConexao !== 'local') {
      await addLog('sheets', `Iniciando gravação na planilha real do Google Sheets (${finalDb.sheetsConfig.planilhaNome}) via ${finalDb.sheetsConfig.tipoConexao}...`);
      await SheetsService.syncToGoogleSheets(
        finalDb.sheetsConfig.tipoConexao,
        finalDb.sheetsConfig.planilhaId || '',
        finalDb.sheetsConfig.clientEmail || '',
        finalDb.sheetsConfig.privateKey || '',
        finalDb.sheetsConfig.webAppUrl || '',
        products,
        structures
      );
      await addLog('sheets', `Gravação no Google Sheets concluída com sucesso.`);
    } else {
      await addLog('sheets', 'Limpando linhas anteriores da planilha virtual (preservando cabeçalhos)...');
      
      // Simulate Sheets update latency
      await new Promise(resolve => setTimeout(resolve, 800));
      
      await addLog('sheets', `Gravando ${products.length} produtos atualizados na planilha virtual...`);
    }
    finalDb.products = products;
    
    const durationMs = Date.now() - startTime;
    
    // Record success history entry atomically inside finalDb
    const brazilDateTime = getBrazilDateTime();
    finalDb.history.unshift({
      id: `h-${Date.now()}`,
      data: brazilDateTime.date,
      hora: brazilDateTime.time,
      usuario: 'projetos.visualsuper@gmail.com',
      quantidadeProdutos: products.length,
      duracaoMs: durationMs,
      status: 'Sucesso'
    });
    
    await addLog('performance', `Sincronização concluída. ${products.length} produtos atualizados em ${(durationMs / 1000).toFixed(1)} segundos.`);

    finalDb.progress = {
      status: 'sucesso',
      current: products.length,
      total: products.length,
      percentage: 100,
      message: `Sincronização concluída com sucesso! ${products.length} produtos atualizados.`
    };
    await writeDb(finalDb);

    return { status: 'sucesso', count: products.length, durationMs };
  } catch (error: any) {
    const errorMsg = error.message || 'Erro desconhecido durante a sincronização.';
    const finalDb = await readDb();
    finalDb.progress = {
      status: 'erro',
      current: 0,
      total: 0,
      percentage: 0,
      message: `Falha na sincronização: ${errorMsg}`
    };
    await writeDb(finalDb);
    
    const brazilDateTime = getBrazilDateTime();
    await addHistory({
      data: brazilDateTime.date,
      hora: brazilDateTime.time,
      usuario: 'projetos.visualsuper@gmail.com',
      quantidadeProdutos: 0,
      duracaoMs: Date.now() - startTime,
      status: 'Erro',
      mensagemErro: errorMsg
    });
    
    await addLog('error', `Falha na sincronização de produtos: ${errorMsg}`);
    throw error;
  }
}

// Endpoint 1: POST /api/sync/start (Triggered by Dashboard Button)
app.post('/api/sync/start', authMiddleware, async (req, res) => {
  const db = await readDb();
  if (db.progress.status === 'sincronizando') {
    return res.status(400).json({ error: 'Uma sincronização já está em andamento.' });
  }
  
  // Run async so we can return response immediately and client can poll progress
  runSyncProcess().catch(err => console.error('Erro de Sync de background:', err));
  
  res.json({ status: 'started', message: 'Sincronização iniciada com sucesso em segundo plano.' });
});

// Endpoint 2: GET /api/sync/progress (Poll progression)
app.get('/api/sync/progress', authMiddleware, async (req, res) => {
  const db = await readDb();
  res.json(db.progress);
});

// Endpoint 2.5: POST /api/sync/abort (Reset stuck sync status to idle)
app.post('/api/sync/abort', authMiddleware, async (req, res) => {
  const db = await readDb();
  db.progress = {
    status: 'idle',
    current: 0,
    total: 0,
    percentage: 0,
    message: 'Sincronização cancelada/abortada pelo usuário.'
  };
  await writeDb(db);
  await addLog('performance', 'Sincronização abortada manualmente pelo painel de controle.');
  res.json(db.progress);
});

// Endpoint 3: POST /webhook/update-products (Webhook endpoint as requested)
app.post('/webhook/update-products', async (req, res) => {
  console.log('Webhook de atualização de produtos recebido via POST.');
  const db = await readDb();
  
  if (db.progress.status === 'sincronizando') {
    await addLog('bling', 'Chamada recebida no webhook ignorada: uma sincronização já está em andamento.');
    return res.status(409).json({ error: 'Sync already running.' });
  }

  // Check if a sync has already succeeded today (Brazil Time)
  const todayStr = getBrazilDateTime().date;
  const alreadySyncedToday = db.history.some(h => h.data === todayStr && h.status.toLowerCase() === 'sucesso');
  
  if (alreadySyncedToday) {
    await addLog('bling', `Chamada recebida no webhook ignorada: sincronização já realizada hoje (${todayStr}).`);
    return res.json({
      status: 'ignored',
      message: `Sincronização já realizada hoje (${todayStr}). Limite de 1 vez por dia ativo.`,
      endpoint: '/webhook/update-products'
    });
  }

  await addLog('bling', 'Webhook /webhook/update-products disparado com sucesso.');
  
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

app.get('/api/sync/history', authMiddleware, async (req, res) => {
  const db = await readDb();
  res.json(db.history);
});

app.get('/api/sync/logs', authMiddleware, async (req, res) => {
  const db = await readDb();
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

app.get('/api/products', authMiddleware, async (req, res) => {
  const db = await readDb();
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
app.post('/api/sync/reset', authMiddleware, async (req, res) => {
  const db = await readDb();
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
  await writeDb(db);
  res.json({ status: 'ok' });
});


// ==========================================
// 5. DEV & PRODUCTION SERVER INTEGRATION
// ==========================================

async function startServer() {
  const isProduction = process.env.NODE_ENV === 'production' || process.env.RENDER === 'true';
  
  if (!isProduction) {
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
