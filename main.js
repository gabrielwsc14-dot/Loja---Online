// main.js

// 1. Garante que a lista de pedidos existe no banco
if (!db.pedidos) {
    db.pedidos = JSON.parse(localStorage.getItem('pedidos')) || [];
}

function renderizarPedidos(filtro = 'todos') {
    const container = document.getElementById('lista-pedidos');
    if (!container) return; // Segurança caso o script rode em outra página

    const agora = new Date().getTime();
    
    let pedidosFiltrados = db.pedidos;

    // Filtro lógico
    if (filtro !== 'todos') {
        pedidosFiltrados = db.pedidos.filter(p => p.status === filtro);
    }

    if (pedidosFiltrados.length === 0) {
        container.innerHTML = `<p style="text-align:center; color:#999; margin-top:50px;">Nenhum pedido encontrado nesta categoria.</p>`;
        return;
    }

    // .reverse() para mostrar os mais recentes primeiro
    container.innerHTML = [...pedidosFiltrados].reverse().map(pedido => {
        let avisoTempo = "";
        let statusParaExibir = pedido.status;

        // Lógica dos 30 minutos para "A Pagar"
        if (pedido.status === 'A Pagar') {
            const expiraEm = pedido.dataTimestamp + (30 * 60 * 1000);
            const minutosRestantes = Math.round((expiraEm - agora) / 60000);
            
            if (minutosRestantes > 0) {
                avisoTempo = `<br><small style="color:#e67e22; font-weight:bold;">Expira em ${minutosRestantes} min</small>`;
            } else {
                statusParaExibir = "Cancelado";
                avisoTempo = `<br><small style="color:red; font-weight:bold;">Tempo de pagamento esgotado</small>`;
            }
        }

        return `
            <div class="pedido-card">
                <div style="display:flex; justify-content:space-between; align-items:center;">
                    <strong>Pedido #${pedido.id}</strong>
                    <span class="status-badge status-${statusParaExibir.toLowerCase().replace(' ', '-')}">${statusParaExibir}</span>
                </div>
                <hr style="margin:10px 0; border:0; border-top:1px solid #eee;">
                <div>
                    ${pedido.itens.map(item => `<p style="font-size:0.9rem; color:#555;">${item.quantidade}x ${item.nome}</p>`).join('')}
                </div>
                <div style="margin-top:10px; display:flex; justify-content:space-between; align-items:flex-end;">
                    <div>
                        <p style="font-size:1.1rem; font-weight:bold; color:#333;">Total: R$ ${parseFloat(pedido.total).toFixed(2).replace('.', ',')}</p>
                        ${avisoTempo}
                    </div>
                    ${statusParaExibir === 'Entregue' ? 
                        `<button class="tab-btn active" onclick="irParaAvaliar(${pedido.itens[0].id})" style="border-radius:4px; padding:5px 15px; font-size:0.8rem;">Avaliar</button>` 
                        : ''}
                </div>
            </div>
        `;
    }).join('');
}

// Funções globais para os botões do HTML
window.filtrarPedidos = (status, btn) => {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    renderizarPedidos(status);
};

window.irParaAvaliar = (produtoId) => {
    localStorage.setItem('produtoAtualID', produtoId);
    window.location.href = 'produto.html';
};

// Inicializa a tela quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('lista-pedidos')) {
        renderizarPedidos();
    }
});

// main.js - Lógica de Seleção no Carrinho

function renderizarCarrinhoComSelecao() {
    const lista = document.getElementById('lista-carrinho');
    const subtotalTxt = document.getElementById('subtotal');
    const totalTxt = document.getElementById('total-geral');
    
    if (!lista) return;

    if (db.carrinho.length === 0) {
        lista.innerHTML = '<div class="empty-cart">Seu carrinho está vazio. <a href="index.html">Vá às compras!</a></div>';
        subtotalTxt.innerText = "R$ 0,00";
        totalTxt.innerText = "R$ 0,00";
        return;
    }

    // Renderiza os itens com um Checkbox
    lista.innerHTML = db.carrinho.map((item, index) => `
        <div class="cart-item" style="display: flex; align-items: center; gap: 15px; background: white; padding: 15px; margin-bottom: 10px; border-radius: 8px;">
            <input type="checkbox" class="cart-check" data-index="${index}" checked onchange="calcularTotalSelecionado()" style="width: 20px; height: 20px; cursor: pointer;">
            
            <img src="${item.imagem}" style="width: 80px; height: 80px; object-fit: cover; border-radius: 5px;">
            
            <div style="flex: 1;">
                <h4 style="margin: 0; font-size: 1rem;">${item.nome}</h4>
                <p style="color: #666; font-size: 0.9rem;">Qtd: ${item.quantidade}</p>
                <strong style="color: #333;">R$ ${parseFloat(item.preco * item.quantidade).toFixed(2).replace('.', ',')}</strong>
            </div>
            
            <button onclick="removerItemCarrinho(${index})" style="background: none; border: none; color: #ff4d4d; cursor: pointer; font-size: 0.8rem;">Remover</button>
        </div>
    `).join('');

    calcularTotalSelecionado();
}

window.calcularTotalSelecionado = () => {
    const checkboxes = document.querySelectorAll('.cart-check');
    let total = 0;

    checkboxes.forEach(checkbox => {
        if (checkbox.checked) {
            const index = checkbox.getAttribute('data-index');
            const item = db.carrinho[index];
            total += item.preco * item.quantidade;
        }
    });

    const totalFormatado = `R$ ${total.toFixed(2).replace('.', ',')}`;
    document.getElementById('subtotal').innerText = totalFormatado;
    document.getElementById('total-geral').innerText = totalFormatado;
};

window.removerItemCarrinho = (index) => {
    db.carrinho.splice(index, 1);
    save(); // Função save() que já existe no seu script.js
    renderizarCarrinhoComSelecao();
};

// Modificando a função de prosseguir para o checkout
window.prosseguirParaCheckout = () => {
    const selecionados = [];
    const checkboxes = document.querySelectorAll('.cart-check');

    checkboxes.forEach(checkbox => {
        if (checkbox.checked) {
            const index = checkbox.getAttribute('data-index');
            selecionados.push(db.carrinho[index]);
        }
    });

    if (selecionados.length === 0) {
        alert("Selecione ao menos um item para comprar!");
        return;
    }

    // Salva apenas os itens selecionados para o checkout usar
    localStorage.setItem('itensParaComprar', JSON.stringify(selecionados));
    window.location.href = 'checkout.html';
};