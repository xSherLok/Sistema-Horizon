/* ========= Produtos: helpers ========= */
function _tbodyProdutos() {
  return document.querySelector('#tbodyProdutos') || document.querySelector('table tbody');
}
function _fmtBRL(v) { return (Number(v || 0)).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }); }
function _badgeStatus(st) {
  var s = (st || '').toString().toLowerCase();
  if (s === 'ativo') return '<span class="badge bg-success">Ativo</span>';
  if (s === 'inativo') return '<span class="badge bg-secondary">Inativo</span>';
  return '<span class="badge bg-light text-dark">' + (st || '') + '</span>';
}

/* ========= Lista de produtos (render + ordem correta) ========= */
async function carregarProdutos(page) {
  try {
    page = page || 1;
    var token = localStorage.getItem('token');
    var q = (document.querySelector('#buscaProdutos') || {}).value || '';
    var res = await fetch('/api/produtos?q=' + encodeURIComponent(q) + '&page=' + page + '&limit=50', {
      headers: { 'Authorization': 'Bearer ' + token }
    });
    if (!res.ok) { console.error('GET /api/produtos', res.status); return; }
    var json = await res.json();
    var data = Array.isArray(json) ? json : (json.data || []);
    var tbody = _tbodyProdutos();
    if (!tbody) { console.warn('tbodyProdutos não encontrado'); return; }

    tbody.innerHTML = data.map(function (p) {
      return (
        '<tr>' +
        '<td><strong>' + (p && p.nome || '') + '</strong></td>' +
        '<td>' + (p && p.categoria || '') + '</td>' +
        '<td>' + (p && p.tamanho || '') + '</td>' +
        '<td>' + _fmtBRL(p && p.precoVenda) + '</td>' +
        '<td>' + (p && (p.estoque != null ? p.estoque : 0)) + '</td>' +
        '<td>' + _badgeStatus(p && p.status) + '</td>' +
        '<td>' +
        '<div class="d-flex gap-2">' +
        '<button class="btn btn-sm btn-secondary" data-p-view="' + p._id + '" data-bs-toggle="modal" data-bs-target="#modalVerProduto">Ver</button>' +
        '<button class="btn btn-sm btn-primary" data-p-edit="' + p._id + '" data-bs-toggle="modal" data-bs-target="#modalNovoProduto">Editar</button>' +
        '<button class="btn btn-sm btn-danger" data-p-del="' + p._id + '">Excluir</button>' +
        '</div>' +
        '</td>' +

        '</tr>'
      );
    }).join('');
  } catch (e) { console.error('carregarProdutos erro', e); }
}
window.carregarProdutos = carregarProdutos;

/* ========= Ver produto (preenche modal) ========= */
async function verProduto(id) {
  try {
    if (!id) return;
    var token = localStorage.getItem('token');
    var res = await fetch('/api/produtos/' + id, { headers: { 'Authorization': 'Bearer ' + token } });
    if (!res.ok) { console.error('GET /api/produtos/:id', res.status); return; }
    var p = await res.json();
    var el = document.querySelector('#detalhesProduto');
    if (!el) return;
    var cores = Array.isArray(p.cores) ? p.cores.join(', ') : (p.cores || '');
    el.innerHTML =
      '<div class="row g-3">' +
      '<div class="col-md-6"><small class="text-muted">Nome</small><div class="fw-semibold">' + (p.nome || '') + '</div></div>' +
      '<div class="col-md-3"><small class="text-muted">Categoria</small><div>' + (p.categoria || '') + '</div></div>' +
      '<div class="col-md-3"><small class="text-muted">Tamanho</small><div>' + (p.tamanho || '') + '</div></div>' +
      '<div class="col-md-6"><small class="text-muted">Preço de custo</small><div>' + _fmtBRL(p.precoCusto) + '</div></div>' +
      '<div class="col-md-6"><small class="text-muted">Preço de venda</small><div class="fw-semibold">' + _fmtBRL(p.precoVenda) + '</div></div>' +
      '<div class="col-md-6"><small class="text-muted">Estoque</small><div>' + (p.estoque || 0) + '</div></div>' +
      '<div class="col-md-6"><small class="text-muted">Status</small><div>' + _badgeStatus(p.status) + '</div></div>' +
      '<div class="col-md-6"><small class="text-muted">Fornecedor</small><div>' + ((p.fornecedor && p.fornecedor.nome) || '') + '</div></div>' +
      '<div class="col-md-6"><small class="text-muted">EAN</small><div>' + (p.ean || '') + '</div></div>' +
      '<div class="col-12"><small class="text-muted">Cores</small><div>' + cores + '</div></div>' +
      '<div class="col-12"><small class="text-muted">Descrição</small><div>' + (p.descricao || '') + '</div></div>' +
      '<div class="col-12"><small class="text-muted">Observações</small><div>' + (p.observacoes || '') + '</div></div>' +
      '</div>';
  } catch (e) { console.error('verProduto erro', e); }
}
window.verProduto = verProduto;

