// ====================================================================
// ============================ VENDAS ================================
// ====================================================================

let produtosCacheVenda = [];
let clientesCacheVenda = [];
let carrinhoVenda = [];
let descontoExtraVenda = 0;
let vendaEmEdicao = null; // null = nova venda, string = id em edição
let clienteBuscaTimeout = null;

// --------- Helpers básicos ---------

function formatCurrencyBRL(value) {
    if (value == null || value === '' || isNaN(Number(value))) return 'R$ 0,00';
    return Number(value).toLocaleString('pt-BR', {
        style: 'currency',
        currency: 'BRL',
    });
}

// Data em dd/mm/aaaa
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

function limparSugestoesClientes() {
    const sugestoesEl = document.getElementById('sugestoesCliente');
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

// Busca clientes na API /clientes?q=...
async function buscarClientes(termo) {
    try {
        const params = new URLSearchParams({
            q: termo,
            page: 1,
            limit: 10,
        });

        const res = await api('/clientes?' + params.toString());
        const itens = res.data || res.items || res || [];
        clientesCacheVenda = Array.isArray(itens) ? itens : [];
        return clientesCacheVenda;
    } catch (err) {
        console.error('Erro ao buscar clientes:', err);
        if (typeof showMsg === 'function') {
            showMsg('Erro ao buscar clientes.', 'error');
        }
        return [];
    }
}

// Renderiza lista de sugestões de produtos
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
            (p.cpfCnpj ? ` (${p.cpfCnpj})` : '') +
            (p.precoVenda ? ` - ${formatCurrencyBRL(p.precoVenda)}` : '');
        btn.dataset.id = p._id;
        btn.dataset.nome = p.nome;
        btn.dataset.preco = p.precoVenda ?? 0;
        sugestoesEl.appendChild(btn);
    });

    sugestoesEl.classList.remove('d-none');
}

// Renderiza lista de sugestões de clientes
async function mostrarSugestoesClientes(termo) {
    const sugestoesEl = document.getElementById('sugestoesCliente');
    if (!sugestoesEl) return;

    const texto = (termo || '').trim();
    if (!texto) {
        limparSugestoesClientes();
        return;
    }

    const clientes = await buscarClientes(texto);

    if (!clientes.length) {
        limparSugestoesClientes();
        return;
    }

    sugestoesEl.innerHTML = '';
    clientes.forEach((c) => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'list-group-item list-group-item-action';
        btn.textContent =
            c.nome +
            (c.cpfCnpj ? ` (${c.cpfCnpj})` : '');
        btn.dataset.id = c._id;
        btn.dataset.nome = c.nome;
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

// Converte da API para o label do select
function mapFormaPagamentoFromApi(formaApi) {
    const s = (formaApi || '').toLowerCase();
    if (s === 'pix') return 'Pix';
    if (s === 'cartao_credito') return 'Cartão de crédito';
    if (s === 'cartao_debito') return 'Cartão de débito';
    if (s === 'dinheiro') return 'Dinheiro';
    if (s === 'boleto') return 'Boleto';
    return 'Método de pagamento';
}

// --------------------------------------------------------------------
// Carregar e renderizar últimas vendas na tabela principal
// --------------------------------------------------------------------

async function carregarUltimasVendas() {
    const tbody = document.getElementById('tabelaVendas');
    if (!tbody) return;

    // Mostrar estado "carregando"
    tbody.innerHTML = `
      <tr>
        <td colspan="5" class="text-center text-muted">
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
            <td colspan="5" class="text-center text-danger">
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
            <td colspan="5" class="text-center text-muted">
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

        const id = venda._id || venda.id;

        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td>${clienteNome}</td>
          <td>${descricaoProduto}</td>
          <td>${formatCurrencyBRL(total)}</td>
          <td>${dataStr}</td>
          <td>
            <button type="button" class="btn btn-sm btn-outline-primary btn-venda-ver" data-venda-id="${id}">
              Ver
            </button>
            <button type="button" class="btn btn-sm btn-outline-secondary btn-venda-editar" data-venda-id="${id}">
              Editar
            </button>
            <button type="button" class="btn btn-sm btn-outline-danger btn-venda-excluir" data-venda-id="${id}">
              Excluir
            </button>
          </td>
        `;
        tbody.appendChild(tr);
    });
}

