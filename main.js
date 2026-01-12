// main.js - Central de Inteligência e Correções

// 1. GARANTIA DE DADOS
if (!db.pedidos) {
    db.pedidos = JSON.parse(localStorage.getItem('pedidos')) || [];
}

// 2. HISTÓRICO DE PEDIDOS (Lógica de Filtros e Tempo)
function renderizarPedidos(filtro = 'todos') {
    const container = document.getElementById('lista-pedidos');
    if (!container) return;

    const agora = new Date().getTime();
    let pedidosFiltrados = db.pedidos;

    if (filtro !== 'todos') {
        pedidosFiltrados = db.pedidos.filter(p => p.status === filtro);
    }

    if (pedidosFiltrados.length === 0) {
        container.innerHTML = `<p style="text-align:center; color:#999; margin-top:50px;">Nenhum pedido nesta categoria.</p>`;
        return;
    }

    container.innerHTML = [...pedidosFiltrados].reverse().map(pedido => {
        let avisoTempo = "";
        let statusParaExibir = pedido.status;

        if (pedido.status === 'A Pagar') {
            const expiraEm = pedido.dataTimestamp + (30 * 60 * 1000);
            const minutosRestantes = Math.round((expiraEm - agora) / 60000);
            
            if (minutosRestantes > 0) {
                avisoTempo = `<br><small style="color:#e67e22; font-weight:bold;">Expira em ${minutosRestantes} min</small>`;
            } else {
                statusParaExibir = "Cancelado";
                avisoTempo = `<br><small style="color:red; font-weight:bold;">Tempo esgotado</small>`;
            }
        }

        return `
            <div class="pedido-card">
                <div style="display:flex; justify-content:space-between;">
                    <strong>Pedido #${pedido.id}</strong>
                    <span class="status-badge status-${statusParaExibir.toLowerCase().replace(' ', '-')}">${statusParaExibir}</span>
                </div>
                <hr style="margin:10px 0; border:0; border-top:1px solid #eee;">
                <div>
                    ${pedido.itens.map(item => `<p style="font-size:0.9rem;">${item.quantidade}x ${item.nome}</p>`).join('')}
                </div>
                <div style="margin-top:10px; display:flex; justify-content:space-between; align-items:flex-end;">
                    <div>
                        <p style="font-size:1.1rem; font-weight:bold;">Total: R$ ${parseFloat(pedido.total).toFixed(2).replace('.', ',')}</p>
                        ${avisoTempo}
                    </div>
                    ${statusParaExibir === 'Entregue' ? `<button class="tab-btn active" onclick="irParaAvaliar(${pedido.itens[0].id})">Avaliar</button>` : ''}
                </div>
            </div>
        `;
    }).join('');
}

// 3. SELEÇÃO NO CARRINHO (Soma apenas o que está marcado)
function renderizarCarrinhoComSelecao() {
    const lista = document.getElementById('lista-carrinho');
    if (!lista) return;

    if (db.carrinho.length === 0) {
        lista.innerHTML = '<div class="empty-cart">Carrinho vazio. <a href="index.html">Comprar!</a></div>';
        return;
    }

    lista.innerHTML = db.carrinho.map((item, index) => `
        <div class="cart-item" style="display:flex; gap:15px; background:white; padding:15px; margin-bottom:10px; border-radius:8px;">
            <input type="checkbox" class="cart-check" data-index="${index}" checked onchange="calcularTotalSelecionado()">
            <img src="${item.imagem}" style="width:60px; height:60px; object-fit:cover;">
            <div style="flex:1;">
                <h4>${item.nome}</h4>
                <strong>R$ ${parseFloat(item.preco * item.quantidade).toFixed(2).replace('.', ',')}</strong>
            </div>
            <button onclick="removerItemCarrinho(${index})" style="color:red; background:none; border:none; cursor:pointer;">X</button>
        </div>
    `).join('');
    calcularTotalSelecionado();
}

window.calcularTotalSelecionado = () => {
    let total = 0;
    document.querySelectorAll('.cart-check').forEach(check => {
        if (check.checked) {
            const item = db.carrinho[check.dataset.index];
            total += item.preco * item.quantidade;
        }
    });
    const formatado = `R$ ${total.toFixed(2).replace('.', ',')}`;
    if(document.getElementById('subtotal')) document.getElementById('subtotal').innerText = formatado;
    if(document.getElementById('total-geral')) document.getElementById('total-geral').innerText = formatado;
};

// 4. CORREÇÕES DE FLUXO (Onde resolvemos os problemas graves)

// CORREÇÃO: Limpa o carrinho ao finalizar compra
window.gerarNovoPedido = (itens, total) => {
    const novoPedido = {
        id: Math.floor(1000 + Math.random() * 9000),
        dataTimestamp: new Date().getTime(),
        itens: [...itens],
        total: total,
        status: 'A Pagar'
    };
    db.pedidos.push(novoPedido);
    
    // Remove do carrinho apenas o que foi comprado
    const idsComprados = itens.map(i => i.id);
    db.carrinho = db.carrinho.filter(item => !idsComprados.includes(item.id));
    
    save(); // Salva no banco principal
    localStorage.setItem('pedidos', JSON.stringify(db.pedidos));
    window.location.href = 'pedidos.html';
};

// CORREÇÃO: Impede ir para o pagamento se não tiver estoque
window.comprarAgora = () => {
    const idAtual = localStorage.getItem('produtoAtualID');
    const produto = db.produtos.find(p => p.id == idAtual);

    if (!produto || produto.estoque <= 0) {
        alert("Acabou o estoque!");
        return; // Mata a função aqui
    }
    adicionarAoCarrinhoLocal();
    window.location.href = "checkout.html";
};

// CORREÇÃO: Forçar o funcionamento do botão "Meus Pedidos" no Index
document.addEventListener('DOMContentLoaded', () => {
    // Injeta a função de clique no ícone ou texto de pedidos do index
    const userNav = document.querySelector('.user-nav');
    if (userNav) {
        const btnPedidos = Array.from(userNav.querySelectorAll('span')).find(s => s.innerText.includes('Meus') || s.innerText.includes('🛒'));
        if (btnPedidos) {
            const link = document.createElement('span');
            link.innerText = "Meus Pedidos";
            link.style.cursor = "pointer";
            link.onclick = () => window.location.href = 'pedidos.html';
            userNav.insertBefore(link, btnPedidos);
        }
    }
    
    if (document.getElementById('lista-pedidos')) renderizarPedidos();
    if (document.getElementById('lista-carrinho')) renderizarCarrinhoComSelecao();
});

// Funções de apoio
window.filtrarPedidos = (status, btn) => {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    renderizarPedidos(status);
};

window.removerItemCarrinho = (index) => {
    db.carrinho.splice(index, 1);
    save();
    renderizarCarrinhoComSelecao();
};

window.prosseguirParaCheckout = () => {
    const selecionados = [];
    document.querySelectorAll('.cart-check').forEach(check => {
        if (check.checked) selecionados.push(db.carrinho[check.dataset.index]);
    });
    if (selecionados.length === 0) return alert("Selecione um item!");
    localStorage.setItem('itensParaComprar', JSON.stringify(selecionados));
    window.location.href = 'checkout.html';
};