/* ========= Editar produto (preenche form) ========= */
async function editarProduto(id) {
  try {
    if (!id) return;
    var token = localStorage.getItem('token');
    var res = await fetch('/api/produtos/' + id, { headers: { 'Authorization': 'Bearer ' + token } });
    if (!res.ok) { console.error('GET /api/produtos/:id', res.status); return; }
    var p = await res.json();
    var form = document.querySelector('#form-produto');
    if (!form) return;
    form.dataset.id = p._id;
    var setVal = function (sel, val) { var el = document.querySelector(sel); if (el) el.value = (val == null ? '' : val); };
    setVal('#nome', p.nome);
    setVal('#categoria', p.categoria);
    setVal('#tamanho', p.tamanho);
    var coresSel = document.querySelector('#cores');
    if (coresSel && Array.isArray(p.cores)) {
      Array.prototype.forEach.call(coresSel.options, function (o) { o.selected = p.cores.indexOf(o.value) !== -1; });
    }
    setVal('#status', p.status ? (p.status.charAt(0).toUpperCase() + p.status.slice(1)) : '');
    setVal('#estoque', p.estoque);
    setVal('#precoCusto', p.precoCusto);
    setVal('#precoVenda', p.precoVenda);
    setVal('#fornecedor', (p.fornecedor && p.fornecedor.nome) || '');
    setVal('#ean', p.ean);
    setVal('#descricao', p.descricao);
    setVal('#observacoes', p.observacoes);
  } catch (e) { console.error('editarProduto erro', e); }
}
window.editarProduto = editarProduto;

/* ========= Excluir produto ========= */
async function excluirProduto(id) {
  try {
    if (!id) return;
    if (!confirm('Confirma excluir este produto?')) return;
    var token = localStorage.getItem('token');
    var res = await fetch('/api/produtos/' + id, { method: 'DELETE', headers: { 'Authorization': 'Bearer ' + token } });
    if (!res.ok) { console.error('DELETE /api/produtos/:id', res.status, await res.text()); alert('Falha ao excluir'); return; }
    await carregarProdutos(1);
  } catch (e) { console.error('excluirProduto erro', e); }
}
window.excluirProduto = excluirProduto;

/* ========= Fornecedores (autocomplete + resolver nome -> _id) ========= */
var __fornecedoresCache = [];
var __fornecedorMapByName = new Map();

async function carregarFornecedoresCombo() {
  const input = document.querySelector('#fornecedor');
  if (!input) return;

  try {
    const token = localStorage.getItem('token');
    const params = new URLSearchParams({
      page: 1,
      limit: 1000,
      // se quiser só ativos:
      // status: 'ativo'
    });

    const res = await fetch('/api/fornecedores?' + params.toString(), {
      headers: { 'Authorization': 'Bearer ' + token }
    });

    if (!res.ok) {
      console.warn('/api/fornecedores', res.status);
      return;
    }

    const j = await res.json();

    // AQUI é a diferença: pega j.items
    const arr = Array.isArray(j)
      ? j
      : (Array.isArray(j.items) ? j.items : []);

    __fornecedoresCache = arr;
    __fornecedorMapByName = new Map();

    // Preenche o map nome -> _id (usado pelo __resolveFornecedorIdFromInput)
    arr.forEach(f => {
      const nome =
        f.nome ||
        f.razaoSocial ||
        f.nomeFantasia ||
        f.fantasia ||
        '';

      if (nome) {
        __fornecedorMapByName.set(nome, f._id);
      }
    });
  } catch (e) {
    console.error('fornecedores erro', e);
  }
}

