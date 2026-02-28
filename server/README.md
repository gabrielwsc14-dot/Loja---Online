# BabyShop Sync Server

Duas opções para sincronizar dados entre dispositivos **sem alterar os scripts existentes**:

## Opção 1: Render.com (Backend Node + database.json)

**Quando usar:** Se prefere simplicidade e quer rodar o servidor Node que já está pronto.

**Características:**
- Servidor Node serve site + sincroniza `database.json` centralizado
- Todos os dispositivos veem os mesmos dados
- Free tier do Render

**Como usar:**

1. Instale dependências:
```bash
cd server
npm install
```

2. Rode localmente:
```bash
npm start
# Abra http://localhost:3000
```

3. Deploy no Render:
   - Push para GitHub
   - No [Render Dashboard](https://render.com): New Web Service
   - Build command: `cd server && npm install`
   - Start command: `cd server && npm start`

**Limitações:**
- `database.json` reside no servidor; redeploys podem perder dados
- Não escalável para múltiplas instâncias

---

## Observação sobre Supabase

Suporte à integração com Supabase foi removido nesta versão. A sincronização agora é feita por um servidor Node que persiste em `database.json` no servidor. Consulte `NETLIFY-SETUP.md` para instruções de deploy e uso do servidor local.
