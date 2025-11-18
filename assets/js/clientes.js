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
(function initClientesPage() {
  const isClientesPage =
    location.pathname.endsWith('/administrador/clientes.html') ||
    location.pathname.includes('/administrador/clientes.html');

  if (!isClientesPage) return;
  if (!getToken()) { window.location.href = '../../index.html'; return; }

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
