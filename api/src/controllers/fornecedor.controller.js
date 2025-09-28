import Fornecedor from '../models/Fornecedor.js';

export async function create(req, res) {
  try {
    const body = req.body || {};
    if (!body.razaoSocial) return res.status(400).json({ error: 'razaoSocial é obrigatório' });
    const novo = await Fornecedor.create(body);
    res.status(201).json(novo);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Falha ao criar fornecedor' });
  }
}

export async function list(req, res) {
  try {
    const { page = 1, limit = 10, q = '', status } = req.query;
    const filtro = {};
    if (q) filtro.$text = { $search: q };
    if (status) filtro.status = status;

    const skip = (Number(page) - 1) * Number(limit);
    const [items, total] = await Promise.all([
      Fornecedor.find(filtro).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
      Fornecedor.countDocuments(filtro),
    ]);

    res.json({ items, total, page: Number(page), pages: Math.ceil(total / Number(limit)) });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Falha ao listar fornecedores' });
  }
}

export async function getById(req, res) {
  try {
    const f = await Fornecedor.findById(req.params.id);
    if (!f) return res.status(404).json({ error: 'Fornecedor não encontrado' });
    res.json(f);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Falha ao buscar fornecedor' });
  }
}

export async function update(req, res) {
  try {
    const f = await Fornecedor.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!f) return res.status(404).json({ error: 'Fornecedor não encontrado' });
    res.json(f);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Falha ao atualizar fornecedor' });
  }
}

export async function remove(req, res) {
  try {
    const f = await Fornecedor.findByIdAndDelete(req.params.id);
    if (!f) return res.status(404).json({ error: 'Fornecedor não encontrado' });
    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Falha ao remover fornecedor' });
  }
}