function __resolveFornecedorIdFromInput() {
  // 1) Se já temos o ID no hidden, usa ele
  var hidden = document.querySelector('#fornecedorId');
  if (hidden && hidden.value) {
    return hidden.value;
  }

  // 2) Fallback: tenta resolver pelo texto digitado (nome)
  var val = (document.querySelector('#fornecedor') || {}).value;
  if (!val) return null;

  if (__fornecedorMapByName.has(val)) {
    return __fornecedorMapByName.get(val);
  }

  var f = __fornecedoresCache.find(function (x) {
    return ((x.nome || x.razaoSocial || x.nomeFantasia || x.fantasia || '') || '')
      .toLowerCase() === val.toLowerCase();
  });

  return f ? f._id : null;
}

/* ========= Autocomplete de fornecedor (tela de produtos) ========= */

async function mostrarSugestoesFornecedorProduto(nomeParcial) {
  var sugestoesEl = document.getElementById('fornecedorSugestoes');
  if (!sugestoesEl) return;

  var termo = (nomeParcial || '').trim().toLowerCase();
  if (!termo) {
    sugestoesEl.style.display = 'none';
    sugestoesEl.innerHTML = '';
    return;
  }

  // Garante que o cache está carregado
  if (!__fornecedoresCache.length) {
    await carregarFornecedoresCombo();
  }

  var filtrados = __fornecedoresCache
    .filter(function (f) {
      var nome = (f.nome || f.razaoSocial || f.nomeFantasia || f.fantasia || '');
      return nome.toLowerCase().includes(termo);
    })
    .slice(0, 10);

  if (!filtrados.length) {
    sugestoesEl.style.display = 'none';
    sugestoesEl.innerHTML = '';
    return;
  }

  sugestoesEl.innerHTML = '';

  filtrados.forEach(function (f) {
    var nomeExibicao = f.nome || f.razaoSocial || f.nomeFantasia || f.fantasia || 'Fornecedor sem nome';
    var doc = f.cpfCnpj || f.cnpj || '';
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'list-group-item list-group-item-action';
    btn.textContent = nomeExibicao + (doc ? ' (' + doc + ')' : '');
    btn.dataset.id = f._id;
    btn.dataset.nome = nomeExibicao;
    sugestoesEl.appendChild(btn);
  });

  sugestoesEl.style.display = 'block';
}



/* ========= Salvar produto (usa _id do fornecedor) ========= */
async function salvarProduto(e) {
  e && e.preventDefault && e.preventDefault();
  var token = localStorage.getItem('token');
  var form = document.querySelector('#form-produto');
  var id = (form && form.dataset && form.dataset.id) || '';
  var gv = function (sel) { var el = document.querySelector(sel); return el ? el.value : ''; };
  var gvm = function (sel) { var el = document.querySelector(sel); return el ? Array.prototype.map.call(el.selectedOptions, function (o) { return o.value; }) : []; };
  var fornecedorId = __resolveFornecedorIdFromInput();
  var body = {
    nome: gv('#nome'),
    categoria: gv('#categoria'),
    tamanho: gv('#tamanho'),
    cores: gvm('#cores'),
    status: (gv('#status') || '').toString().toLowerCase(),
    estoque: Number(gv('#estoque') || 0),
    precoCusto: Number((gv('#precoCusto') || '0').replace('.', '').replace(',', '.')),
    precoVenda: Number((gv('#precoVenda') || '0').replace('.', '').replace(',', '.')),
    fornecedor: fornecedorId,
    ean: gv('#ean'),
    descricao: gv('#descricao'),
    observacoes: gv('#observacoes')
  };
  if (!body.nome) { alert('Informe o nome'); return; }
  var url = id ? '/api/produtos/' + id : '/api/produtos';
  var method = id ? 'PUT' : 'POST';
  var res = await fetch(url, { method: method, headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token }, body: JSON.stringify(body) });
  if (!res.ok) { console.error('salvarProduto', res.status, await res.text()); alert('Erro ao salvar produto'); return; }
  try {
    var modalEl = document.getElementById('modalNovoProduto');
    if (modalEl && window.bootstrap) { (window.bootstrap.Modal.getInstance(modalEl) || new window.bootstrap.Modal(modalEl)).hide(); }
  } catch (_) { }
  form && form.reset && form.reset(); if (form) form.dataset.id = '';
  await carregarProdutos(1);
}
window.salvarProduto = salvarProduto;