// --------------------------------------------------------------------
// Funções para Ver / Editar / Excluir venda
// --------------------------------------------------------------------

async function buscarVendaPorId(id) {
    return await api(`/vendas/${id}`);
}

async function abrirModalVerVenda(id) {
    try {
        const venda = await buscarVendaPorId(id);
        const container = document.getElementById('detalhesVendaConteudo');
        if (!container) return;

        const itens = venda.itens || [];

        let clienteNome = 'Cliente não informado';
        if (venda.cliente) {
            if (typeof venda.cliente === 'string') {
                clienteNome = venda.cliente;
            } else if (venda.cliente.nome) {
                clienteNome = venda.cliente.nome;
            }
        }
        if (venda.clienteNome) clienteNome = venda.clienteNome;

        const dataStr = formatDateBR(venda.data || venda.createdAt);
        const formaLabel = mapFormaPagamentoFromApi(venda.pagamento?.forma);
        const desconto = venda.pagamento?.desconto || 0;

        let total = venda.total;
        if (total == null) {
            const subtotalCalc = itens.reduce(
                (acc, i) => acc + (i.qtd || 0) * (i.precoUnit || 0),
                0
            );
            total = Math.max(0, subtotalCalc - desconto);
        }

        let itensHtml = '';
        if (!itens.length) {
            itensHtml = '<p class="text-muted">Nenhum item.</p>';
        } else {
            itensHtml = `
              <table class="table table-sm">
                <thead>
                  <tr>
                    <th>Produto</th>
                    <th>Qtd</th>
                    <th>Preço</th>
                    <th>Total</th>
                  </tr>
                </thead>
                <tbody>
                  ${itens
                    .map((i) => {
                        const nomeProd =
                            i.nomeProduto ||
                            (i.produto && i.produto.nome) ||
                            'Produto';
                        const qtd = i.qtd || 1;
                        const precoUnit = i.precoUnit || 0;
                        const sub = qtd * precoUnit;
                        return `
                            <tr>
                              <td>${nomeProd}</td>
                              <td>${qtd}</td>
                              <td>${formatCurrencyBRL(precoUnit)}</td>
                              <td>${formatCurrencyBRL(sub)}</td>
                            </tr>
                          `;
                    })
                    .join('')}
                </tbody>
              </table>
            `;
        }

        container.innerHTML = `
          <p><strong>Cliente:</strong> ${clienteNome}</p>
          <p><strong>Data:</strong> ${dataStr}</p>
          <p><strong>Forma de pagamento:</strong> ${formaLabel}</p>
          <p><strong>Desconto:</strong> ${formatCurrencyBRL(desconto)}</p>
          <p><strong>Total:</strong> ${formatCurrencyBRL(total)}</p>
          <hr>
          <h6>Itens</h6>
          ${itensHtml}
          ${venda.observacoes
                ? `<hr><p><strong>Observações:</strong> ${venda.observacoes}</p>`
                : ''
            }
        `;

        const modalEl = document.getElementById('modalVerVenda');
        if (modalEl && window.bootstrap) {
            const modal =
                bootstrap.Modal.getInstance(modalEl) ||
                bootstrap.Modal.getOrCreateInstance(modalEl);
            modal.show();
        }
    } catch (err) {
        console.error(err);
        if (typeof showMsg === 'function') {
            showMsg('Erro ao carregar detalhes da venda.', 'error');
        }
    }
}

