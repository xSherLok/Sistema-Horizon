import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { create, list, getById, update, remove } from '../controllers/cliente.controller.js';

const router = Router();

router.use(requireAuth);             // protege tudo abaixo
router.get('/', list);               // GET /api/clientes?q=joao&page=1&limit=10&status=ativo
router.get('/:id', getById);         // GET /api/clientes/:id
router.post('/', create);            // POST /api/clientes
router.put('/:id', update);          // PUT /api/clientes/:id
router.delete('/:id', remove);       // DELETE /api/clientes/:id

export default router;
