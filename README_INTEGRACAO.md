# Integração MongoDB (Node.js + Express) — Sistema Horizon

Este backend `api/` fornece autenticação básica (registro/login) via MongoDB para o seu frontend existente.

## ⚙️ Passo a passo

1) **Pré‑requisitos**
- Node.js 18+ instalado
- Uma base MongoDB (sugestão: MongoDB Atlas gratuito)

2) **Configurar variáveis de ambiente**
Crie `api/.env` baseado em `api/.env.example`:
```
MONGO_URI=...
JWT_SECRET=uma_chave_bem_forte
PORT=4000
```

3) **Instalar dependências e rodar**
```
cd api
npm install
npm run dev
```
A API subirá em `http://localhost:4000`.

4) **Testar endpoints**
- `POST /api/auth/register` body: `{ "name": "...", "email": "...", "password": "..." }`
- `POST /api/auth/login` body: `{ "email": "...", "password": "..." }`
- `GET /api/user/me` header: `Authorization: Bearer <token>`

5) **Frontend já preparado**
O arquivo `assets/js/script.js` foi atualizado para:
- Enviar cadastro e login para a API
- Guardar o token no `localStorage`
- Redirecionar para `views/administrador/dashboard.html` após login

> Se seus formulários tiverem IDs/campos diferentes, ajuste os seletores no final do `script.js` (bloco "INTEGRAÇÃO API").

## 📁 Estrutura gerada
```
api/
  server.js
  .env.example
  package.json
  src/
    controllers/
      auth.controller.js
      user.controller.js
    middleware/
      auth.js
    models/
      User.js
    routes/
      auth.routes.js
      user.routes.js
```

## 🔐 Observações
- Em produção, ative HTTPS e use um `JWT_SECRET` forte.
- Adicione validação de campos (celebrate/zod) e troca de senha/recuperação conforme necessário.
- Para proteger páginas do frontend, verifique o token antes de carregar dados ou redirecione para login.
