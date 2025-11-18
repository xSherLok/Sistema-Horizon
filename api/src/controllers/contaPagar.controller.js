import ContaPagar from '../models/ContaPagar.js';
export async function list(req, res) {
  try {
    const contas = await ContaPagar.find()
      .populate('fornecedor', 'nome razaoSocial nomeFantasia cpfCnpj cnpj telefone email');

    res.json({ data: contas });
  } catch (err) {
    console.error('Erro ao listar contas a pagar:', err);
    res.status(500).json({ error: 'Erro ao listar contas.' });
  }
}
export async function getById(req, res) {
  try {
    const conta = await ContaPagar.findById(req.params.id)
      .populate('fornecedor', 'nome razaoSocial nomeFantasia cpfCnpj cnpj telefone email');

    if (!conta) {
      return res.status(404).json({ error: 'Conta não encontrada.' });
    }

    res.json(conta);
  } catch (err) {
    console.error('Erro ao buscar conta:', err);
    res.status(500).json({ error: 'Erro ao buscar conta.' });
  }
}

export async function create(req, res) {
  try {
    const novo = await ContaPagar.create(req.body); res.status(201).json(novo);
  } catch (e) { res.status(400).json({ error: e.message }); }
}
export async function update(req, res) {
  try {
    const upd = await ContaPagar.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!upd) return res.status(404).json({ error: 'Conta a pagar não encontrada' });
    res.json(upd);
  } catch (e) { res.status(400).json({ error: e.message }); }
}
export async function baixar(req, res) {
  try {
    const c = await ContaPagar.findById(req.params.id);
    if (!c) return res.status(404).json({ error: 'Conta a pagar não encontrada' });
    c.status = 'paga'; c.pagamento = new Date(); await c.save(); res.json(c);
  } catch (e) { res.status(400).json({ error: e.message }); }
}
export async function remove(req, res) {
  try {
    await ContaPagar.findByIdAndDelete(req.params.id); res.json({ ok: true });
  } catch (e) { res.status(400).json({ error: e.message }); }
}
