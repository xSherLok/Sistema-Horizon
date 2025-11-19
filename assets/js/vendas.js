// ====================================================================
// ============================ VENDAS ================================
// ====================================================================

let produtosCacheVenda = [];
let carrinhoVenda = [];
let descontoExtraVenda = 0;

// --------- Helpers básicos ---------

function formatCurrencyBRL(value) {
    if (value == null || value === '' || isNaN(Number(value))) return 'R$ 0,00';
    return Number(value).toLocaleString('pt-BR', {
        style: 'currency',
        currency: 'BRL',
    });
}

// NOVO: formatar data no padrão brasileiro (dd/mm/aaaa)
function formatDateBR(value) {
    if (!value) return '';
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return value;
    return d.toLocaleDateString('pt-BR');
}

function limparSugestoesProdutos() {
    const sugestoesEl = document.getElementById('sugestoes');
    if (!sugestoesEl) return;
    sugestoesEl.innerHTML = '';
    sugestoesEl.classList.add('d-none');
}

// Busca produtos na API /produtos?q=...
async function buscarProdutos(termo) {
    try {
        const params = new URLSearchParams({
            q: termo,
            page: 1,
            limit: 10,
        });

        const res = await api('/produtos?' + params.toString());
        // padrão do backend: { total, page, limit, data }
        const itens = res.data || res.items || res || [];
        produtosCacheVenda = Array.isArray(itens) ? itens : [];
        return produtosCacheVenda;
    } catch (err) {
        console.error('Erro ao buscar produtos:', err);
        if (typeof showMsg === 'function') {
            showMsg('Erro ao buscar produtos.', 'error');
        }
        return [];
    }
}

// Renderiza lista de sugestões abaixo do input
async function mostrarSugestoesProdutos(termo) {
    const sugestoesEl = document.getElementById('sugestoes');
    if (!sugestoesEl) return;

    const texto = (termo || '').trim();
    if (!texto) {
        limparSugestoesProdutos();
        return;
    }

    const produtos = await buscarProdutos(texto);

    if (!produtos.length) {
        limparSugestoesProdutos();
        return;
    }

    sugestoesEl.innerHTML = '';
    produtos.forEach((p) => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'list-group-item list-group-item-action';
        btn.textContent =
            p.nome +
            (p.ean ? ` (EAN: ${p.ean})` : '') +
            (p.precoVenda ? ` - ${formatCurrencyBRL(p.precoVenda)}` : '');
        btn.dataset.id = p._id;
        btn.dataset.nome = p.nome;
        btn.dataset.preco = p.precoVenda ?? 0;
        sugestoesEl.appendChild(btn);
    });

    sugestoesEl.classList.remove('d-none');
}

