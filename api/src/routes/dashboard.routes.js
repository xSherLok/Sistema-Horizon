import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { resumo, receitaMensal, topProdutos } from '../controllers/dashboard.controller.js';

const router = Router();

// protege todas as rotas do dashboard
router.use(requireAuth);

// GET /api/dashboard/resumo
router.get('/resumo', resumo);

// GET /api/dashboard/receita-mensal
router.get('/receita-mensal', receitaMensal);

// GET /api/dashboard/top-produtos
router.get('/top-produtos', topProdutos);

export default router;
