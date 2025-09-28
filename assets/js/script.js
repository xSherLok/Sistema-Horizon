// ====== UI helpers ======
function qs(sel, ctx=document){ return ctx.querySelector(sel); }
function qsa(sel, ctx=document){ return Array.from(ctx.querySelectorAll(sel)); }

function switchTo(id){
  console.log('[UI] switch ->', id);
  qsa('section').forEach(s => s.classList.remove('active'));
  const el = qs(id);
  if (el) el.classList.add('active');
}

function showMsg(text, type='info'){
  const el = qs('#msg');
  if(!el){ alert(text); return; }
  el.textContent = text;
  el.style.display = 'block';
  el.style.padding = '10px';
  el.style.borderRadius = '6px';
  el.style.background = (type === 'error') ? '#ffe6e6' : '#e6ffe6';
  el.style.border = '1px solid ' + (type === 'error' ? '#ff9090' : '#90ff90');
}
function clearMsg(){ const el = qs('#msg'); if(el){ el.style.display='none'; el.textContent=''; } }

// ====== Navegação entre telas ======
document.addEventListener('click', (e) => {
  const t = e.target.closest('a,button');
  if(!t) return;

  if (t.id === 'showRegister') { e.preventDefault(); switchTo('#registerForm'); }
  if (t.id === 'showForgot')   { e.preventDefault(); switchTo('#forgotForm'); }
  if (t.id === 'backToLogin1' || t.id === 'backToLogin2') { e.preventDefault(); switchTo('#loginForm'); }
});

// ====== API helpers ======
const API_BASE = '/api';

function setToken(t){ localStorage.setItem('token', t); }
function getToken(){ return localStorage.getItem('token'); }
function clearToken(){ localStorage.removeItem('token'); }

async function api(path, opts = {}){
  const headers = Object.assign({ 'Content-Type': 'application/json' }, opts.headers || {});
  const token = getToken();
  if (token) headers['Authorization'] = 'Bearer ' + token;

  const url = API_BASE + path;
  console.log('[API]', (opts.method||'GET'), url);
  const res = await fetch(url, { ...opts, headers });
  let data = {};
  try { data = await res.json(); } catch(e) {}
  if (!res.ok) {
    console.error('[API][ERROR]', res.status, data);
    throw new Error(data?.error || `Erro na API (${res.status})`);
  }
  return data;
}

// ====== SUBMIT CADASTRO ======
document.addEventListener('submit', async (e) => {
  const form = e.target;
  if (!form.closest('#registerForm')) return;

  e.preventDefault();
  clearMsg();

  const name     = qs('#registerForm [name=name]')?.value?.trim() || '';
  const email    = qs('#registerForm [name=email]')?.value?.trim() || '';
  const password = qs('#registerForm [name=password]')?.value || '';
  const password2= qs('#registerForm [name=password2]')?.value || '';

  if (!name || !email || !password) {
    showMsg('Preencha nome, email e senha.', 'error');
    return;
  }
  if (password2 && password !== password2) {
    showMsg('As senhas não conferem.', 'error');
    return;
  }

  try{
    await api('/auth/register', { method: 'POST', body: JSON.stringify({ name, email, password }) });
    showMsg('Cadastro realizado! Faça login.', 'ok');
    switchTo('#loginForm');
  }catch(err){
    showMsg(err.message, 'error');
  }
});

