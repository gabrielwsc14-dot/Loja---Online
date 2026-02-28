// main.js - APENAS LÓGICA (Sem mexer na interface)



// 1. GARANTIA DE DADOS

if (!db.pedidos) {

    db.pedidos = JSON.parse(localStorage.getItem('pedidos')) || [];

}



// 2. RENDERIZAÇÃO DA TELA DE PEDIDOS

function renderizarPedidos(filtro = 'todos') {

    const container = document.getElementById('lista-pedidos');

    if (!container) return;



    const agora = new Date().getTime();

    let pedidosFiltrados = [...db.pedidos];



    if (filtro !== 'todos') {

        pedidosFiltrados = pedidosFiltrados.filter(p => p.status === filtro);

    }



    if (pedidosFiltrados.length === 0) {

        container.innerHTML = `<p style="text-align:center; color:#999; margin-top:50px;">Nenhum pedido nesta categoria.</p>`;

        return;

    }



    container.innerHTML = pedidosFiltrados.reverse().map(pedido => {

        let avisoTempo = "";

        let statusParaExibir = pedido.status;



        if (pedido.status === 'A Pagar') {

            const expiraEm = (pedido.dataTimestamp || agora) + (30 * 60 * 1000);

            const minutosRestantes = Math.round((expiraEm - agora) / 60000);

            if (minutosRestantes <= 0) {

                statusParaExibir = "Cancelado";

                avisoTempo = `<br><small style="color:red;">Tempo esgotado</small>`;

            } else {

                avisoTempo = `<br><small style="color:#e67e22;">Expira em ${minutosRestantes} min</small>`;

            }

        }



        return `

            <div class="pedido-card">

                <div style="display:flex; justify-content:space-between;">

                    <strong>Pedido #${pedido.id}</strong>

                    <span class="status-badge status-${statusParaExibir.toLowerCase().replace(' ', '-')}">${statusParaExibir}</span>

                </div>

                <div style="margin:10px 0; font-size:0.9rem; color:#555;">

                    ${pedido.itens.map(item => `<p>${item.quantidade}x ${item.nome}</p>`).join('')}

                </div>

                <div style="display:flex; justify-content:space-between; align-items:flex-end;">

                    <div>

                        <strong style="font-size:1.1rem;">Total: R$ ${parseFloat(pedido.total).toFixed(2).replace('.', ',')}</strong>

                        ${avisoTempo}

                    </div>

                </div>

            </div>

        `;

    }).join('');

}



// 3. LOGICA DO CARRINHO (Soma apenas selecionados)

window.calcularTotalSelecionado = () => {

    let total = 0;

    const checks = document.querySelectorAll('.cart-check');

    checks.forEach(check => {

        if (check.checked) {

            const item = db.carrinho[check.dataset.index];

            if(item) total += (item.preco * item.quantidade);

        }

    });

    const txt = `R$ ${total.toFixed(2).replace('.', ',')}`;

    if(document.getElementById('subtotal')) document.getElementById('subtotal').innerText = txt;

    if(document.getElementById('total-geral')) document.getElementById('total-geral').innerText = txt;

};



// 4. CORREÇÕES DE ESTOQUE E LIMPEZA

const originalComprarAgora = window.comprarAgora;

window.comprarAgora = () => {

    const id = localStorage.getItem('produtoAtualID');

    const p = db.produtos.find(prod => prod.id == id);

    if (!p || p.estoque <= 0) return alert("Sem estoque!");

   

    adicionarAoCarrinhoLocal();

    window.location.href = "checkout.html";

};



window.gerarNovoPedido = (itens, total) => {

    const novo = {

        id: Math.floor(1000 + Math.random() * 9000),

        dataTimestamp: new Date().getTime(),

        itens: [...itens],

        total: total,

        status: 'A Pagar'

    };

    db.pedidos.push(novo);

   

    // Limpa apenas o que comprou

    const ids = itens.map(i => i.id);

    db.carrinho = db.carrinho.filter(c => !ids.includes(c.id));

   

    save();

    localStorage.setItem('pedidos', JSON.stringify(db.pedidos));

    window.location.href = 'pedidos.html';

};

window.filtrarPedidos = (status, btn) => {

    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));

    btn.classList.add('active');

    renderizarPedidos(status);

};



// --- Lógica Profissional da Seção Minha Conta ---



// 1. Carregar dados ao abrir a seção

const configLink = document.querySelector('a[href="#config"]');
if (configLink) {
configLink.addEventListener('click', () => {

    const admin = JSON.parse(localStorage.getItem('usuarioLogadoDados')) || { nome: 'Admin', email: 'admin@loja.com', avatar: 'AM' };

    document.getElementById('new-username').value = admin.nome;

    document.getElementById('admin-email-input').value = admin.email;

    if(admin.avatar) document.getElementById('avatarPreview').innerText = admin.avatar.substring(0,2).toUpperCase();

});
}


// 2. Alterar Foto (Simulação com Iniciais)

function alterarFoto() {

    const novoNome = document.getElementById('new-username').value;

    const iniciais = novoNome.substring(0, 2).toUpperCase();

    document.getElementById('avatarPreview').innerText = iniciais;

   

    // Salva no objeto do admin

    let dados = JSON.parse(localStorage.getItem('usuarioLogadoDados')) || {};

    dados.avatar = iniciais;

    localStorage.setItem('usuarioLogadoDados', JSON.stringify(dados));

    alert("Avatar atualizado com as iniciais!");

}



// 3. Modo Escuro (Toggle de Classe no Body)

// Função para alternar
function toggleDarkMode() {
    document.body.classList.toggle('dark-mode');
    const isDark = document.body.classList.contains('dark-mode');
    localStorage.setItem('darkMode', isDark);
}

document.addEventListener('DOMContentLoaded', () => {
    // --- Lógica do Modo Escuro ---
    const isDark = localStorage.getItem('darkMode') === 'true';
    if (isDark) document.body.classList.add('dark-mode');

    const darkSwitch = document.getElementById('darkModeSwitch');
    if (darkSwitch) darkSwitch.checked = isDark;

    // --- Lógica dos Pedidos ---
    if (document.getElementById('lista-pedidos')) {
        renderizarPedidos();
    }
});