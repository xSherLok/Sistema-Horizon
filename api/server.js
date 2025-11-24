import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

import authRoutes from './src/routes/auth.routes.js';
import userRoutes from './src/routes/user.routes.js';
import { requireAuth } from './src/middleware/auth.js';
import clienteRoutes from './src/routes/cliente.routes.js';
import fornecedorRoutes from './src/routes/fornecedor.routes.js';
import contaReceberRoutes from './src/routes/conta-receber.routes.js';
import contaPagarRoutes from './src/routes/conta-pagar.routes.js';
import vendaRoutes from './src/routes/venda.routes.js';
import produtoRoutes from './src/routes/produto.routes.js';
import dashboardRoutes from './src/routes/dashboard.routes.js';


dotenv.config();

const app = express();

// Util para resolver caminhos (ESM)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Middlewares
app.use(helmet());
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(morgan('dev'));
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
export default app;

// Rate limit (básico)
const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 200 });
app.use(limiter);

// ====== API ROUTES ======
app.use('/api/auth', authRoutes);
app.use('/api/user', requireAuth, userRoutes);
app.use('/api/clientes', clienteRoutes);
app.use('/api/fornecedores', fornecedorRoutes);
app.use('/api/contas-receber', contaReceberRoutes);
app.use('/api/contas-pagar', contaPagarRoutes);
app.use('/api/vendas', vendaRoutes);
app.use('/api/produtos', produtoRoutes);
app.use('/api/dashboard', dashboardRoutes);





// Healthcheck API
app.get('/api/health', (_req, res) => res.json({ ok: true }));

// ====== FRONTEND ESTÁTICO (com auto-detector) ======
function resolveFrontendDir() {
  const candidates = [];

  if (process.env.FRONTEND_DIR) {
    const abs = path.resolve(process.env.FRONTEND_DIR);
    candidates.push(path.join(abs, 'index.html'));
  }

  candidates.push(
    path.join(__dirname, '../Sistema-Horizon/index.html'),
    path.join(__dirname, '../Sistema-Horizon/Sistema-Horizon/index.html'),
    path.join(__dirname, '../index.html'),
    path.join(process.cwd(), 'Sistema-Horizon/index.html'),
    path.join(process.cwd(), 'Sistema-Horizon/Sistema-Horizon/index.html'),
    path.join(process.cwd(), 'index.html')
  );

  const indexPath = candidates.find(p => fs.existsSync(p));
  if (!indexPath) {
    console.error('❌ Não encontrei index.html do frontend.');
    console.error('Caminhos testados:');
    for (const c of candidates) console.error(' - ' + c);
    console.error('Dica: defina FRONTEND_DIR no api/.env apontando para a PASTA do index.html.');
    process.exit(1);
  }

  const dir = path.dirname(indexPath);
  console.log('🌐 Servindo frontend de:', dir);
  return { dir, indexPath };
}

const { dir: frontendDir, indexPath } = resolveFrontendDir();

app.use(express.static(frontendDir));

app.get('/', (_req, res) => res.sendFile(indexPath));

app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api/')) return next();
  res.sendFile(indexPath);
});

// ====== MONGO & SERVER START ======
const PORT = process.env.PORT || 4000;
const uri = process.env.MONGO_URI;

if (!uri) {
  console.error('Falta MONGO_URI no .env');
  process.exit(1);
}

mongoose.connect(uri, { autoIndex: true })
  .then(() => {
    console.log('✅ MongoDB conectado');
    app.listen(PORT, () => console.log(`🚀 Servidor em http://localhost:${PORT}`));
  })
  .catch(err => {
    console.error('Erro ao conectar ao MongoDB:', err);
    process.exit(1);
  });


  