/* ========= Init ========= */
document.addEventListener('DOMContentLoaded', function () {
  try {
    if (document.querySelector('#tbodyProdutos') || document.querySelector('#form-produto')) {
      // Carrega cache de fornecedores
      carregarFornecedoresCombo();

      // Lista inicial de produtos
      setTimeout(function () { carregarProdutos(1); }, 0);

      // Busca de produtos
      var inp = document.querySelector('#buscaProdutos');
      if (inp) {
        inp.addEventListener('input', function () { carregarProdutos(1); });
      }

      // ===== Autocomplete fornecedor (igual Contas a Pagar) =====
      var inputFornecedor = document.getElementById('fornecedor');
      var hiddenFornecedorId = document.getElementById('fornecedorId');
      var sugestoesEl = document.getElementById('fornecedorSugestoes');

      if (inputFornecedor && hiddenFornecedorId && sugestoesEl) {
        // Quando digitar, limpa o ID e mostra sugestões
        inputFornecedor.addEventListener('input', function () {
          hiddenFornecedorId.value = '';
          mostrarSugestoesFornecedorProduto(inputFornecedor.value);
        });

        // Ao focar, se já tiver texto, mostra sugestões de novo
        inputFornecedor.addEventListener('focus', function () {
          if (inputFornecedor.value.trim().length > 0) {
            mostrarSugestoesFornecedorProduto(inputFornecedor.value);
          }
        });

        // Clique em uma sugestão
        sugestoesEl.addEventListener('click', function (e) {
          var btn = e.target.closest('button[data-id]');
          if (!btn) return;

          inputFornecedor.value = btn.dataset.nome;
          hiddenFornecedorId.value = btn.dataset.id;

          sugestoesEl.style.display = 'none';
          sugestoesEl.innerHTML = '';
        });

        // Ao sair do campo, some com as sugestões (pequeno delay pra permitir o clique)
        inputFornecedor.addEventListener('blur', function () {
          setTimeout(function () {
            sugestoesEl.style.display = 'none';
          }, 200);
        });
      }
    }
  } catch (e) {
    console.error('Init produtos erro', e);
  }
});



/* ========= Fix: alvos genéricos da modal (VER) ========= */
function _produtoDetailsContainer() {
  // usa #detalhesProduto se existir; senão, cai na .modal-body da modal de ver
  return document.querySelector('#detalhesProduto')
    || document.querySelector('#modalVerProduto .modal-body');
}