// ====== SUBMIT LOGIN ======
document.addEventListener('submit', async (e) => {
  const form = e.target;
  if (!form.closest('#loginForm')) return;

  e.preventDefault();
  clearMsg();

  const email    = qs('#loginForm [name=email]')?.value?.trim() || '';
  const password = qs('#loginForm [name=password]')?.value || '';

  if (!email || !password) {
    showMsg('Informe email e senha.', 'error');
    return;
  }

  try{
    const { token, user } = await api('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) });
    setToken(token);
    showMsg('Bem-vindo, ' + user.name + '!', 'ok');
    window.location.href = 'views/administrador/dashboard.html';
  }catch(err){
    showMsg(err.message, 'error');
  }
});

// ====== LOGOUT (se houver botão no dashboard) ======
document.addEventListener('click', (e) => {
  const t = e.target.closest('#logoutBtn');
  if(!t) return;
  e.preventDefault();
  clearToken();
  window.location.href = '../../index.html';
});

// ====== Opcional: auto-redirecionar se já estiver logado ======
// if (getToken()) { window.location.href = 'views/administrador/dashboard.html'; }

// util: debounce para não spammar a API enquanto digita
function debounce(fn, delay = 300){
  let t; 
  return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), delay); };
}

// ====================================================================
// ========================== CLIENTES =================================
// ====================================================================

