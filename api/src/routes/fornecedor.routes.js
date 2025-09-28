import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { create, list, getById, update, remove } from '../controllers/fornecedor.controller.js';

const router = Router();

router.use(requireAuth);
router.get('/', list);
router.get('/:id', getById);
router.post('/', create);
router.put('/:id', update);
router.delete('/:id', remove);

export default router;