/* ========= VER (preenche modal body) ========= */
window.verProduto = async function verProduto(id) {
  try {
    if (!id) return;
    const token = localStorage.getItem('token');
    const res = await fetch(`/api/produtos/${id}`, { headers: { 'Authorization': `Bearer ${token}` } });
    if (!res.ok) { console.error('GET /api/produtos/:id', res.status); return; }
    const p = await res.json();

    const body = _produtoDetailsContainer();
    if (!body) return;

    const fmt = v => (Number(v || 0)).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    const badge = st => {
      const s = (st || '').toLowerCase();
      if (s === 'ativo') return '<span class="badge bg-success">Ativo</span>';
      if (s === 'inativo') return '<span class="badge bg-secondary">Inativo</span>';
      return `<span class="badge bg-light text-dark">${st || ''}</span>`;
    };
    const cores = Array.isArray(p.cores) ? p.cores.join(', ') : (p.cores || '');

    body.innerHTML = `
      <div class="row g-3">
        <div class="col-md-6"><small class="text-muted">Nome</small><div class="fw-semibold">${p.nome || ''}</div></div>
        <div class="col-md-3"><small class="text-muted">Categoria</small><div>${p.categoria || ''}</div></div>
        <div class="col-md-3"><small class="text-muted">Tamanho</small><div>${p.tamanho || ''}</div></div>

        <div class="col-md-6"><small class="text-muted">Preço de custo</small><div>${fmt(p.precoCusto)}</div></div>
        <div class="col-md-6"><small class="text-muted">Preço de venda</small><div class="fw-semibold">${fmt(p.precoVenda)}</div></div>

        <div class="col-md-6"><small class="text-muted">Estoque</small><div>${p.estoque ?? 0}</div></div>
        <div class="col-md-6"><small class="text-muted">Status</small><div>${badge(p.status)}</div></div>

        <div class="col-md-6"><small class="text-muted">Fornecedor</small><div>${(p.fornecedor && p.fornecedor.nome) || ''}</div></div>
        <div class="col-md-6"><small class="text-muted">EAN</small><div>${p.ean || ''}</div></div>

        <div class="col-12"><small class="text-muted">Cores</small><div>${cores}</div></div>
        <div class="col-12"><small class="text-muted">Descrição</small><div>${p.descricao || ''}</div></div>
        <div class="col-12"><small class="text-muted">Observações</small><div>${p.observacoes || ''}</div></div>
      </div>`;
  } catch (e) { console.error('verProduto erro', e); }
};

/* ========= EDITAR (preenche form e abre modal) ========= */
window.editarProduto = async function editarProduto(id) {
  try {
    if (!id) return;
    const token = localStorage.getItem('token');
    const res = await fetch(`/api/produtos/${id}`, { headers: { 'Authorization': `Bearer ${token}` } });
    if (!res.ok) { console.error('GET /api/produtos/:id', res.status); return; }
    const p = await res.json();

    const form = document.querySelector('#form-produto');
    if (!form) return;
    form.dataset.id = p._id;

    const setVal = (sel, val) => { const el = document.querySelector(sel); if (el) el.value = (val ?? ''); };
    setVal('#nome', p.nome);
    setVal('#categoria', p.categoria);
    setVal('#tamanho', p.tamanho);
    setVal('#status', p.status ? (p.status.charAt(0).toUpperCase() + p.status.slice(1)) : '');
    setVal('#estoque', p.estoque);
    setVal('#precoCusto', p.precoCusto);
    setVal('#precoVenda', p.precoVenda);
    setVal('#fornecedor', (p.fornecedor && p.fornecedor.nome) || '');
    setVal('#ean', p.ean);
    setVal('#descricao', p.descricao);
    setVal('#observacoes', p.observacoes);

    var hiddenFornecedor = document.querySelector('#fornecedorId');
    if (hiddenFornecedor) {
      // Se vier populado no getById
      if (p.fornecedor && p.fornecedor._id) {
        hiddenFornecedor.value = p.fornecedor._id;
      } else if (typeof p.fornecedor === 'string') {
        // Caso o back retorne só o ObjectId
        hiddenFornecedor.value = p.fornecedor;
      } else {
        hiddenFornecedor.value = '';
      }
    }


    const coresSel = document.querySelector('#cores');
    if (coresSel && Array.isArray(p.cores)) {
      Array.from(coresSel.options).forEach(o => { o.selected = p.cores.includes(o.value); });
    }

    // garante fornecedores no autocomplete quando abrir modal
    if (typeof carregarFornecedoresCombo === 'function') carregarFornecedoresCombo();

    // abre a modal de edição (mesmo sem data-bs-*)
    const modalEl = document.getElementById('modalNovoProduto');
    if (modalEl && window.bootstrap) {
      bootstrap.Modal.getOrCreateInstance(modalEl).show();
    }
  } catch (e) { console.error('editarProduto erro', e); }
};