// Preenche a tabela de clientes
async function carregarClientes(page = 1) {
  const q = (qs('#buscaClientes')?.value || '').trim();
  const params = new URLSearchParams({ page, limit: 10 });
  if (q) params.set('q', q);

  const res = await api('/clientes?' + params.toString());
  const tbody = document.querySelector('#tabelaClientes tbody');
  if (!tbody) return;

  tbody.innerHTML = '';

  (res.items || []).forEach(c => {
    const tr = document.createElement('tr');
    const dataCadastro = new Date(c.createdAt || c.updatedAt || Date.now()).toLocaleDateString('pt-BR');
    tr.innerHTML = `
      <td>${c.nome || '-'}</td>
      <td>${c.email || '-'}</td>
      <td>${c.telefone || '-'}</td>
      <td>${c.cpfCnpj || '-'}</td>
      <td>${(c.status || '').toUpperCase()}</td>
      <td>${dataCadastro}</td>
      <td class="actions">
        <button type="button" class="btn btn-sm btn-outline-secondary" data-edit="${c._id}">Editar</button>
        <button type="button" class="btn btn-sm btn-danger" data-del="${c._id}">Excluir</button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}


// Reseta o formulário e prepara para novo cadastro
function resetFormCliente() {
  const form = qs('#formCliente');
  if (!form) return;
  form.reset();
  delete form.dataset.id;
  if (form.status) form.status.value = 'ativo';
}

// Carrega dados de um cliente no formulário para edição
function preencherFormCliente(c) {
  const form = qs('#formCliente');
  if (!form || !c) return;
  form.dataset.id = c._id;
  if (form.nome) form.nome.value = c.nome || '';
  if (form.email) form.email.value = c.email || '';
  if (form.telefone) form.telefone.value = c.telefone || '';
  if (form.cpfCnpj) form.cpfCnpj.value = c.cpfCnpj || '';
  if (form.rua) form.rua.value = c.endereco?.rua || '';
  if (form.numero) form.numero.value = c.endereco?.numero || '';
  if (form.bairro) form.bairro.value = c.endereco?.bairro || '';
  if (form.cidade) form.cidade.value = c.endereco?.cidade || '';
  if (form.uf) form.uf.value = c.endereco?.uf || '';
  if (form.cep) form.cep.value = c.endereco?.cep || '';
  if (form.observacoes) form.observacoes.value = c.observacoes || '';
  if (form.status) form.status.value = c.status || 'ativo';
}

// Botão "Novo cliente" (limpa formulário e abre modal)
document.addEventListener('click', (e) => {
  const btnNew = e.target.closest('#novoClienteBtn');
  if (!btnNew) return;

  resetFormCliente();

  const modalEl = document.getElementById('modalCliente');
  if (modalEl && window.bootstrap) {
    const modal = bootstrap.Modal.getOrCreateInstance(modalEl);
    modal.show();
  }
});

// Submit do cadastro/edição de cliente
document.addEventListener('submit', async (e) => {
  const form = e.target.closest('#formCliente');
  if (!form) return;

  e.preventDefault();
  clearMsg();

  const data = {
    nome: form.nome?.value?.trim() || '',
    email: form.email?.value?.trim() || '',
    telefone: form.telefone?.value?.trim() || '',
    cpfCnpj: form.cpfCnpj?.value?.trim() || '',
    endereco: {
      rua: form.rua?.value?.trim() || '',
      numero: form.numero?.value?.trim() || '',
      bairro: form.bairro?.value?.trim() || '',
      cidade: form.cidade?.value?.trim() || '',
      uf: form.uf?.value?.trim() || '',
      cep: form.cep?.value?.trim() || '',
    },
    observacoes: form.observacoes?.value?.trim() || '',
    status: form.status?.value || 'ativo',
  };

  if (!data.nome) { showMsg('Nome é obrigatório.', 'error'); return; }

  const id = form.dataset.id || null;
  const method = id ? 'PUT' : 'POST';
  const path = id ? `/clientes/${id}` : '/clientes';

  try {
    const res = await api(path, { method, body: JSON.stringify(data) });
    if (res && (res._id || res.ok)) {
      showMsg(id ? 'Cliente atualizado!' : 'Cliente cadastrado!', 'ok');
      form.reset();
      delete form.dataset.id;
      carregarClientes();

      // fechar a modal
      const modalEl = document.getElementById('modalCliente');
      if (modalEl && window.bootstrap) {
        const modal = bootstrap.Modal.getOrCreateInstance(modalEl);
        modal.hide();
      }
    }
  } catch (err) {
    showMsg(err.message, 'error');
  }
});

// Clique nos botões de editar/excluir dentro da tabela
document.addEventListener('click', async (e) => {
  // EXCLUIR
  const btnDel = e.target.closest('[data-del]');
  if (btnDel) {
    e.preventDefault();
    if (!confirm('Confirma a exclusão?')) return;
    const id = btnDel.dataset.del;
    try {
      const r = await api('/clientes/' + id, { method: 'DELETE' });
      if (r && r.ok) {
        showMsg('Cliente removido', 'ok');
        carregarClientes();
      }
    } catch (err) {
      showMsg(err.message, 'error');
    }
    return;
  }

  // EDITAR
  const btnEdit = e.target.closest('[data-edit]');
  if (btnEdit) {
    e.preventDefault();
    const id = btnEdit.dataset.edit;
    try {
      const c = await api('/clientes/' + id);
      preencherFormCliente(c);

      const modalEl = document.getElementById('modalCliente');
      if (modalEl && window.bootstrap) {
        const modal = bootstrap.Modal.getOrCreateInstance(modalEl);
        modal.show();
      }
    } catch (err) {
      showMsg(err.message, 'error');
    }
  }
});

// Auto-carregar clientes ao abrir a página de clientes
(function initClientesPage(){
  const isClientesPage =
    location.pathname.endsWith('/administrador/clientes.html') ||
    location.pathname.includes('/administrador/clientes.html');

  if (!isClientesPage) return;
  if (!getToken()) { window.location.href='../../index.html'; return; }

  const doSearch = debounce(() => carregarClientes(1), 300);

  carregarClientes();

  const busca = qs('#buscaClientes');
  if (busca) {
    busca.addEventListener('input', doSearch);
    busca.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') { e.preventDefault(); doSearch(); }
    });
  }
})();

// Botão "Novo cliente" (limpa formulário e abre modal)
document.addEventListener('click', (e) => {
  const btnNew = e.target.closest('#novoClienteBtn');
  if (!btnNew) return;

  resetFormCliente();

  // abre a modal programaticamente (garante abertura)
  const modalEl = document.getElementById('modalCliente');
  if (modalEl && window.bootstrap) {
    const modal = bootstrap.Modal.getOrCreateInstance(modalEl);
    modal.show();
  }
});

// Clique nos botões de editar/excluir dentro da tabela
document.addEventListener('click', async (e) => {
  // EXCLUIR
  const btnDel = e.target.closest('[data-del]');
  if (btnDel) {
    e.preventDefault();
    if (!confirm('Confirma a exclusão?')) return;
    const id = btnDel.dataset.del;
    try {
      const r = await api('/clientes/' + id, { method: 'DELETE' });
      if (r && r.ok) {
        showMsg('Cliente removido', 'ok');
        carregarClientes();
      }
    } catch (err) {
      showMsg(err.message, 'error');
    }
    return;
  }

  // EDITAR
  const btnEdit = e.target.closest('[data-edit]');
  if (btnEdit) {
    e.preventDefault();
    const id = btnEdit.dataset.edit;
    try {
      const c = await api('/clientes/' + id);
      preencherFormCliente(c);

      // abre a modal de edição (garante abertura mesmo sem data-bs-*)
      const modalEl = document.getElementById('modalCliente');
      if (modalEl && window.bootstrap) {
        const modal = bootstrap.Modal.getOrCreateInstance(modalEl);
        modal.show();
      }
    } catch (err) {
      showMsg(err.message, 'error');
    }
  }
});

// ====================================================================
// ======================== FORNECEDORES ===============================
// ====================================================================

// lista com busca e paginação
async function carregarFornecedores(page = 1) {
  const q = (qs('#buscaFornecedores')?.value || '').trim();
  const params = new URLSearchParams({ page, limit: 10 });
  if (q) params.set('q', q);

  const res = await api('/fornecedores?' + params.toString());
  const tbody = qs('#tabelaFornecedores tbody');
  if (!tbody) return;

  tbody.innerHTML = '';

  (res.items || []).forEach(f => {
    const tr = document.createElement('tr');
    const dataCadastro = new Date(f.createdAt || f.updatedAt || Date.now()).toLocaleDateString('pt-BR');
    tr.innerHTML = `
      <td>${f.razaoSocial || '-'}</td>
      <td>${f.nomeFantasia || '-'}</td>
      <td>${f.email || '-'}</td>
      <td>${f.telefone || '-'}</td>
      <td>${f.cnpj || '-'}</td>
      <td>${(f.status || '').toUpperCase()}</td>
      <td>${dataCadastro}</td>
      <td class="actions">
        <button type="button" class="btn btn-sm btn-outline-secondary" data-f-edit="${f._id}">Editar</button>
        <button type="button" class="btn btn-sm btn-danger" data-f-del="${f._id}">Excluir</button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

// limpa form
function resetFormFornecedor(){
  const form = qs('#formFornecedor');
  if (!form) return;
  form.reset();
  delete form.dataset.id;
  if (form.status) form.status.value = 'ativo';
}

// preenche form para edição
function preencherFormFornecedor(f) {
  const form = qs('#formFornecedor');
  if (!form || !f) return;
  form.dataset.id = f._id;
  if (form.razaoSocial) form.razaoSocial.value = f.razaoSocial || '';
  if (form.nomeFantasia) form.nomeFantasia.value = f.nomeFantasia || '';
  if (form.email) form.email.value = f.email || '';
  if (form.telefone) form.telefone.value = f.telefone || '';
  if (form.cnpj) form.cnpj.value = f.cnpj || '';
  if (form.inscricaoEstadual) form.inscricaoEstadual.value = f.inscricaoEstadual || '';
  if (form.status) form.status.value = f.status || 'ativo';

  if (form.rua) form.rua.value = f.endereco?.rua || '';
  if (form.numero) form.numero.value = f.endereco?.numero || '';
  if (form.bairro) form.bairro.value = f.endereco?.bairro || '';
  if (form.cidade) form.cidade.value = f.endereco?.cidade || '';
  if (form.uf) form.uf.value = f.endereco?.uf || '';
  if (form.cep) form.cep.value = f.endereco?.cep || '';
  if (form.observacoes) form.observacoes.value = f.observacoes || '';
}

// Botão "Novo fornecedor"
document.addEventListener('click', (e) => {
  const btnNew = e.target.closest('#novoFornecedorBtn');
  if (!btnNew) return;

  resetFormFornecedor();

  const modalEl = document.getElementById('modalFornecedor');
  if (modalEl && window.bootstrap) {
    const modal = bootstrap.Modal.getOrCreateInstance(modalEl);
    modal.show();
  }
});

// Submit cadastro/edição fornecedor
document.addEventListener('submit', async (e) => {
  const form = e.target.closest('#formFornecedor');
  if (!form) return;

  e.preventDefault();
  clearMsg();

  const data = {
    razaoSocial: form.razaoSocial?.value?.trim() || '',
    nomeFantasia: form.nomeFantasia?.value?.trim() || '',
    email: form.email?.value?.trim() || '',
    telefone: form.telefone?.value?.trim() || '',
    cnpj: form.cnpj?.value?.trim() || '',
    inscricaoEstadual: form.inscricaoEstadual?.value?.trim() || '',
    endereco: {
      rua: form.rua?.value?.trim() || '',
      numero: form.numero?.value?.trim() || '',
      bairro: form.bairro?.value?.trim() || '',
      cidade: form.cidade?.value?.trim() || '',
      uf: form.uf?.value?.trim() || '',
      cep: form.cep?.value?.trim() || '',
    },
    observacoes: form.observacoes?.value?.trim() || '',
    status: form.status?.value || 'ativo',
  };

  if (!data.razaoSocial) { showMsg('Razão social é obrigatória.', 'error'); return; }

  const id = form.dataset.id || null;
  const method = id ? 'PUT' : 'POST';
  const path = id ? `/fornecedores/${id}` : '/fornecedores';

  try {
    const res = await api(path, { method, body: JSON.stringify(data) });
    if (res && (res._id || res.ok)) {
      showMsg(id ? 'Fornecedor atualizado!' : 'Fornecedor cadastrado!', 'ok');
      form.reset();
      delete form.dataset.id;
      carregarFornecedores();

      const modalEl = document.getElementById('modalFornecedor');
      if (modalEl && window.bootstrap) {
        const modal = bootstrap.Modal.getOrCreateInstance(modalEl);
        modal.hide();
      }
    }
  } catch (err) {
    showMsg(err.message, 'error');
  }
});

// Clique editar/excluir fornecedor
document.addEventListener('click', async (e) => {
  // excluir
  const btnDel = e.target.closest('[data-f-del]');
  if (btnDel) {
    e.preventDefault();
    if (!confirm('Confirma a exclusão?')) return;
    const id = btnDel.dataset.fDel || btnDel.getAttribute('data-f-del');
    try {
      const r = await api('/fornecedores/' + id, { method: 'DELETE' });
      if (r && r.ok) {
        showMsg('Fornecedor removido', 'ok');
        carregarFornecedores();
      }
    } catch (err) {
      showMsg(err.message, 'error');
    }
    return;
  }

  // editar
  const btnEdit = e.target.closest('[data-f-edit]');
  if (btnEdit) {
    e.preventDefault();
    const id = btnEdit.dataset.fEdit || btnEdit.getAttribute('data-f-edit');
    try {
      const f = await api('/fornecedores/' + id);
      preencherFormFornecedor(f);

      const modalEl = document.getElementById('modalFornecedor');
      if (modalEl && window.bootstrap) {
        const modal = bootstrap.Modal.getOrCreateInstance(modalEl);
        modal.show();
      }
    } catch (err) {
      showMsg(err.message, 'error');
    }
  }
});

// init da página de fornecedores (com debounce na busca)
(function initFornecedoresPage(){
  const isPage =
    location.pathname.endsWith('/administrador/fornecedores.html') ||
    location.pathname.includes('/administrador/fornecedores.html');

  if (!isPage) return;
  if (!getToken()) { window.location.href='../../index.html'; return; }

  const doSearch = debounce(() => carregarFornecedores(1), 300);

  carregarFornecedores();

  const busca = qs('#buscaFornecedores');
  if (busca) {
    busca.addEventListener('input', doSearch);
    busca.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') { e.preventDefault(); doSearch(); }
    });
  }
})();