async function carregarVendaParaEdicao(id) {
    try {
        const venda = await buscarVendaPorId(id);
        vendaEmEdicao = venda._id || venda.id;

        const form = document.getElementById('form-venda');
        const inputProduto = document.getElementById('buscarProduto');
        const hiddenProdutoId = document.getElementById('produtoId');
        const inputQtd = document.getElementById('quantidade');
        const inputPrecoUnit = document.getElementById('precoUnit');
        const selectPagamento = document.getElementById('pagamento');
        const inputCupom = document.getElementById('cupom');
        const inputCliente = document.getElementById('clienteNome');
        const hiddenClienteId = document.getElementById('clienteId');

        if (form) form.reset();

        // Monta carrinho a partir dos itens da venda
        const itens = venda.itens || [];
        carrinhoVenda = itens.map((i) => {
            const nomeProd =
                i.nomeProduto ||
                (i.produto && i.produto.nome) ||
                'Produto';
            const qtd = i.qtd || 1;
            const precoUnit =
                i.precoUnit ||
                (i.produto && i.produto.precoVenda) ||
                0;
            return {
                produto:
                    typeof i.produto === 'string'
                        ? i.produto
                        : i.produto?._id,
                nomeProduto: nomeProd,
                qtd,
                precoUnit,
                subtotal: qtd * precoUnit,
            };
        });

        descontoExtraVenda = venda.pagamento?.desconto || 0;

        renderizarCarrinhoVenda();
        atualizarResumoVenda();

        // Cliente
        if (inputCliente && hiddenClienteId) {
            let clienteNome = '';
            let clienteId = '';

            if (venda.clienteNome) {
                clienteNome = venda.clienteNome;
            }
            if (typeof venda.cliente === 'string') {
                clienteNome = clienteNome || venda.cliente;
                clienteId = venda.cliente;
            } else if (venda.cliente?.nome) {
                clienteNome = clienteNome || venda.cliente.nome;
                clienteId = venda.cliente._id;
            }

            inputCliente.value = clienteNome;
            hiddenClienteId.value = clienteId || '';
        }

        // Forma de pagamento
        if (selectPagamento && venda.pagamento?.forma) {
            const label = mapFormaPagamentoFromApi(venda.pagamento.forma);
            selectPagamento.value = label;
        }

        // Cupom (se quiser tratar depois)
        if (inputCupom) {
            inputCupom.value = '';
        }

        // Limpa campos de produto (o usuário edita pelo carrinho)
        if (hiddenProdutoId) hiddenProdutoId.value = '';
        if (inputProduto) inputProduto.value = '';
        if (inputQtd) inputQtd.value = 1;
        if (inputPrecoUnit) inputPrecoUnit.value = '';

        const modalEl = document.getElementById('exampleModal');
        if (modalEl && window.bootstrap) {
            const modal =
                bootstrap.Modal.getInstance(modalEl) ||
                bootstrap.Modal.getOrCreateInstance(modalEl);
            modal.show();
        }
    } catch (err) {
        console.error(err);
        if (typeof showMsg === 'function') {
            showMsg('Erro ao carregar venda para edição.', 'error');
        }
    }
}

