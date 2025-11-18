// ====================================================================
// ========================== CONTAS A PAGAR ==========================
// ====================================================================

let fornecedoresCache = [];

// ------------ Utils gerais ------------

function formatCurrencyBRL(value) {
  if (value == null || value === '' || isNaN(Number(value))) return 'R$ 0,00';
  return Number(value).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function parseDateInputToISO(value) {
  // value vem no formato "YYYY-MM-DD" do input[type=date]
  if (!value) return null;
  // Monta uma data "neutra" e converte pra ISO só pra o backend receber um formato padrão
  const d = new Date(value + 'T12:00:00'); // 12h evita problema de fuso voltando um dia
  if (isNaN(d.getTime())) return null;
  return d.toISOString();
}

function isoToDateOnly(value) {
  // Garante que sempre pegue a parte YYYY-MM-DD em UTC
  if (!value) return '';
  const d = new Date(value);
  if (isNaN(d.getTime())) return '';
  return d.toISOString().slice(0, 10); // "YYYY-MM-DD"
}

function formatDateBR(value) {
  const iso = isoToDateOnly(value); // "YYYY-MM-DD"
  if (!iso) return '-';
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
}

function statusInfoPagar(status) {
  switch ((status || '').toLowerCase()) {
    case 'paga':
      return { text: 'Pago', className: 'badge bg-success' };
    case 'vencida':
      return { text: 'Atrasado', className: 'badge bg-danger' };
    case 'cancelada':
      return { text: 'Cancelada', className: 'badge bg-secondary' };
    case 'aberta':
    default:
      return { text: 'Em aberto', className: 'badge bg-warning text-dark' };
  }
}


function mapStatusPagarToApi(uiStatus) {
  const s = (uiStatus || '').toLowerCase();
  if (s.includes('pago')) return 'paga';
  if (s.includes('atras')) return 'vencida';
  if (s.includes('cancel')) return 'cancelada';
  return 'aberta';
}

function mapStatusPagarToUi(apiStatus) {
  const s = (apiStatus || '').toLowerCase();
  if (s === 'paga') return 'Pago';
  if (s === 'vencida') return 'Atrasado';
  if (s === 'cancelada') return 'Cancelada';
  return 'Em aberto';
}

// ===================== LISTAGEM =====================

async function carregarContasPagar(page = 1) {
  const tabela = document.querySelector('.main-content table');
  if (!tabela) return;

  const buscaInput = document.querySelector('.topbar input[type="text"]');
  const q = (buscaInput && buscaInput.value || '').trim();

  const params = new URLSearchParams({ page, limit: 10 });
  if (q) params.set('q', q);

  try {
    const res = await api('/contas-pagar?' + params.toString());
    const contas = res.data || res.items || res || [];
    console.log('Contas a pagar recebidas:', contas);

    const tbody = tabela.querySelector('tbody');
    if (!tbody) return;
    tbody.innerHTML = '';

    contas.forEach(c => {
      const info = statusInfoPagar(c.status);

      const vencimento = c.vencimento ? formatDateBR(c.vencimento) : '-';
      const pagamento = c.pagamento ? formatDateBR(c.pagamento) : '-';

      // tenta achar a descrição em vários campos
      const descricao =
        c.descricao ||
        c.documento ||
        c.titulo ||
        c.nomeConta ||
        '-';

      // trata fornecedor como objeto OU como string/id
      let fornecedorNome = '-';
      if (c.fornecedor) {
        if (typeof c.fornecedor === 'string') {
          fornecedorNome = c.fornecedor; // ainda sem populate → mostra ID mesmo
        } else {
          fornecedorNome =
            c.fornecedor.nome ||
            c.fornecedor.razaoSocial ||
            c.fornecedor.nomeFantasia ||
            c.fornecedor.fantasia ||
            '-';
        }
      } else if (c.fornecedorNome || c.nomeFornecedor) {
        fornecedorNome = c.fornecedorNome || c.nomeFornecedor;
      }

      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${descricao}</td>
        <td>${fornecedorNome}</td>
        <td>${formatCurrencyBRL(c.valor)}</td>
        <td>${vencimento}</td>
        <td><span class="${info.className}">${info.text}</span></td>
        <td>${pagamento}</td>
        <td class="text-end">
          <button type="button" class="btn btn-sm btn-outline-secondary" data-edit="${c._id}">Editar</button>
          <button type="button" class="btn btn-sm btn-success ms-1" data-pagar="${c._id}" ${c.status === 'paga' ? 'disabled' : ''}>Marcar como pago</button>
          <button type="button" class="btn btn-sm btn-danger ms-1" data-del="${c._id}">Excluir</button>
        </td>
      `;
      tbody.appendChild(tr);
    });
  } catch (err) {
    console.error(err);
    if (typeof showMsg === 'function') showMsg(err.message || 'Erro ao carregar contas a pagar.', 'error');
  }
}

// ===================== FORM / PREENCHER =====================

function preencherFormContaPagar(conta) {
  const form = document.getElementById('form-conta');
  if (!form || !conta) return;

  form.dataset.id = conta._id || '';

  const inputFornecedor = document.getElementById('conFornecedor');
  const hiddenFornecedorId = document.getElementById('conFornecedorId');

  const descricao = document.getElementById('conDescricao');
  const valor = document.getElementById('conValor');
  const vencimento = document.getElementById('conVencimento');
  const pagamento = document.getElementById('conPagamento');
  const status = document.getElementById('conStatus');
  const formaPgto = document.getElementById('conFormaPgto');
  const centroCusto = document.getElementById('conCentroCusto');
  const obs = document.getElementById('conObs');

  if (conta.fornecedor) {
    const nomeFornecedor =
      conta.fornecedor.nome ||
      conta.fornecedor.razaoSocial ||
      conta.fornecedor.nomeFantasia ||
      conta.fornecedor.fantasia ||
      '';

    if (inputFornecedor) inputFornecedor.value = nomeFornecedor;
    if (hiddenFornecedorId) hiddenFornecedorId.value = conta.fornecedor._id || '';
  }

  if (descricao) descricao.value = conta.descricao || conta.documento || '';
  if (valor) valor.value = conta.valor != null ? conta.valor : '';
  if (vencimento) vencimento.value = isoToDateOnly(conta.vencimento);
  if (pagamento) pagamento.value = isoToDateOnly(conta.pagamento);
  if (status) status.value = mapStatusPagarToUi(conta.status);
  if (formaPgto) formaPgto.value = conta.formaPgto || conta.forma || 'Pix';
  if (centroCusto) centroCusto.value = conta.centroCusto || '';
  if (obs) obs.value = conta.observacoes || '';
}

function limparFormContaPagar() {
  const form = document.getElementById('form-conta');
  if (!form) return;
  form.reset();
  delete form.dataset.id;

  const hiddenFornecedorId = document.getElementById('conFornecedorId');
  if (hiddenFornecedorId) hiddenFornecedorId.value = '';
}

// ===================== FORNECEDORES / AUTOCOMPLETE =====================

async function carregarFornecedoresCache() {
  if (fornecedoresCache.length > 0) return fornecedoresCache;

  try {
    const lista = await api('/fornecedores');

    console.log('Resposta bruta de /fornecedores:', lista);

    let arr = [];

    if (Array.isArray(lista)) {
      arr = lista;
    } else if (Array.isArray(lista.data)) {
      arr = lista.data;
    } else if (Array.isArray(lista.fornecedores)) {
      arr = lista.fornecedores;
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

    fornecedoresCache = arr;
    console.log('Fornecedores carregados:', fornecedoresCache.length, fornecedoresCache);
    return fornecedoresCache;
  } catch (err) {
    console.error(err);
    if (typeof showMsg === 'function') {
      showMsg('Erro ao carregar fornecedores para busca.', 'error');
    }
    return [];
  }
}

async function mostrarSugestoesFornecedor(nomeParcial) {
  const sugestoesEl = document.getElementById('conFornecedorSugestoes');
  if (!sugestoesEl) return;

  const termo = (nomeParcial || '').trim().toLowerCase();
  if (!termo) {
    sugestoesEl.style.display = 'none';
    sugestoesEl.innerHTML = '';
    return;
  }

  const fornecedores = await carregarFornecedoresCache();

  const filtrados = fornecedores
    .filter(f =>
      ((f.nome || f.razaoSocial || f.nomeFantasia || f.fantasia || '')).toLowerCase().includes(termo)
    )
    .slice(0, 10);

  if (filtrados.length === 0) {
    sugestoesEl.style.display = 'none';
    sugestoesEl.innerHTML = '';
    return;
  }

  sugestoesEl.innerHTML = '';

  filtrados.forEach(f => {
    const nomeExibicao = f.nome || f.razaoSocial || f.nomeFantasia || f.fantasia || 'Fornecedor sem nome';
    const doc = f.cpfCnpj || f.cnpj || '';
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'list-group-item list-group-item-action';
    btn.textContent = nomeExibicao + (doc ? ` (${doc})` : '');
    btn.dataset.id = f._id;
    btn.dataset.nome = nomeExibicao;
    sugestoesEl.appendChild(btn);
  });

  sugestoesEl.style.display = 'block';
}

window.mostrarSugestoesFornecedor = mostrarSugestoesFornecedor;

// ===================== DOMContentLoaded =====================

document.addEventListener('DOMContentLoaded', () => {
  const tabela = document.querySelector('.main-content table');
  const form = document.getElementById('form-conta');

  if (!tabela || !form) return; // não está na tela de contas a pagar

  carregarContasPagar();

  const buscaInput = document.querySelector('.topbar input[type="text"]');
  if (buscaInput && typeof debounce === 'function') {
    buscaInput.addEventListener('input', debounce(() => carregarContasPagar(), 400));
  }

  // Autocomplete de fornecedor
  const inputFornecedor = document.getElementById('conFornecedor');
  const hiddenFornecedorId = document.getElementById('conFornecedorId');
  const sugestoesEl = document.getElementById('conFornecedorSugestoes');

  if (inputFornecedor && hiddenFornecedorId && sugestoesEl) {
    inputFornecedor.addEventListener('input', () => {
      hiddenFornecedorId.value = '';
      mostrarSugestoesFornecedor(inputFornecedor.value);
    });

    inputFornecedor.addEventListener('focus', () => {
      if (inputFornecedor.value.trim().length > 0) {
        mostrarSugestoesFornecedor(inputFornecedor.value);
      }
    });

    sugestoesEl.addEventListener('click', (e) => {
      const btn = e.target.closest('button[data-id]');
      if (!btn) return;

      const id = btn.dataset.id;
      const nome = btn.dataset.nome;

      inputFornecedor.value = nome;
      hiddenFornecedorId.value = id;

      sugestoesEl.style.display = 'none';
      sugestoesEl.innerHTML = '';
    });

    inputFornecedor.addEventListener('blur', () => {
      setTimeout(() => {
        sugestoesEl.style.display = 'none';
      }, 200);
    });
  }

  // Submit do formulário
  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const fornecedorNome = document.getElementById('conFornecedor')?.value.trim();
    const fornecedorId = document.getElementById('conFornecedorId')?.value.trim();

    const descricao = document.getElementById('conDescricao')?.value.trim();
    const valorStr = document.getElementById('conValor')?.value.replace(',', '.');
    const vencimento = document.getElementById('conVencimento')?.value;
    const pagamento = document.getElementById('conPagamento')?.value;
    const statusUi = document.getElementById('conStatus')?.value;
    const formaPgto = document.getElementById('conFormaPgto')?.value;
    const centro = document.getElementById('conCentroCusto')?.value.trim();
    const obs = document.getElementById('conObs')?.value.trim();

    const valor = Number(valorStr || 0);

    if (!fornecedorNome || !fornecedorId || !descricao || !valor || !vencimento) {
      if (typeof showMsg === 'function') {
        showMsg('Preencha fornecedor (selecionado na lista), descrição, valor e vencimento.', 'error');
      }
      return;
    }

    const body = {
      descricao,
      valor,
      vencimento: parseDateInputToISO(vencimento),
      pagamento: pagamento ? parseDateInputToISO(pagamento) : null,
      status: mapStatusPagarToApi(statusUi),
      formaPgto,
      centroCusto: centro,
      observacoes: obs,
      fornecedor: fornecedorId,
    };

    const id = form.dataset.id;

    try {
      if (id) {
        await api('/contas-pagar/' + id, {
          method: 'PUT',
          body: JSON.stringify(body),
        });
        if (typeof showMsg === 'function') showMsg('Conta atualizada com sucesso.', 'success');
      } else {
        await api('/contas-pagar', {
          method: 'POST',
          body: JSON.stringify(body),
        });
        if (typeof showMsg === 'function') showMsg('Conta cadastrada com sucesso.', 'success');
      }

      const modalEl = document.getElementById('modalNovaConta');
      if (modalEl && window.bootstrap) {
        const modal = bootstrap.Modal.getInstance(modalEl) || bootstrap.Modal.getOrCreateInstance(modalEl);
        modal.hide();
      }

      limparFormContaPagar();
      carregarContasPagar();
    } catch (err) {
      console.error(err);
      if (typeof showMsg === 'function') showMsg(err.message || 'Erro ao salvar conta.', 'error');
    }
  });

  // Clique nos botões da tabela
  tabela.addEventListener('click', async (e) => {
    const btnEdit = e.target.closest('[data-edit]');
    const btnPagar = e.target.closest('[data-pagar]');
    const btnDel = e.target.closest('[data-del]');

    try {
      if (btnEdit) {
        const id = btnEdit.dataset.edit;
        const conta = await api('/contas-pagar/' + id);
        preencherFormContaPagar(conta);

        const modalEl = document.getElementById('modalNovaConta');
        if (modalEl && window.bootstrap) {
          const modal = bootstrap.Modal.getOrCreateInstance(modalEl);
          modal.show();
        }
      } else if (btnPagar) {
        const id = btnPagar.dataset.pagar;
        await api(`/contas-pagar/${id}/baixar`, {
          method: 'POST',
        });
        if (typeof showMsg === 'function') showMsg('Conta marcada como paga.', 'success');
        carregarContasPagar();
      } else if (btnDel) {
        const id = btnDel.dataset.del;
        if (!confirm('Deseja realmente excluir esta conta?')) return;

        await api('/contas-pagar/' + id, {
          method: 'DELETE',
        });
        if (typeof showMsg === 'function') showMsg('Conta excluída com sucesso.', 'success');
        carregarContasPagar();
      }
    } catch (err) {
      console.error(err);
      if (typeof showMsg === 'function') showMsg(err.message || 'Erro ao processar ação.', 'error');
    }
  });

  const modalEl = document.getElementById('modalNovaConta');
  if (modalEl) {
    modalEl.addEventListener('hidden.bs.modal', () => {
      limparFormContaPagar();
    });
  }
});

// Expor função principal (opcional)
window.carregarContasPagar = carregarContasPagar;