/* ========= EXCLUIR (DELETE + refresh) ========= */
window.excluirProduto = async function excluirProduto(id) {
  try {
    if (!id) return;
    if (!confirm('Confirma excluir este produto?')) return;
    const token = localStorage.getItem('token');
    const res = await fetch(`/api/produtos/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!res.ok) {
      const txt = await res.text().catch(() => '');
      console.error('DELETE /api/produtos/:id', res.status, txt);
      alert('Falha ao excluir');
      return;
    }
    await carregarProdutos(1);
  } catch (e) { console.error('excluirProduto erro', e); }
};

/* ========= SALVAR (conecta o submit do form) ========= */
document.addEventListener('submit', async (e) => {
  const form = e.target.closest('#form-produto');
  if (!form) return;

  e.preventDefault();

  const gv = (sel) => document.querySelector(sel)?.value ?? '';
  const gvm = (sel) => Array.from(document.querySelector(sel)?.selectedOptions || []).map(o => o.value);

  // resolve fornecedor por nome -> _id (se autocomplete estiver carregado)
  let fornecedorId = null;
  if (typeof __resolveFornecedorIdFromInput === 'function') {
    fornecedorId = __resolveFornecedorIdFromInput();
  }

  const body = {
    nome: gv('#nome'),
    categoria: gv('#categoria'),
    tamanho: gv('#tamanho'),
    cores: gvm('#cores'),
    status: (gv('#status') || '').toLowerCase(),
    estoque: Number(gv('#estoque') || 0),
    precoCusto: Number((gv('#precoCusto') || '0').replace('.', '').replace(',', '.')),
    precoVenda: Number((gv('#precoVenda') || '0').replace('.', '').replace(',', '.')),
    fornecedor: fornecedorId,                 // pode ser null; back trata como opcional
    ean: gv('#ean'),
    descricao: gv('#descricao'),
    observacoes: gv('#observacoes'),
  };

  if (!body.nome) { alert('Informe o nome'); return; }

  const id = form.dataset.id || '';
  const url = id ? `/api/produtos/${id}` : '/api/produtos';
  const method = id ? 'PUT' : 'POST';

  try {
    const token = localStorage.getItem('token');
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify(body)
    });
    if (!res.ok) {
      const txt = await res.text().catch(() => '');
      console.error('SALVAR PRODUTO', res.status, txt);
      alert('Erro ao salvar produto');
      return;
    }

    // fecha modal + limpa + recarrega lista
    try {
      const modalEl = document.getElementById('modalNovoProduto');
      if (modalEl && window.bootstrap) bootstrap.Modal.getOrCreateInstance(modalEl).hide();
    } catch (_) { }
    form.reset(); delete form.dataset.id;
    await carregarProdutos(1);
  } catch (err) {
    console.error('salvarProduto erro', err);
    alert('Erro ao salvar produto');
  }
});

/* ========= “Novo produto” limpa form e garante autocomplete ========= */
document.addEventListener('click', (e) => {
  const btn = e.target.closest('#novoProdutoBtn');
  if (!btn) return;

  const form = document.querySelector('#form-produto');
  if (form) { form.reset(); delete form.dataset.id; }

  if (typeof carregarFornecedoresCombo === 'function') carregarFornecedoresCombo();
});

// Delegação para botões da tabela de produtos
document.addEventListener('click', async (e) => {
  // VER
  const btnVer = e.target.closest('[data-p-view]');
  if (btnVer) {
    const id = btnVer.getAttribute('data-p-view');
    try {
      const token = localStorage.getItem('token');
      const r = await fetch(`/api/produtos/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      if (!r.ok) throw new Error('Falha ao carregar produto');
      const p = await r.json();

      const body = document.querySelector('#detalhesProduto') || document.querySelector('#modalVerProduto .modal-body');
      if (!body) return;

      const fmt = v => (Number(v || 0)).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
      const badge = st => {
        const s = (st || '').toLowerCase();
        if (s === 'ativo') return '<span class="badge bg-success">Ativo</span>';
        if (s === 'inativo') return '<span class="badge bg-secondary">Inativo</span>';
        return `<span class="badge bg-light text-dark">${st || ''}</span>`;
      };
      const cores = Array.isArray(p.cores) ? p.cores.join(', ') : (p.cores || '');

      body.innerHTML = `
        <div class="row g-3">
          <div class="col-md-6"><small class="text-muted">Nome</small><div class="fw-semibold">${p.nome || ''}</div></div>
          <div class="col-md-3"><small class="text-muted">Categoria</small><div>${p.categoria || ''}</div></div>
          <div class="col-md-3"><small class="text-muted">Tamanho</small><div>${p.tamanho || ''}</div></div>
          <div class="col-md-6"><small class="text-muted">Preço de custo</small><div>${fmt(p.precoCusto)}</div></div>
          <div class="col-md-6"><small class="text-muted">Preço de venda</small><div class="fw-semibold">${fmt(p.precoVenda)}</div></div>
          <div class="col-md-6"><small class="text-muted">Estoque</small><div>${p.estoque ?? 0}</div></div>
          <div class="col-md-6"><small class="text-muted">Status</small><div>${badge(p.status)}</div></div>
          <div class="col-md-6"><small class="text-muted">Fornecedor</small><div>${(p.fornecedor && p.fornecedor.nome) || ''}</div></div>
          <div class="col-md-6"><small class="text-muted">EAN</small><div>${p.ean || ''}</div></div>
          <div class="col-12"><small class="text-muted">Cores</small><div>${cores}</div></div>
          <div class="col-12"><small class="text-muted">Descrição</small><div>${p.descricao || ''}</div></div>
          <div class="col-12"><small class="text-muted">Observações</small><div>${p.observacoes || ''}</div></div>
        </div>`;
    } catch (err) {
      console.error(err);
      alert('Não foi possível carregar os detalhes do produto.');
    }
    return;
  }

  // EDITAR
  const btnEdit = e.target.closest('[data-p-edit]');
  if (btnEdit) {
    const id = btnEdit.getAttribute('data-p-edit');
    try {
      const token = localStorage.getItem('token');
      const r = await fetch(`/api/produtos/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      if (!r.ok) throw new Error('Falha ao carregar produto');
      const p = await r.json();

      const form = document.querySelector('#form-produto');
      if (!form) return;
      form.dataset.id = p._id;

      const setVal = (sel, val) => { const el = document.querySelector(sel); if (el) el.value = (val ?? ''); };
      setVal('#nome', p.nome);
      setVal('#categoria', p.categoria);
      setVal('#tamanho', p.tamanho);
      setVal('#status', p.status ? (p.status.charAt(0).toUpperCase() + p.status.slice(1)) : '');
      setVal('#estoque', p.estoque);
      setVal('#precoCusto', p.precoCusto);
      setVal('#precoVenda', p.precoVenda);
      setVal('#fornecedor', (p.fornecedor && p.fornecedor.nome) || '');
      setVal('#ean', p.ean);
      setVal('#descricao', p.descricao);
      setVal('#observacoes', p.observacoes);

      const coresSel = document.querySelector('#cores');
      if (coresSel && Array.isArray(p.cores)) {
        Array.from(coresSel.options).forEach(o => { o.selected = p.cores.includes(o.value); });
      }

      // garante que o autocomplete de fornecedores esteja carregado
      if (typeof carregarFornecedoresCombo === 'function') carregarFornecedoresCombo();

      // (opcional) força abrir a modal já preenchida (se preferir)
      const modalEl = document.getElementById('modalNovoProduto');
      if (modalEl && window.bootstrap) bootstrap.Modal.getOrCreateInstance(modalEl).show();
    } catch (err) {
      console.error(err);
      alert('Não foi possível carregar o produto para edição.');
    }
    return;
  }

  // EXCLUIR
  const btnDel = e.target.closest('[data-p-del]');
  if (btnDel) {
    const id = btnDel.getAttribute('data-p-del');
    if (!confirm('Confirma excluir este produto?')) return;
    try {
      const token = localStorage.getItem('token');
      const r = await fetch(`/api/produtos/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
      if (!r.ok) throw new Error('Falha ao excluir');
      await carregarProdutos(1);
    } catch (err) {
      console.error(err);
      alert('Não foi possível excluir o produto.');
    }
    return;
  }
});