async function excluirVenda(id) {
    try {
        const ok = window.confirm('Tem certeza que deseja excluir esta venda?');
        if (!ok) return;

        await api(`/vendas/${id}`, { method: 'DELETE' });

        if (typeof showMsg === 'function') {
            showMsg('Venda excluída com sucesso.', 'success');
        }
        carregarUltimasVendas();
    } catch (err) {
        console.error(err);
        if (typeof showMsg === 'function') {
            showMsg('Erro ao excluir venda.', 'error');
        }
    }
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
    const tabelaVendasEl = document.getElementById('tabelaVendas');

    const inputCliente = document.getElementById('clienteNome');
    const hiddenClienteId = document.getElementById('clienteId');
    const sugestoesClienteEl = document.getElementById('sugestoesCliente');

    // Delegação de eventos para o botão "Excluir" do carrinho
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

    // Delegação de eventos da tabela de vendas (Ver / Editar / Excluir)
    if (tabelaVendasEl) {
        tabelaVendasEl.addEventListener('click', async (e) => {
            const btnVer = e.target.closest('.btn-venda-ver');
            const btnEditar = e.target.closest('.btn-venda-editar');
            const btnExcluir = e.target.closest('.btn-venda-excluir');

            if (!btnVer && !btnEditar && !btnExcluir) return;

            const btn = btnVer || btnEditar || btnExcluir;
            const id = btn.dataset.vendaId;
            if (!id) return;

            if (btnVer) {
                await abrirModalVerVenda(id);
            } else if (btnEditar) {
                await carregarVendaParaEdicao(id);
            } else if (btnExcluir) {
                await excluirVenda(id);
            }
        });
    }

    // Se não está na página de vendas (sem form), só carrega últimas vendas
    if (!form || !inputProduto || !inputQtd || !inputPrecoUnit) {
        if (tabelaVendasEl) carregarUltimasVendas();
        return;
    }

    let produtoSelecionado = null;
    let clienteSelecionado = null;

    // --------- Autocomplete de CLIENTE ---------

    if (inputCliente) {
        inputCliente.addEventListener('input', () => {
            if (hiddenClienteId) hiddenClienteId.value = '';
            clienteSelecionado = null;

            const termo = inputCliente.value.trim();

            // se apagou tudo, limpar sugestões e não buscar
            if (!termo) {
                limparSugestoesClientes();
                return;
            }

            // só começa a buscar a partir de 2 letras (ajuste se quiser 3)
            if (termo.length < 2) {
                limparSugestoesClientes();
                return;
            }

            // debounce simples: espera 300ms depois que o usuário parar de digitar
            if (clienteBuscaTimeout) {
                clearTimeout(clienteBuscaTimeout);
            }
            clienteBuscaTimeout = setTimeout(() => {
                mostrarSugestoesClientes(termo);
            }, 300);
        });

        inputCliente.addEventListener('focus', () => {
            const termo = inputCliente.value.trim();
            if (termo.length >= 2) {
                mostrarSugestoesClientes(termo);
            }
        });

        inputCliente.addEventListener('blur', () => {
            setTimeout(() => limparSugestoesClientes(), 200);
        });
    }


    if (sugestoesClienteEl) {
        sugestoesClienteEl.addEventListener('click', (e) => {
            const btn = e.target.closest('button[data-id]');
            if (!btn) return;

            const id = btn.dataset.id;
            const nome = btn.dataset.nome;

            if (hiddenClienteId) hiddenClienteId.value = id;
            if (inputCliente) inputCliente.value = nome;

            clienteSelecionado = { _id: id, nome };

            limparSugestoesClientes();
        });
    }

    // --------- Autocomplete de PRODUTO ---------

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

            // 🔄 Limpa campos de produto para facilitar adicionar outro
            if (hiddenProdutoId) hiddenProdutoId.value = '';
            if (inputProduto) inputProduto.value = '';
            if (inputPrecoUnit) inputPrecoUnit.value = '';
            inputQtd.value = 1;
            produtoSelecionado = null;
            limparSugestoesProdutos();
        });
    }

    // --------- Cupom (placeholder) ---------

    if (btnAplicarCupom && inputCupom) {
        btnAplicarCupom.addEventListener('click', () => {
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

    // --------- Submit do formulário (Finalizar / Atualizar venda) ---------

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

        // Cliente opcional: se tiver ID, manda como cliente; se tiver nome, manda clienteNome
        if (hiddenClienteId && hiddenClienteId.value) {
            body.cliente = hiddenClienteId.value;
        }
        if (inputCliente && inputCliente.value.trim()) {
            body.clienteNome = inputCliente.value.trim();
        }

        try {
            const url = vendaEmEdicao ? `/vendas/${vendaEmEdicao}` : '/vendas';
            const method = vendaEmEdicao ? 'PUT' : 'POST';

            const vendaSalva = await api(url, {
                method,
                body: JSON.stringify(body),
            });

            console.log('Venda salva:', vendaSalva);
            if (typeof showMsg === 'function') {
                showMsg(
                    vendaEmEdicao
                        ? 'Venda atualizada com sucesso.'
                        : 'Venda cadastrada com sucesso.',
                    'success'
                );
            }

            // Reseta estado
            vendaEmEdicao = null;
            carrinhoVenda = [];
            descontoExtraVenda = 0;
            renderizarCarrinhoVenda();
            atualizarResumoVenda();
            form.reset();
            if (hiddenProdutoId) hiddenProdutoId.value = '';
            if (hiddenClienteId) hiddenClienteId.value = '';
            if (inputPrecoUnit) inputPrecoUnit.value = '';
            if (inputProduto) inputProduto.value = '';
            if (inputCliente) inputCliente.value = '';

            // Fecha modal
            const modalEl = document.getElementById('exampleModal');
            if (modalEl && window.bootstrap) {
                const modal =
                    bootstrap.Modal.getInstance(modalEl) ||
                    bootstrap.Modal.getOrCreateInstance(modalEl);
                modal.hide();
            }

            // Recarrega tabela de vendas
            carregarUltimasVendas();
        } catch (err) {
            console.error(err);
            if (typeof showMsg === 'function') {
                showMsg(err.message || 'Erro ao salvar venda.', 'error');
            }
        }
    });

    // Ao carregar a página, busca as últimas vendas
    carregarUltimasVendas();
});
