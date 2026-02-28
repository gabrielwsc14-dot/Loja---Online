# Netlify / Deployment (Supabase integration removed)

Nota: O suporte à integração com Supabase foi removido nesta versão. A sincronização central agora é feita por um servidor Node que persiste o estado em `database.json` no servidor. Se você quiser reintroduzir integrações externas, mantenha as credenciais fora do repositório e documente o processo separadamente.

Para deploy do site estático no Netlify (sem backend):

1. Faça push do repositório para GitHub
2. No Netlify, **Add new site** → **Import an existing project** → conecte GitHub
3. Build command: `echo "Static site"`
4. Publish directory: `.`

Se preferir rodar o servidor Node centralizado (opção recomendada para sincronização local):

1. Entre na pasta `server`:
```bash
cd server
npm install
npm start
```
2. Abra `http://localhost:3000` para servir o site com sincronização por `database.json`.

Se quiser que eu documente/recrie um guia de migração para um serviço em nuvem (Render, Fly, etc.), posso gerar passos específicos.

