import Produto from '../models/Produto.js';

/**
 * Serviços de controle de estoque usados pelas vendas.
 */

// Baixa estoque de vários itens de uma vez
export async function baixarEstoquePorItens(itens = []) {
  if (!Array.isArray(itens) || !itens.length) return;

  for (const item of itens) {
    const prodId = item.produto;
    const qtd = Number(item.qtd || 0);

    if (!prodId || !qtd) continue;

    // Só baixa se tiver estoque suficiente
    const atualizado = await Produto.findOneAndUpdate(
      { _id: prodId, estoque: { $gte: qtd } },
      { $inc: { estoque: -qtd } },
      { new: true }
    );

    if (!atualizado) {
      throw new Error('Estoque insuficiente para o produto selecionado.');
    }
  }
}

// Reposição de estoque (ex: ao excluir uma venda)
export async function reporEstoquePorItens(itens = []) {
  if (!Array.isArray(itens) || !itens.length) return;

  for (const item of itens) {
    const prodId = item.produto;
    const qtd = Number(item.qtd || 0);

    if (!prodId || !qtd) continue;

    await Produto.findByIdAndUpdate(
      prodId,
      { $inc: { estoque: qtd } },
      { new: true }
    );
  }
}
