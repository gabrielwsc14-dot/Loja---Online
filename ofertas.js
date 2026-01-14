// ofertas.js - CÓDIGO INTEGRADO E COMPLETO

// 1. Garantia de que as chaves existem no banco de dados ao carregar
if (!db.produtosOferta) db.produtosOferta = [];
if (db.ofertasAtivas === undefined) db.ofertasAtivas = false;

// 2. Função do Botão (Switch) no Admin
function toggleOfertasGlobal() {
    const checkbox = document.getElementById('toggle-ofertas');
    if (!checkbox) return;

    db.ofertasAtivas = checkbox.checked;

    // Se desligar, remove a marcação de oferta de TODOS os produtos e volta o preço
    if (!db.ofertasAtivas) {
        db.produtos.forEach(p => {
            if (p.isOferta) {
                p.preco = p.precoAntigo; // Volta o preço original
                p.isOferta = false;
                delete p.precoAntigo;
            }
        });
        db.produtosOferta = []; // Limpa a lista de ofertas
    }

    save();
    location.reload(); // Recarrega para limpar a vitrine e o scroller
}

// 3. Função para Cadastrar a Oferta (Transformar produto em oferta)
function executarTransformacao() {
    const idProd = document.getElementById('id-transf').value;
    const novoPreco = parseFloat(document.getElementById('preco-novo').value);
    const dataFim = document.getElementById('data-fim').value;

    if (!idProd || isNaN(novoPreco) || !dataFim) {
        alert("Preencha ID, Novo Preço e Data!");
        return;
    }

    const produto = db.produtos.find(p => String(p.id) === String(idProd));
    
    if (!produto) {
        alert("ID não encontrado!");
        return;
    }

    // Em vez de mover, nós apenas marcamos o produto
    produto.isOferta = true;
    produto.precoAntigo = produto.preco;
    produto.preco = novoPreco;
    produto.validadeOferta = new Date(dataFim).getTime();

    // Adiciona à lista de ofertas se não estiver lá
    if (!db.produtosOferta) db.produtosOferta = [];
    const jaExiste = db.produtosOferta.find(p => p.id === produto.id);
    if (!jaExiste) db.produtosOferta.push(produto);

    save(); // Salva no banco
    alert("Oferta Ativada!");
    location.reload(); // Recarrega para atualizar todas as tabelas
}

// 4. Renderizar o Scroller Estilo AliExpress (para a index.html)
function renderizarScrollOfertas() {
    const container = document.getElementById('ofertas-scroller-container');
    const grid = document.getElementById('ofertas-grid');
    if (!container || !grid) return;

    if (!db.ofertasAtivas || !db.produtosOferta || db.produtosOferta.length === 0) {
        container.style.display = 'none';
        return;
    }

    container.style.display = 'block';
    // Estilos para o banner não esticar a imagem
    container.style.backgroundImage = "url('img/ofertas.png')";
    container.style.backgroundSize = "contain"; // "contain" mantém a proporção da sua arte
    container.style.backgroundPosition = "center";
    container.style.backgroundColor = "#000"; // Fundo preto caso a imagem não cubra tudo
    container.style.padding = "40px 10px";

    grid.style.display = "flex";
    grid.style.overflowX = "auto";
    grid.style.gap = "15px";

    grid.innerHTML = db.produtosOferta.map(p => `
        <div class="card-oferta" onclick="localStorage.setItem('produtoAtualID', '${p.id}'); window.location.href='produto.html'" 
             style="background: white; padding: 10px; border-radius: 8px; min-width: 160px; flex-shrink: 0; text-align: center; box-shadow: 0 4px 10px rgba(0,0,0,0.3);">
            <img src="${(p.imagens && p.imagens[0]) || 'img/placeholder.png'}" style="width: 100%; height: 100px; object-fit: cover; border-radius: 4px;">
            <p style="font-size: 12px; font-weight: bold; margin: 5px 0; color: #333;">${p.nome}</p>
            <span style="text-decoration: line-through; color: #999; font-size: 10px;">R$ ${parseFloat(p.precoAntigo).toFixed(2)}</span>
            <span style="color: #e74c3c; font-weight: bold; font-size: 14px; display: block;">R$ ${parseFloat(p.preco).toFixed(2)}</span>
        </div>
    `).join('');
}

// 5. Inicialização automática ao carregar a página
document.addEventListener('DOMContentLoaded', () => {
    // Se estiver no admin, marca o checkbox conforme o banco de dados
    const checkbox = document.getElementById('toggle-ofertas');
    if (checkbox) {
        checkbox.checked = db.ofertasAtivas;
    }
    
    // Se estiver na index, desenha o scroll
    renderizarScrollOfertas();
});

// FORÇAR EXIBIÇÃO DO ID (Corrigido para o seu HTML)
function injetarIDsNaTabela() {
    const corpoTabela = document.getElementById('product-table-body'); // O ID correto do seu HTML
    if (!corpoTabela) return;

    if (db.produtos.length === 0) {
        corpoTabela.innerHTML = '<tr><td colspan="6" style="text-align:center">Nenhum produto no estoque</td></tr>';
        return;
    }

    corpoTabela.innerHTML = db.produtos.map(p => `
        <tr>
            <td><img src="${(p.imagens && p.imagens[0]) || 'img/placeholder.png'}" width="40"></td>
            <td>${p.nome}</td>
            <td>${p.estoque}</td>
            <td>R$ ${p.preco}</td>
            <td>
                <button class="btn-excluir" data-id="${p.id}" style="color:red; border:none; background:none; cursor:pointer;">Excluir</button>
            </td>
            <td style="font-weight:bold; color:#3483fa;">${p.id || 'SEM ID'}</td>
        </tr>
    `).join('');
}

// Intercepta a renderização do script principal
const renderOriginal = window.renderizarEstoque;
window.renderizarEstoque = function() {
    if (typeof renderOriginal === 'function') renderOriginal();
    injetarIDsNaTabela();
};

// Força a execução assim que abrir
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(injetarIDsNaTabela, 500);
});