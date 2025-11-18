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
function resetFormFornecedor() {
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
(function initFornecedoresPage() {
  const isPage =
    location.pathname.endsWith('/administrador/fornecedores.html') ||
    location.pathname.includes('/administrador/fornecedores.html');

  if (!isPage) return;
  if (!getToken()) { window.location.href = '../../index.html'; return; }

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

