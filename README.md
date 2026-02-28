# 🌐 Como Publicar QUALQUER Pasta HTML no GitHub Pages (Guia Completo)

Este é um guia completo e prático para publicar qualquer site HTML gratuitamente usando o **GitHub Pages**.

## 📋 O que é GitHub Pages?

GitHub Pages é um serviço **GRATUITO** do GitHub que permite hospedar sites estáticos (HTML, CSS, JavaScript) diretamente de um repositório. Perfeito para:
- Sites pessoais
- Portfólios
- Lojas online estáticas
- Documentação de projetos
- Landing pages
- E muito mais!

## 🚀 Como Publicar Seu Site HTML (3 Métodos)

### 📁 Método 1: Publicar da Raiz (Root) - MAIS COMUM

**Use quando:** Seus arquivos HTML estão na pasta principal do repositório

1. **Prepare seu repositório:**
   ```
   seu-repositorio/
   ├── index.html  ← Arquivo principal (OBRIGATÓRIO)
   ├── style.css
   ├── script.js
   └── imagens/
   ```

2. **Ative o GitHub Pages:**
   - Vá em: `Settings` → `Pages`
   - **Source:** Deploy from a branch
   - **Branch:** `main` (ou `master`)
   - **Folder:** `/ (root)`
   - Clique em **Save**

3. **Seu site estará em:**
   ```
   https://seu-usuario.github.io/nome-do-repositorio/
   ```

### 📂 Método 2: Publicar da Pasta `/docs` - RECOMENDADO

**Use quando:** Quer separar código-fonte da versão publicada

1. **Crie a pasta docs:**
   ```
   seu-repositorio/
   ├── src/           ← Código fonte
   └── docs/          ← Site para publicar
       ├── index.html
       ├── style.css
       └── script.js
   ```

2. **Ative o GitHub Pages:**
   - Vá em: `Settings` → `Pages`
   - **Branch:** `main`
   - **Folder:** `/docs`
   - Clique em **Save**

### 🌿 Método 3: Branch `gh-pages` Separado - AVANÇADO

**Use quando:** Quer manter código e site 100% separados

1. **Crie um branch gh-pages:**
   ```bash
   git checkout --orphan gh-pages
   git rm -rf .
   # Adicione seus arquivos HTML
   git add .
   git commit -m "Site publicado"
   git push origin gh-pages
   ```

2. **Ative o GitHub Pages:**
   - Vá em: `Settings` → `Pages`
   - **Branch:** `gh-pages`
   - **Folder:** `/ (root)`

## ⏱️ Quanto Tempo Demora?

- **Primeira publicação:** 2 a 10 minutos
- **Atualizações:** 30 segundos a 5 minutos
- Você receberá um email quando estiver pronto!

## ✅ Requisitos Importantes

### 1. Arquivo `index.html` é OBRIGATÓRIO
Seu site DEVE ter um arquivo chamado `index.html` na raiz ou na pasta escolhida:
```
✅ CERTO: index.html
❌ ERRADO: inicio.html, home.html, pagina1.html
```

### 2. Use Caminhos Relativos
```html
✅ CERTO:
<link rel="stylesheet" href="style.css">
<img src="imagens/logo.png">
<a href="sobre.html">Sobre</a>

❌ ERRADO:
<link rel="stylesheet" href="/style.css">  ← Barra no início
<link rel="stylesheet" href="C:/site/style.css">  ← Caminho absoluto
<img src="file:///imagens/logo.png">  ← Protocolo file://
```

### 3. Repositório Deve Ser PÚBLICO
- GitHub Pages é gratuito apenas para repositórios públicos
- Se seu repositório é privado, você precisa do GitHub Pro

### 4. Nomes de Arquivos
- Use **minúsculas** (GitHub Pages é case-sensitive)
- Evite **espaços** e **acentos** nos nomes
```
✅ CERTO: sobre-nos.html, contato.html
❌ ERRADO: Sobre Nós.html, Página Inicial.html
```

## 🔧 Arquivo `.nojekyll` (Importante!)

Se seu site tem pastas ou arquivos que começam com `_` (underscore), crie um arquivo `.nojekyll` vazio na raiz:

```bash
# No terminal, na pasta do projeto:
touch .nojekyll
git add .nojekyll
git commit -m "Add .nojekyll"
git push
```

**Por quê?** O GitHub Pages usa Jekyll por padrão, que ignora pastas como `_css` ou `_js`. O arquivo `.nojekyll` desativa isso.

## 🔄 Como Atualizar Seu Site

Depois de publicado, toda alteração que você fizer será atualizada automaticamente:

```bash
# 1. Faça suas alterações nos arquivos HTML/CSS/JS

# 2. Adicione os arquivos modificados
git add .

# 3. Crie um commit
git commit -m "Atualizei o menu principal"

# 4. Envie para o GitHub
git push origin main

# 5. Aguarde 1-5 minutos e seu site estará atualizado!
```

## 🐛 Problemas Comuns e Soluções

### Problema 1: "Site não aparece / Erro 404"
**Soluções:**
- ✅ Verifique se existe um arquivo `index.html`
- ✅ Aguarde 5-10 minutos após ativar
- ✅ Confirme que o repositório é público
- ✅ Limpe o cache: `Ctrl + Shift + R` (Windows) ou `Cmd + Shift + R` (Mac)

### Problema 2: "CSS e JS não carregam"
**Soluções:**
- ✅ Use caminhos relativos (sem `/` no início)
- ✅ Crie arquivo `.nojekyll` se usa pastas com `_`
- ✅ Verifique nomes dos arquivos (minúsculas)

### Problema 3: "Imagens não aparecem"
**Soluções:**
- ✅ Verifique se as imagens estão no repositório
- ✅ Use caminhos relativos: `<img src="img/foto.jpg">`
- ✅ Verifique extensões: `.jpg`, `.png` (minúsculas)

### Problema 4: "Demora muito para atualizar"
**Soluções:**
- ✅ Aguarde até 10 minutos
- ✅ Verifique o status em `Settings > Pages`
- ✅ Limpe cache do navegador
- ✅ Tente em modo anônimo

## 🎯 Domínio Personalizado (Opcional)

Quer usar seu próprio domínio? (ex: `www.seusite.com.br`)

1. Compre um domínio (Registro.br, GoDaddy, etc.)
2. Em `Settings > Pages`, adicione em **Custom domain**
3. Configure DNS no seu registrador:
   ```
   Tipo A:
   185.199.108.153
   185.199.109.153
   185.199.110.153
   185.199.111.153
   
   Tipo CNAME (www):
   seu-usuario.github.io
   ```

## 📚 Exemplos Práticos

### Exemplo 1: Site Simples
```
meu-site/
├── index.html
├── style.css
└── script.js
```
**Publicar:** Raiz (`/ root`)

### Exemplo 2: Site com Estrutura
```
meu-projeto/
├── docs/
│   ├── index.html
│   ├── css/
│   │   └── style.css
│   └── js/
│       └── script.js
└── README.md
```
**Publicar:** Pasta `/docs`

### Exemplo 3: Múltiplas Páginas
```
portfolio/
├── index.html          → Página inicial
├── sobre.html          → Página sobre
├── projetos.html       → Página projetos
├── contato.html        → Página contato
├── css/
│   └── style.css
└── imagens/
    ├── logo.png
    └── foto.jpg
```
**Link entre páginas:**
```html
<a href="sobre.html">Sobre Mim</a>
<a href="projetos.html">Meus Projetos</a>
```

## 📖 Links Úteis

- [Documentação Oficial GitHub Pages (PT-BR)](https://docs.github.com/pt/pages)
- [Guia Visual Detalhado](docs/github-pages.html) ← Abra este arquivo para um tutorial passo a passo
- [Verificar Status do GitHub](https://www.githubstatus.com/)

## 💡 Dicas Profissionais

1. **Use Git corretamente:** Faça commits frequentes com mensagens claras
2. **Teste localmente:** Abra o `index.html` no navegador antes de publicar
3. **Responsive:** Teste seu site em diferentes tamanhos de tela
4. **Performance:** Otimize imagens (use TinyPNG, Squoosh)
5. **SEO:** Adicione meta tags, títulos descritivos
6. **HTTPS:** GitHub Pages fornece SSL gratuito automaticamente

## ❓ Perguntas Frequentes

**Q: É realmente grátis?**  
A: Sim! 100% gratuito para repositórios públicos, sem limites.

**Q: Posso usar PHP/banco de dados?**  
A: Não. GitHub Pages só suporta sites estáticos (HTML/CSS/JS). Use Netlify, Vercel ou Heroku para backend.

**Q: Quantos sites posso ter?**  
A: Ilimitados! Um site por repositório.

**Q: Posso vender produtos?**  
A: Sim, mas você precisará integrar com APIs de pagamento (Stripe, PayPal, Mercado Pago).

**Q: Tem limite de visitantes?**  
A: Limite de 100GB de banda por mês e 1GB de espaço. Suficiente para a maioria dos sites.

---

**🎉 Agora você sabe tudo sobre publicar sites no GitHub Pages! Boa sorte com seu projeto!**