// Atualiza tabela do carrinho na coluna da direita do modal
function renderizarCarrinhoVenda() {
    const tbody = document.getElementById('tabelaCarrinho');
    if (!tbody) return;

    tbody.innerHTML = '';

    if (!carrinhoVenda.length) {
        const tr = document.createElement('tr');
        tr.innerHTML =
            '<td colspan="5" class="text-center text-muted">Nenhum item</td>';
        tbody.appendChild(tr);
        return;
    }

    carrinhoVenda.forEach((item, index) => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${item.nomeProduto}</td>
            <td>${item.qtd}</td>
            <td>${formatCurrencyBRL(item.precoUnit)}</td>
            <td>${formatCurrencyBRL(item.subtotal)}</td>
            <td>
                <button
                    type="button"
                    class="btn btn-sm btn-outline-danger btn-remover-item"
                    data-remover-index="${index}"
                >
                    Excluir
                </button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}


// Remove 1 item do carrinho (usado pelo botão "Excluir")
function removerItemCarrinho(index) {
    if (index < 0 || index >= carrinhoVenda.length) return;
    carrinhoVenda.splice(index, 1);
    renderizarCarrinhoVenda();
    atualizarResumoVenda();
}

// deixa a função disponível para o onclick no HTML
window.removerItemCarrinho = removerItemCarrinho;


// Atualiza subtotal / desconto / total
function atualizarResumoVenda() {
    const subtotalSpan = document.getElementById('subtotal');
    const descontoSpan = document.getElementById('desconto');
    const totalSpan = document.getElementById('total');

    const subtotal = carrinhoVenda.reduce((acc, i) => acc + i.subtotal, 0);
    const desconto = descontoExtraVenda || 0;
    const total = Math.max(0, subtotal - desconto);

    if (subtotalSpan) subtotalSpan.textContent = formatCurrencyBRL(subtotal);
    if (descontoSpan) descontoSpan.textContent = formatCurrencyBRL(desconto);
    if (totalSpan) totalSpan.textContent = formatCurrencyBRL(total);
}

// Converte o texto do select de pagamento para o valor que o backend espera
function mapFormaPagamentoToApi(formaUi) {
    const s = (formaUi || '').toLowerCase();
    if (s.includes('pix')) return 'pix';
    if (s.includes('crédito') || s.includes('credito')) return 'cartao_credito';
    if (s.includes('débito') || s.includes('debito')) return 'cartao_debito';
    if (s.includes('dinheiro')) return 'dinheiro';
    if (s.includes('boleto')) return 'boleto';
    return 'outro';
}

// --------------------------------------------------------------------
// NOVO: Carregar e renderizar últimas vendas na tabela principal
// --------------------------------------------------------------------

async function carregarUltimasVendas() {
    const tbody = document.getElementById('tabelaVendas');
    if (!tbody) return;

    // Mostrar estado "carregando"
    tbody.innerHTML = `
      <tr>
        <td colspan="4" class="text-center text-muted">
          Carregando últimas vendas...
        </td>
      </tr>
    `;

    try {
        const params = new URLSearchParams({
            page: 1,
            limit: 20,
        });

        const res = await api('/vendas?' + params.toString());
        const vendas = res.data || res.items || res || [];

        renderizarTabelaVendas(vendas);
    } catch (err) {
        console.error('Erro ao carregar últimas vendas:', err);
        tbody.innerHTML = `
          <tr>
            <td colspan="4" class="text-center text-danger">
              Erro ao carregar últimas vendas.
            </td>
          </tr>
        `;
    }
}

function renderizarTabelaVendas(vendas) {
    const tbody = document.getElementById('tabelaVendas');
    if (!tbody) return;

    tbody.innerHTML = '';

    if (!vendas || !vendas.length) {
        tbody.innerHTML = `
          <tr>
            <td colspan="4" class="text-center text-muted">
              Nenhuma venda encontrada.
            </td>
          </tr>
        `;
        return;
    }

    vendas.forEach((venda) => {
        // Cliente
        let clienteNome = 'Cliente não informado';
        if (venda.cliente) {
            if (typeof venda.cliente === 'string') {
                clienteNome = venda.cliente;
            } else if (venda.cliente.nome) {
                clienteNome = venda.cliente.nome;
            }
        }
        if (venda.clienteNome) {
            clienteNome = venda.clienteNome;
        }

        // Produtos
        let descricaoProduto = '—';
        const itens = venda.itens || [];

        if (itens.length === 1) {
            const i = itens[0];
            const nomeProd =
                i.nomeProduto ||
                (i.produto && i.produto.nome) ||
                'Produto';
            const qtd = i.qtd || 1;
            descricaoProduto = `${qtd}x ${nomeProd}`;
        } else if (itens.length > 1) {
            const i = itens[0];
            const nomeProd =
                i.nomeProduto ||
                (i.produto && i.produto.nome) ||
                'Produto';
            descricaoProduto = `${itens.length} itens (1º: ${nomeProd})`;
        }

        // Total
        let total = venda.total;
        if (total == null) {
            const subtotalCalc = itens.reduce(
                (acc, i) => acc + (i.qtd || 0) * (i.precoUnit || 0),
                0
            );
            const desc = venda.pagamento?.desconto || 0;
            total = Math.max(0, subtotalCalc - desc);
        }

        // Data
        const dataStr = formatDateBR(venda.data || venda.createdAt);

        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td>${clienteNome}</td>
          <td>${descricaoProduto}</td>
          <td>${formatCurrencyBRL(total)}</td>
          <td>${dataStr}</td>
        `;
        tbody.appendChild(tr);
    });
}

// --------------------------------------------------------------------
// DOMContentLoaded
// --------------------------------------------------------------------

document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('form-venda');
    const inputProduto = document.getElementById('buscarProduto');
    const hiddenProdutoId = document.getElementById('produtoId');
    const sugestoesEl = document.getElementById('sugestoes');
    const inputQtd = document.getElementById('quantidade');
    const inputPrecoUnit = document.getElementById('precoUnit');
    const btnAdicionar = document.getElementById('btnAdicionar');
    const btnAplicarCupom = document.getElementById('aplicarCupom');
    const inputCupom = document.getElementById('cupom');
    const selectPagamento = document.getElementById('pagamento');

        const tabelaCarrinhoEl = document.getElementById('tabelaCarrinho');

    // Delegação de eventos para o botão "Excluir" (sem onclick inline)
    if (tabelaCarrinhoEl) {
        tabelaCarrinhoEl.addEventListener('click', (e) => {
            const btn = e.target.closest('.btn-remover-item');
            if (!btn) return;

            const index = Number(btn.dataset.removerIndex);
            if (!Number.isNaN(index)) {
                removerItemCarrinho(index);
            }
        });
    }


    // Se não está na página de vendas, não faz nada
    if (!form || !inputProduto || !inputQtd || !inputPrecoUnit) {
        // Mas se existir tabela de vendas, ainda podemos carregar as últimas
        const tbl = document.getElementById('tabelaVendas');
        if (tbl) carregarUltimasVendas();
        return;
    }

    let produtoSelecionado = null;

    // --------- Autocomplete de produto ---------

    inputProduto.addEventListener('input', () => {
        if (hiddenProdutoId) hiddenProdutoId.value = '';
        produtoSelecionado = null;
        inputPrecoUnit.value = '';

        const termo = inputProduto.value.trim();
        if (!termo) {
            limparSugestoesProdutos();
            return;
        }
        mostrarSugestoesProdutos(termo);
    });

    inputProduto.addEventListener('focus', () => {
        if (inputProduto.value.trim()) {
            mostrarSugestoesProdutos(inputProduto.value.trim());
        }
    });

    inputProduto.addEventListener('blur', () => {
        setTimeout(() => limparSugestoesProdutos(), 200);
    });

    // Clique em uma sugestão de produto
    if (sugestoesEl) {
        sugestoesEl.addEventListener('click', (e) => {
            const btn = e.target.closest('button[data-id]');
            if (!btn) return;

            const id = btn.dataset.id;
            const nome = btn.dataset.nome;
            const preco = Number(btn.dataset.preco || 0);

            if (hiddenProdutoId) hiddenProdutoId.value = id;
            inputProduto.value = nome;
            inputPrecoUnit.value = preco ? preco.toString().replace('.', ',') : '';

            produtoSelecionado = {
                _id: id,
                nome,
                precoVenda: preco,
            };

            limparSugestoesProdutos();
        });
    }

    // --------- Botão "Adicionar" ao carrinho ---------

    if (btnAdicionar) {
        btnAdicionar.addEventListener('click', () => {
            const qtd = Number(inputQtd.value || 1);

            if (!produtoSelecionado || !hiddenProdutoId?.value) {
                if (typeof showMsg === 'function') {
                    showMsg(
                        'Selecione um produto válido na lista de sugestões antes de adicionar.',
                        'error'
                    );
                }
                return;
            }

            if (!qtd || qtd <= 0) {
                if (typeof showMsg === 'function') {
                    showMsg('Informe uma quantidade válida (>= 1).', 'error');
                }
                return;
            }

            const precoUnit =
                produtoSelecionado.precoVenda ??
                Number((inputPrecoUnit.value || '0').replace(',', '.')) ??
                0;

            const subtotal = qtd * precoUnit;

            // Se já existe no carrinho, soma a quantidade
            const existente = carrinhoVenda.find(
                (i) => i.produto === produtoSelecionado._id
            );
            if (existente) {
                existente.qtd += qtd;
                existente.subtotal = existente.qtd * existente.precoUnit;
            } else {
                carrinhoVenda.push({
                    produto: produtoSelecionado._id,
                    nomeProduto: produtoSelecionado.nome,
                    qtd,
                    precoUnit,
                    subtotal,
                });
            }

            renderizarCarrinhoVenda();
            atualizarResumoVenda();

            // Reseta quantidade para 1, mas mantém produto selecionado
            inputQtd.value = 1;
        });
    }

    // --------- Cupom (por enquanto só marca desconto = 0) ---------

    if (btnAplicarCupom && inputCupom) {
        btnAplicarCupom.addEventListener('click', () => {
            // Aqui dá pra colocar lógica de cupom depois.
            // Por enquanto só zera descontoExtraVenda e avisa.
            descontoExtraVenda = 0;
            atualizarResumoVenda();
            if (typeof showMsg === 'function') {
                showMsg(
                    'Cupom registrado, mas a lógica de desconto ainda não foi implementada.',
                    'info'
                );
            }
        });
    }

    // --------- Submit do formulário (Finalizar venda) ---------

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        if (!carrinhoVenda.length) {
            if (typeof showMsg === 'function') {
                showMsg('Adicione pelo menos um item à venda.', 'error');
            }
            return;
        }

        const formaUi = selectPagamento?.value || '';
        if (!formaUi || formaUi.toLowerCase().includes('método')) {
            if (typeof showMsg === 'function') {
                showMsg('Selecione a forma de pagamento.', 'error');
            }
            return;
        }

        const formaApi = mapFormaPagamentoToApi(formaUi);

        const body = {
            // cliente: pode ser integrado depois se você tiver cliente na venda
            itens: carrinhoVenda.map((i) => ({
                produto: i.produto,
                qtd: i.qtd,
                precoUnit: i.precoUnit,
            })),
            pagamento: {
                forma: formaApi,
                desconto: descontoExtraVenda || 0,
            },
            observacoes: inputCupom?.value
                ? `Cupom informado: ${inputCupom.value}`
                : undefined,
        };

        try {
            const vendaCriada = await api('/vendas', {
                method: 'POST',
                body: JSON.stringify(body),
            });

            console.log('Venda criada:', vendaCriada);
            if (typeof showMsg === 'function') {
                showMsg('Venda cadastrada com sucesso.', 'success');
            }

            // Limpa estado e UI
            carrinhoVenda = [];
            descontoExtraVenda = 0;
            renderizarCarrinhoVenda();
            atualizarResumoVenda();
            form.reset();
            if (hiddenProdutoId) hiddenProdutoId.value = '';
            inputPrecoUnit.value = '';

            // Fecha modal
            const modalEl = document.getElementById('exampleModal');
            if (modalEl && window.bootstrap) {
                const modal =
                    bootstrap.Modal.getInstance(modalEl) ||
                    bootstrap.Modal.getOrCreateInstance(modalEl);
                modal.hide();
            }

            // NOVO: recarrega a tabela de últimas vendas na tela principal
            carregarUltimasVendas();
        } catch (err) {
            console.error(err);
            if (typeof showMsg === 'function') {
                showMsg(err.message || 'Erro ao salvar venda.', 'error');
            }
        }
    });

    // NOVO: ao carregar a página, busca as últimas vendas
    carregarUltimasVendas();
});
