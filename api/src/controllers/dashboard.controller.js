import Venda from '../models/Venda.js';
import Produto from '../models/Produto.js';
import Cliente from '../models/Cliente.js';

// GET /api/dashboard/resumo
export async function resumo(req, res) {
  try {
    // Somente vendas não canceladas
    const [agregadoVendas] = await Venda.aggregate([
      { $match: { status: { $ne: 'cancelada' } } },
      {
        $group: {
          _id: null,
          totalFaturado: { $sum: '$totais.liquido' },
          totalTransacoes: { $sum: 1 },
        },
      },
    ]);

    const [totalProdutos, totalClientes] = await Promise.all([
      Produto.countDocuments({}),
      Cliente.countDocuments({}),
    ]);

    res.json({
      totalFaturado: agregadoVendas?.totalFaturado || 0,
      totalTransacoes: agregadoVendas?.totalTransacoes || 0,
      totalProdutos,
      totalClientes,
    });
  } catch (err) {
    console.error('[DASHBOARD] resumo erro:', err);
    res.status(500).json({ error: 'Erro ao carregar resumo do dashboard.' });
  }
}

// GET /api/dashboard/receita-mensal
export async function receitaMensal(req, res) {
  try {
    const hoje = new Date();
    const inicio = new Date();
    // últimos 7 dias (hoje incluso)
    inicio.setDate(hoje.getDate() - 6);
    inicio.setHours(0, 0, 0, 0);

    const dados = await Venda.aggregate([
      {
        $match: {
          createdAt: { $gte: inicio },
          status: { $ne: 'cancelada' },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$createdAt' },
          },
          total: { $sum: '$totais.liquido' },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Monta vetor contínuo de dias
    const labels = [];
    const valores = [];
    const mapa = new Map(dados.map((d) => [d._id, d.total]));

    const cursor = new Date(inicio);
    while (cursor <= hoje) {
      const iso = cursor.toISOString().slice(0, 10); // yyyy-mm-dd
      const dia = cursor.getDate().toString().padStart(2, '0');
      const mes = (cursor.getMonth() + 1).toString().padStart(2, '0');

      labels.push(`${dia}/${mes}`);
      valores.push(mapa.get(iso) || 0);

      cursor.setDate(cursor.getDate() + 1);
    }

    res.json({ labels, valores });
  } catch (err) {
    console.error('[DASHBOARD] receitaMensal erro:', err);
    res.status(500).json({ error: 'Erro ao carregar gráfico de receita.' });
  }
}

// GET /api/dashboard/top-produtos
export async function topProdutos(req, res) {
  try {
    const limite = Number(req.query.limit || 5);

    const agregados = await Venda.aggregate([
      { $match: { status: { $ne: 'cancelada' } } },
      { $unwind: '$itens' },
      {
        $group: {
          _id: '$itens.produto',
          nome: { $first: '$itens.nomeProduto' },
          quantidade: { $sum: '$itens.qtd' },
          faturamento: { $sum: '$itens.subtotal' },
        },
      },
      { $sort: { quantidade: -1 } },
      { $limit: limite },
    ]);

    const resultado = agregados.map((item) => ({
      produtoId: item._id,
      nome: item.nome,
      quantidade: item.quantidade,
      faturamento: item.faturamento,
    }));

    res.json(resultado);
  } catch (err) {
    console.error('[DASHBOARD] topProdutos erro:', err);
    res.status(500).json({ error: 'Erro ao carregar produtos mais vendidos.' });
  }
}
