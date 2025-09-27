import Cliente from '../models/Cliente.js';

export async function create(req, res) {
  try {
    const body = req.body || {};
    if (!body.nome) return res.status(400).json({ error: 'nome é obrigatório' });
    const novo = await Cliente.create(body);
    res.status(201).json(novo);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Falha ao criar cliente' });
  }
}

export async function list(req, res) {
  try {
    const { page = 1, limit = 10, q = '', status } = req.query;
    const filtro = {};
    if (q) {
      filtro.$text = { $search: q };
    }
    if (status) {
      filtro.status = status;
    }

    const skip = (Number(page) - 1) * Number(limit);
    const [items, total] = await Promise.all([
      Cliente.find(filtro).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
      Cliente.countDocuments(filtro)
    ]);

    res.json({ items, total, page: Number(page), pages: Math.ceil(total / Number(limit)) });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Falha ao listar clientes' });
  }
}

export async function getById(req, res) {
  try {
    const c = await Cliente.findById(req.params.id);
    if (!c) return res.status(404).json({ error: 'Cliente não encontrado' });
    res.json(c);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Falha ao buscar cliente' });
  }
}

export async function update(req, res) {
  try {
    const c = await Cliente.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!c) return res.status(404).json({ error: 'Cliente não encontrado' });
    res.json(c);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Falha ao atualizar cliente' });
  }
}

export async function remove(req, res) {
  try {
    const c = await Cliente.findByIdAndDelete(req.params.id);
    if (!c) return res.status(404).json({ error: 'Cliente não encontrado' });
    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Falha ao remover cliente' });
  }
}
