// ====== UI helpers ======
function qs(sel, ctx = document) { return ctx.querySelector(sel); }
function qsa(sel, ctx = document) { return Array.from(ctx.querySelectorAll(sel)); }

function switchTo(id) {
  console.log('[UI] switch ->', id);
  qsa('section').forEach(s => s.classList.remove('active'));
  const el = qs(id);
  if (el) el.classList.add('active');
}

function showMsg(text, type = 'info') {
  const el = qs('#msg');
  if (!el) { alert(text); return; }
  el.textContent = text;
  el.style.display = 'block';
  el.style.padding = '10px';
  el.style.borderRadius = '6px';
  el.style.background = (type === 'error') ? '#ffe6e6' : '#e6ffe6';
  el.style.border = '1px solid ' + (type === 'error' ? '#ff9090' : '#90ff90');
}
function clearMsg() { const el = qs('#msg'); if (el) { el.style.display = 'none'; el.textContent = ''; } }

// ====== Navegação entre telas ======
document.addEventListener('click', (e) => {
  const t = e.target.closest('a,button');
  if (!t) return;

  if (t.id === 'showRegister') { e.preventDefault(); switchTo('#registerForm'); }
  if (t.id === 'showForgot') { e.preventDefault(); switchTo('#forgotForm'); }
  if (t.id === 'backToLogin1' || t.id === 'backToLogin2') { e.preventDefault(); switchTo('#loginForm'); }
});

// ====== API helpers ======
const API_BASE = '/api';

function setToken(t) { localStorage.setItem('token', t); }
function getToken() { return localStorage.getItem('token'); }
function clearToken() { localStorage.removeItem('token'); }

async function api(path, opts = {}) {
  const headers = Object.assign({ 'Content-Type': 'application/json' }, opts.headers || {});
  const token = getToken();
  if (token) headers['Authorization'] = 'Bearer ' + token;

  const url = API_BASE + path;
  console.log('[API]', (opts.method || 'GET'), url);
  const res = await fetch(url, { ...opts, headers });
  let data = {};
  try { data = await res.json(); } catch (e) { }
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

  const name = qs('#registerForm [name=name]')?.value?.trim() || '';
  const email = qs('#registerForm [name=email]')?.value?.trim() || '';
  const password = qs('#registerForm [name=password]')?.value || '';
  const password2 = qs('#registerForm [name=password2]')?.value || '';

  if (!name || !email || !password) {
    showMsg('Preencha nome, email e senha.', 'error');
    return;
  }
  if (password2 && password !== password2) {
    showMsg('As senhas não conferem.', 'error');
    return;
  }

  try {
    await api('/auth/register', { method: 'POST', body: JSON.stringify({ name, email, password }) });
    showMsg('Cadastro realizado! Faça login.', 'ok');
    switchTo('#loginForm');
  } catch (err) {
    showMsg(err.message, 'error');
  }
});

// ====== SUBMIT LOGIN ======
document.addEventListener('submit', async (e) => {
  const form = e.target;
  if (!form.closest('#loginForm')) return;

  e.preventDefault();
  clearMsg();

  const email = qs('#loginForm [name=email]')?.value?.trim() || '';
  const password = qs('#loginForm [name=password]')?.value || '';

  if (!email || !password) {
    showMsg('Informe email e senha.', 'error');
    return;
  }

  try {
    const { token, user } = await api('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) });
    setToken(token);
    showMsg('Bem-vindo, ' + user.name + '!', 'ok');
    window.location.href = 'views/administrador/dashboard.html';
  } catch (err) {
    showMsg(err.message, 'error');
  }
});

// ====== LOGOUT (se houver botão no dashboard) ======
document.addEventListener('click', (e) => {
  const t = e.target.closest('#logoutBtn');
  if (!t) return;
  e.preventDefault();
  clearToken();
  window.location.href = '../../index.html';
});

// ====== Opcional: auto-redirecionar se já estiver logado ======
// if (getToken()) { window.location.href = 'views/administrador/dashboard.html'; }

// util: debounce para não spammar a API enquanto digita
function debounce(fn, delay = 300) {
  let t;
  return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), delay); };
}





