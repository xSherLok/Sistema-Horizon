// ====================================================================
// ======================== CONTAS A RECEBER ==========================
// ====================================================================

let clientesCache = [];

function formatCurrencyBRL(value) {
  if (value == null || value === '' || isNaN(Number(value))) return 'R$ 0,00';
  return Number(value).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function parseDateInputToISO(value) {
  if (!value) return null;
  const d = new Date(value);
  if (isNaN(d.getTime())) return null;
  return d.toISOString();
}

function isoToInputDate(value) {
  if (!value) return '';
  const d = new Date(value);
  if (isNaN(d.getTime())) return '';
  return d.toISOString().slice(0, 10);
}

function statusInfoReceber(status) {
  switch ((status || '').toLowerCase()) {
    case 'recebida':
      return { text: 'Recebido', className: 'badge bg-success' };
    case 'vencida':
      return { text: 'Atrasado', className: 'badge bg-danger' };
    case 'cancelada':
      return { text: 'Cancelada', className: 'badge bg-secondary' };
    case 'aberta':
    default:
      return { text: 'Em aberto', className: 'badge bg-warning text-dark' };
  }
}

function mapStatusReceberToApi(uiStatus) {
  const s = (uiStatus || '').toLowerCase();
  if (s.includes('receb')) return 'recebida';
  if (s.includes('atras')) return 'vencida';
  if (s.includes('cancel')) return 'cancelada';
  return 'aberta';
}

function mapStatusReceberToUi(apiStatus) {
  const s = (apiStatus || '').toLowerCase();
  if (s === 'recebida') return 'Recebido';
  if (s === 'vencida') return 'Atrasado';
  if (s === 'cancelada') return 'Cancelada';
  return 'Em aberto';
}

// ===================== LISTAGEM =====================

async function carregarContasReceber(page = 1) {
  const tabela = document.querySelector('.main-content table');
  if (!tabela) return;

  const buscaInput = document.querySelector('.topbar input[type="text"]');
  const q = (buscaInput && buscaInput.value || '').trim();

  const params = new URLSearchParams({ page, limit: 10 });
  if (q) params.set('q', q);

  try {
    const res = await api('/contas-receber?' + params.toString());
    const contas = res.data || res.items || res || [];
    const tbody = tabela.querySelector('tbody');
    if (!tbody) return;
    tbody.innerHTML = '';

    contas.forEach(c => {
      const info = statusInfoReceber(c.status);
      const emissao = c.emissao ? new Date(c.emissao).toLocaleDateString('pt-BR') : '-';
      const vencimento = c.vencimento ? new Date(c.vencimento).toLocaleDateString('pt-BR') : '-';
      const recebimento = c.recebimento ? new Date(c.recebimento).toLocaleDateString('pt-BR') : '-';

      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${(c.cliente && c.cliente.nome) || '-'}</td>
        <td>${c.documento || '-'}</td>
        <td>${formatCurrencyBRL(c.valor)}</td>
        <td>${emissao}</td>
        <td>${vencimento}</td>
        <td><span class="${info.className}">${info.text}</span></td>
        <td>${recebimento}</td>
        <td class="text-end">
          <button type="button" class="btn btn-sm btn-outline-secondary" data-edit="${c._id}">Editar</button>
          <button type="button" class="btn btn-sm btn-success ms-1" data-receber="${c._id}" ${c.status === 'recebida' ? 'disabled' : ''}>Marcar como recebido</button>
          <button type="button" class="btn btn-sm btn-danger ms-1" data-del="${c._id}">Excluir</button>
        </td>
      `;
      tbody.appendChild(tr);
    });
  } catch (err) {
    console.error(err);
    if (typeof showMsg === 'function') showMsg(err.message || 'Erro ao carregar contas a receber.', 'error');
  }
}

// ===================== FORM / PREENCHER =====================

function preencherFormContaReceber(conta) {
  const form = document.getElementById('form-receita');
  if (!form || !conta) return;

  form.dataset.id = conta._id || '';

  const inputCliente = document.getElementById('recCliente');
  const hiddenClienteId = document.getElementById('recClienteId');

  const descricao = document.getElementById('recDescricao');
  const valor = document.getElementById('recValor');
  const emissao = document.getElementById('recEmissao');
  const vencimento = document.getElementById('recVencimento');
  const recebimento = document.getElementById('recRecebimento');
  const status = document.getElementById('recStatus');
  const forma = document.getElementById('recForma');
  const categoria = document.getElementById('recCategoria');
  const centro = document.getElementById('recCentroCusto');
  const qtdParcelas = document.getElementById('recQtdParcelas');
  const parcelaAtual = document.getElementById('recParcelaAtual');
  const obs = document.getElementById('recObs');
  const emailInput = document.getElementById('recEmail');
  const telInput = document.getElementById('recTelefone');
  const docInput = document.getElementById('recDocumento');

  if (conta.cliente) {
    if (emailInput) emailInput.value = conta.cliente.email || '';
    if (telInput) telInput.value = conta.cliente.telefone || conta.cliente.celular || '';
    if (docInput) docInput.value = conta.cliente.cpfCnpj || conta.cliente.cpf || conta.cliente.cnpj || '';
  }

  if (inputCliente && conta.cliente) {
    inputCliente.value = conta.cliente.nome || '';
  }
  if (hiddenClienteId && conta.cliente) {
    hiddenClienteId.value = conta.cliente._id || '';
  }

  if (descricao) descricao.value = conta.documento || '';
  if (valor) valor.value = conta.valor != null ? conta.valor : '';
  if (emissao) emissao.value = isoToInputDate(conta.emissao);
  if (vencimento) vencimento.value = isoToInputDate(conta.vencimento);
  if (recebimento) recebimento.value = isoToInputDate(conta.recebimento);
  if (status) status.value = mapStatusReceberToUi(conta.status);
  if (forma) forma.value = conta.forma || 'Pix';
  if (categoria) categoria.value = conta.categoria || '';
  if (centro) centro.value = conta.centroCusto || '';
  if (qtdParcelas) qtdParcelas.value = conta.qtdParcelas || 1;
  if (parcelaAtual) parcelaAtual.value = conta.parcelaAtual || 1;
  if (obs) obs.value = conta.observacoes || '';
}

function limparFormContaReceber() {
  const form = document.getElementById('form-receita');
  if (!form) return;
  form.reset();
  delete form.dataset.id;

  const hiddenClienteId = document.getElementById('recClienteId');
  if (hiddenClienteId) hiddenClienteId.value = '';
}

// ===================== CLIENTES / AUTOCOMPLETE =====================

async function carregarClientesCache() {
  if (clientesCache.length > 0) return clientesCache;

  try {
    const lista = await api('/clientes');

    console.log('Resposta bruta de /clientes:', lista); // debug

    let arr = [];

    if (Array.isArray(lista)) {
      arr = lista;
    } else if (Array.isArray(lista.data)) {
      arr = lista.data;
    } else if (Array.isArray(lista.clientes)) {
      arr = lista.clientes;
    } else if (Array.isArray(lista.items)) {
      arr = lista.items;
    } else {
      for (const value of Object.values(lista)) {
        if (Array.isArray(value)) {
          arr = value;
          break;
        }
      }
    }

    clientesCache = arr;
    console.log('Clientes carregados:', clientesCache.length, clientesCache);
    return clientesCache;
  } catch (err) {
    console.error(err);
    if (typeof showMsg === 'function') {
      showMsg('Erro ao carregar clientes para busca.', 'error');
    }
    return [];
  }
}

// Sugestões de clientes no autocomplete
async function mostrarSugestoesCliente(nomeParcial) {
  const sugestoesEl = document.getElementById('recClienteSugestoes');
  if (!sugestoesEl) return;

  const termo = (nomeParcial || '').trim().toLowerCase();
  if (!termo) {
    sugestoesEl.style.display = 'none';
    sugestoesEl.innerHTML = '';
    return;
  }

  const clientes = await carregarClientesCache();

  const filtrados = clientes
    .filter(c => (c.nome || '').toLowerCase().includes(termo))
    .slice(0, 10);

  if (filtrados.length === 0) {
    sugestoesEl.style.display = 'none';
    sugestoesEl.innerHTML = '';
    return;
  }

  sugestoesEl.innerHTML = '';

  filtrados.forEach(c => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'list-group-item list-group-item-action';
    btn.textContent = c.nome + (c.cpfCnpj ? ` (${c.cpfCnpj})` : '');
    btn.dataset.id = c._id;
    btn.dataset.nome = c.nome;
    sugestoesEl.appendChild(btn);
  });

  sugestoesEl.style.display = 'block';
}

// também deixo explícito no escopo global:
window.mostrarSugestoesCliente = mostrarSugestoesCliente;


// ===================== DOMContentLoaded =====================

document.addEventListener('DOMContentLoaded', () => {
  const tabela = document.querySelector('.main-content table');
  const form = document.getElementById('form-receita');

  if (!tabela || !form) return; // não está na tela de contas a receber

  carregarContasReceber();

  // busca geral no topo
  const buscaInput = document.querySelector('.topbar input[type="text"]');
  if (buscaInput && typeof debounce === 'function') {
    buscaInput.addEventListener('input', debounce(() => carregarContasReceber(), 400));
  }

  // Autocomplete de cliente
  const inputCliente = document.getElementById('recCliente');
  const hiddenClienteId = document.getElementById('recClienteId');
  const sugestoesEl = document.getElementById('recClienteSugestoes');

  if (inputCliente && hiddenClienteId && sugestoesEl) {
    // digitação
    inputCliente.addEventListener('input', () => {
      hiddenClienteId.value = '';

      if (inputCliente.value.trim().length === 0) {
        const emailInput = document.getElementById('recEmail');
        const telInput = document.getElementById('recTelefone');
        const docInput = document.getElementById('recDocumento');

        if (emailInput) emailInput.value = '';
        if (telInput) telInput.value = '';
        if (docInput) docInput.value = '';
      }

      mostrarSugestoesCliente(inputCliente.value);
    });

    // foco
    inputCliente.addEventListener('focus', () => {
      if (inputCliente.value.trim().length > 0) {
        mostrarSugestoesCliente(inputCliente.value);
      }
    });

    // clique em sugestão
    sugestoesEl.addEventListener('click', (e) => {
      const btn = e.target.closest('button[data-id]');
      if (!btn) return;

      const id = btn.dataset.id;
      const nome = btn.dataset.nome;

      inputCliente.value = nome;
      hiddenClienteId.value = id;

      // preenche dados do cliente nos outros campos
      const cli = (clientesCache || []).find(c => c._id === id);

      if (cli) {
        const emailInput = document.getElementById('recEmail');
        const telInput = document.getElementById('recTelefone');
        const docInput = document.getElementById('recDocumento');

        if (emailInput) emailInput.value = cli.email || '';
        if (telInput) telInput.value = cli.telefone || cli.celular || '';
        if (docInput) docInput.value = cli.cpfCnpj || cli.cpf || cli.cnpj || '';
      }

      sugestoesEl.style.display = 'none';
      sugestoesEl.innerHTML = '';
    });

    // perdeu foco
    inputCliente.addEventListener('blur', () => {
      setTimeout(() => {
        sugestoesEl.style.display = 'none';
      }, 200);
    });
  }

  // Submit do formulário
  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const clienteNome = document.getElementById('recCliente')?.value.trim();
    const clienteId = document.getElementById('recClienteId')?.value.trim();

    const descricao = document.getElementById('recDescricao')?.value.trim();
    const valorStr = document.getElementById('recValor')?.value.replace(',', '.');
    const emissao = document.getElementById('recEmissao')?.value;
    const vencimento = document.getElementById('recVencimento')?.value;
    const recebimento = document.getElementById('recRecebimento')?.value;
    const statusUi = document.getElementById('recStatus')?.value;
    const forma = document.getElementById('recForma')?.value;
    const categoria = document.getElementById('recCategoria')?.value.trim();
    const centro = document.getElementById('recCentroCusto')?.value.trim();
    const qtdParcelas = Number(document.getElementById('recQtdParcelas')?.value || 1);
    const parcelaAtual = Number(document.getElementById('recParcelaAtual')?.value || 1);
    const obs = document.getElementById('recObs')?.value.trim();

    const valor = Number(valorStr || 0);

    if (!clienteNome || !clienteId || !descricao || !valor || !vencimento) {
      if (typeof showMsg === 'function') {
        showMsg('Preencha cliente (selecionado na lista), descrição, valor e vencimento.', 'error');
      }
      return;
    }

    const body = {
      documento: descricao,
      valor,
      emissao: emissao ? parseDateInputToISO(emissao) : null,
      vencimento: parseDateInputToISO(vencimento),
      recebimento: recebimento ? parseDateInputToISO(recebimento) : null,
      status: mapStatusReceberToApi(statusUi),
      forma,
      categoria,
      centroCusto: centro,
      qtdParcelas,
      parcelaAtual,
      observacoes: obs,
      cliente: clienteId, // ID REAL do cliente
    };

    const id = form.dataset.id;

    try {
      if (id) {
        await api('/contas-receber/' + id, {
          method: 'PUT',
          body: JSON.stringify(body),
        });
        if (typeof showMsg === 'function') showMsg('Receita atualizada com sucesso.', 'success');
      } else {
        await api('/contas-receber', {
          method: 'POST',
          body: JSON.stringify(body),
        });
        if (typeof showMsg === 'function') showMsg('Receita cadastrada com sucesso.', 'success');
      }

      const modalEl = document.getElementById('modalNovaReceita');
      if (modalEl && window.bootstrap) {
        const modal = bootstrap.Modal.getInstance(modalEl) || bootstrap.Modal.getOrCreateInstance(modalEl);
        modal.hide();
      }

      limparFormContaReceber();
      carregarContasReceber();
    } catch (err) {
      console.error(err);
      if (typeof showMsg === 'function') showMsg(err.message || 'Erro ao salvar receita.', 'error');
    }
  });

  // Clique nos botões da tabela
  tabela.addEventListener('click', async (e) => {
    const btnEdit = e.target.closest('[data-edit]');
    const btnReceber = e.target.closest('[data-receber]');
    const btnDel = e.target.closest('[data-del]');

    try {
      if (btnEdit) {
        const id = btnEdit.dataset.edit;
        const conta = await api('/contas-receber/' + id);
        preencherFormContaReceber(conta);

        const modalEl = document.getElementById('modalNovaReceita');
        if (modalEl && window.bootstrap) {
          const modal = bootstrap.Modal.getOrCreateInstance(modalEl);
          modal.show();
        }
      } else if (btnReceber) {
        const id = btnReceber.dataset.receber;
        await api(`/contas-receber/${id}/receber`, {
          method: 'POST',
        });
        if (typeof showMsg === 'function') showMsg('Receita marcada como recebida.', 'success');
        carregarContasReceber();
      } else if (btnDel) {
        const id = btnDel.dataset.del;
        if (!confirm('Deseja realmente excluir este registro?')) return;

        await api('/contas-receber/' + id, {
          method: 'DELETE',
        });
        if (typeof showMsg === 'function') showMsg('Receita excluída com sucesso.', 'success');
        carregarContasReceber();
      }
    } catch (err) {
      console.error(err);
      if (typeof showMsg === 'function') showMsg(err.message || 'Erro ao processar ação.', 'error');
    }
  });

  const modalEl = document.getElementById('modalNovaReceita');
  if (modalEl) {
    modalEl.addEventListener('hidden.bs.modal', () => {
      limparFormContaReceber();
    });
  }
});

// Expor função principal (opcional)
window.carregarContasReceber = carregarContasReceber;
window.mostrarSugestoesCliente = mostrarSugestoesCliente;
