/**

 * 1. BANCO DE DADOS (DATABASE)

 * Atualizado para suportar Carrinho, Pedidos e Configurações de Pagamento.

 */

let db = JSON.parse(localStorage.getItem('lojaDB')) || {

    "usuarios": [

        {

            "id": "admin_01",

            "nome": "Administrador",

            "usuario": "admin",

            "email": "admin@loja.com",

            "senha": "123",

            "role": "admin",

            "dadosCompra": null // Armazenará CPF e Endereço salvos

        }

    ],

    "produtos": [],

    "vendas": [],

    "equipe": ["admin@loja.com"],

    "configPagamento": {

        "pixChave": "",

        "tokenCartao": "",

        "taxaEntrega": 0

    },

    "carrinho": [] // Carrinho temporário (pode ser movido para o usuário depois)

};

// Estado do Usuário na sessão atual

// Mudamos de sessionStorage para localStorage para o login ser permanente

let usuarioLogado = JSON.parse(localStorage.getItem('usuarioLogado')) || null;



/**

 * 2. PERSISTÊNCIA E SINCRONIZAÇÃO

 */

function save() {
    localStorage.setItem('lojaDB', JSON.stringify(db));
    render(); // Importante para atualizar os números na tela na hora
}



/**

 * 3. UTILITÁRIOS DE MÍDIA (UPLOAD DE IMAGENS)

 */

async function converterArquivosParaBase64(listaArquivos) {

    const promessas = Array.from(listaArquivos).map(arquivo => {

        return new Promise((resolve) => {

            const leitor = new FileReader();

            leitor.readAsDataURL(arquivo);

            leitor.onload = (e) => {

                const img = new Image();

                img.src = e.target.result;

                img.onload = () => {

                    const canvas = document.createElement('canvas');

                    const MAX_WIDTH = 800;

                    let width = img.width;

                    let height = img.height;

                    if (width > MAX_WIDTH) {

                        height *= MAX_WIDTH / width;

                        width = MAX_WIDTH;

                    }

                    canvas.width = width;

                    canvas.height = height;

                    const ctx = canvas.getContext('2d');

                    ctx.drawImage(img, 0, 0, width, height);

                    resolve(canvas.toDataURL('image/jpeg', 0.7));

                };

            };

        });

    });

    return await Promise.all(promessas);

}



/**

 * 4. GESTÃO DE PRODUTOS (ADMIN)

 */

/**

 * 4. GESTÃO DE PRODUTOS (ADMIN)

 */

window.abrirModalProduto = () => {

    const inputArquivo = document.createElement('input');

    inputArquivo.type = 'file';

    inputArquivo.multiple = true;

    inputArquivo.accept = 'image/*';



    inputArquivo.onchange = async (evento) => {

        const arquivos = evento.target.files;

        if (arquivos.length === 0) return;

        if (arquivos.length > 15) {

            alert("Erro: Máximo de 15 fotos permitido.");

            return;

        }



        const nome = prompt("Nome do Produto:");

        const preco = prompt("Preço (ex: 89.90):");

        const estoque = prompt("Quantidade em estoque:");

        const descricao = prompt("Descrição:");



        if (!nome || !preco) return;



        try {

            const fotosBase64 = await converterArquivosParaBase64(arquivos);

            const novoProduto = {

                id: Date.now(),

                nome: nome,

                preco: preco.replace(',', '.'),

                estoque: parseInt(estoque) || 0,

                vendidos: 0,

                reservados: 0,

                imagens: fotosBase64,

                descricao: descricao || "",

                avaliacoes: []

            };

            db.produtos.push(novoProduto);

            save();

            alert("Produto cadastrado com sucesso!");

        } catch (erro) {

            alert("Erro ao processar imagens. Tente arquivos menores.");

        }

    };

    inputArquivo.click();

};



// Funções auxiliares anteriores removidas para evitar duplicatas



window.editarEstoque = (id) => {

    const produto = db.produtos.find(p => p.id === id);

    const novoValor = prompt(`Alterar estoque de ${produto.nome}:`, produto.estoque);

    if (novoValor !== null) {

        produto.estoque = parseInt(novoValor);

        save();

    }

};



window.reservarProduto = (produtoId, quantidade) => {

    const produto = db.produtos.find(p => p.id === produtoId);

    if (produto.estoque >= quantidade) {

        produto.estoque -= quantidade;

        produto.reservados += quantidade;

        save();



        // Timer de 30 minutos (1800000 ms)

        setTimeout(() => {

            const pAtual = db.produtos.find(p => p.id === produtoId);

            // Se o pagamento não foi confirmado nesse tempo (precisaremos de uma flag no pedido)

            // pAtual.estoque += quantidade;

            // pAtual.reservados -= quantidade;

            // save();

        }, 1800000);

    }

};



/**

 * 5. SISTEMA DE LOGIN, CADASTRO E CONTA

 */

window.fazerLogin = () => {

    const identificador = prompt("Entre com seu E-mail, Usuário ou Telefone:");

    if (identificador === null) return; // PARA AQUI se apertar cancelar



    const senhaInformada = prompt("Sua senha:");

    if (senhaInformada === null) return; // PARA AQUI se apertar cancelar



    const contaEncontrada = db.usuarios.find(u =>

        (u.email === identificador || u.usuario === identificador || u.telefone === identificador) &&

        u.senha === senhaInformada

    );



    if (contaEncontrada) {

        // Aqui também: troque sessionStorage por localStorage

        localStorage.setItem('usuarioLogado', JSON.stringify(contaEncontrada));

        alert(`Bem-vindo de volta, ${contaEncontrada.nome || contaEncontrada.usuario}!`);

        location.reload();

    }

};



// Esta função apenas abre o Modal que você criou no HTML

window.fazerCadastro = () => {

    const modal = document.getElementById('modal-cadastro');

    if (modal) {

        modal.style.display = 'block'; // Ou 'flex' se usar o CSS acima

    }

};



window.fecharCadastro = () => {

    const modal = document.getElementById('modal-cadastro');

    if (modal) {

        modal.style.display = 'none';

    }

};



// Esta é a função que o botão "Cadastrar" do Modal deve chamar

window.validarEFinalizarCadastro = () => {

    const nome = document.getElementById('cad-nome').value.trim();

    const usuario = document.getElementById('cad-usuario').value.trim();

    const email = document.getElementById('cad-email').value.trim();

    const tel = document.getElementById('cad-tel').value.trim();

    const senha = document.getElementById('cad-senha').value.trim();



    // 1. Validação de E-mail (Verifica formato nome@dominio.com)

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(email)) {

        alert("Por favor, insira um e-mail válido (ex: nome@email.com)");

        return;

    }



    // 2. Validação de Telefone (Apenas números, entre 10 e 11 dígitos)

    const telApenasNumeros = tel.replace(/\D/g, ''); // Remove letras e parênteses

    if (telApenasNumeros.length < 10 || telApenasNumeros.length > 11) {

        alert("O telefone deve ter DDD + número (ex: 33988887777) e não conter letras.");

        return;

    }



    // 3. Validação de Segurança Básica

    if (nome.length < 3) {

        alert("O nome completo é muito curto.");

        return;

    }



    if (senha.length < 4) {

        alert("A senha deve ter pelo menos 4 caracteres.");

        return;

    }



    // Se passou em tudo, salva

    const novoUsuario = {

        id: Date.now(),

        nome: nome,

        usuario: usuario,

        email: email,

        telefone: telApenasNumeros, // Salva limpo, só os números

        senha: senha,

        role: "cliente"

    };



    // ... final da função validarEFinalizarCadastro ...

    // ... dentro de validarEFinalizarCadastro ...

    db.usuarios.push(novoUsuario);

    localStorage.setItem('usuarioLogado', JSON.stringify(novoUsuario));

    save();



    // ADICIONE ESTA LINHA ABAIXO para fechar o modal antes de recarregar

    fecharCadastro();



    location.reload();

};



/**

 * 6. NAVEGAÇÃO E LOGOUT

 */

window.logout = () => {

    // Removemos de AMBOS para garantir que não sobre rastro da sessão

    sessionStorage.removeItem('usuarioLogado');

    localStorage.removeItem('usuarioLogado');

    window.location.href = "index.html";

};

// Navegação das abas do Admin.html

const linksMenuAdmin = document.querySelectorAll('.nav-link');

if (linksMenuAdmin) {

    linksMenuAdmin.forEach(link => {

        link.onclick = (e) => {

            e.preventDefault();

            const alvo = link.getAttribute('href').replace('#', '');



            document.querySelectorAll('.admin-section').forEach(secao => secao.style.display = 'none');

            const secaoAlvo = document.getElementById(alvo);

            if (secaoAlvo) secaoAlvo.style.display = 'block';



            linksMenuAdmin.forEach(l => l.classList.remove('active'));

            link.classList.add('active');

        };

    });

}


/**

 * 8. GESTÃO DE EQUIPE (ADMIN)

 */

window.buscarUsuarioParaEquipe = () => {

    const termo = document.getElementById('busca-usuario-equipe').value.toLowerCase();

    const resultadoDiv = document.getElementById('resultado-busca-equipe');



    if (!termo) return;



    // Procura o usuário no banco (que não seja admin já)

    const encontrado = db.usuarios.find(u =>

        (u.usuario.toLowerCase() === termo || u.email.toLowerCase() === termo)

    );



    if (encontrado) {
        resultadoDiv.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; background: #f0f7ff; padding: 15px; border-radius: 8px; border: 1px solid #cfe2ff;">
            <span><strong>${encontrado.nome}</strong> (@${encontrado.usuario})</span>
            ${encontrado.role === 'admin'
                ? '<span style="color: #27ae60; font-weight: bold;">Já é da Equipe</span>'
                : `<button onclick="adicionarAEquipe('${encontrado.id}')" style="background: #27ae60; color: white; border: none; padding: 8px 15px; border-radius: 4px; cursor: pointer;">+ Tornar Admin</button>`
            }
        </div>
    `;
    } else {
        resultadoDiv.innerHTML = `<p style="color: red;">Usuário não encontrado.</p>`;
    }
};



window.adicionarAEquipe = (id) => {

    const usuario = db.usuarios.find(u => u.id == id);

    if (usuario) {

        usuario.role = 'admin';

        if (!db.equipe.includes(usuario.email)) {

            db.equipe.push(usuario.email);

        }

        save();

        document.getElementById('resultado-busca-equipe').innerHTML = "";

        document.getElementById('busca-usuario-equipe').value = "";

        alert(`${usuario.nome} agora faz parte da equipe!`);

    }

};



window.removerDaEquipe = (email) => {

    if (email === 'admin@loja.com') return alert("O admin principal não pode ser removido.");



    if (confirm("Remover acesso administrativo deste usuário?")) {

        const usuario = db.usuarios.find(u => u.email === email);

        if (usuario) usuario.role = 'cliente';

        db.equipe = db.equipe.filter(e => e !== email);

        save();

    }

};



window.validarDadosCompra = (dados) => {

    // Verifica se os campos obrigatórios estão preenchidos

    if (!dados.cpf || !dados.endereco || !dados.telefone) {

        alert("Todos os campos (CPF, Endereço e Telefone) são obrigatórios!");

        return false;

    }



    // Regra: CPF deve ter 11 dígitos (simples)

    if (dados.cpf.length !== 11) {

        alert("CPF Inválido!");

        return false;

    }



    return true;

};



window.renderizarCarrinho = () => {

    const listaDiv = document.getElementById('lista-carrinho');

    const subtotalSpn = document.getElementById('subtotal');

    const totalSpn = document.getElementById('total-geral');



    if (!listaDiv) return;



    if (db.carrinho.length === 0) {

        listaDiv.innerHTML = `<div class="empty-cart">Seu carrinho está vazio. <a href="index.html">Vá às compras!</a></div>`;

        subtotalSpn.innerText = "R$ 0,00";

        totalSpn.innerText = "R$ 0,00";

        return;

    }



    let acumulado = 0;

    listaDiv.innerHTML = db.carrinho.map((item, index) => {

        const totalItem = item.preco * item.quantidade;

        acumulado += totalItem;

        return `

            <div class="cart-item">

                <img src="${item.imagem}" alt="${item.nome}">

                <div class="item-info">

                    <h4>${item.nome}</h4>

                    <div class="item-price">R$ ${item.preco.toFixed(2)}</div>

                </div>

                <div class="quantity-control">

                    <button onclick="alterarQuantidade(${index}, -1)">-</button>

                    <span>${item.quantidade}</span>

                    <button onclick="alterarQuantidade(${index}, 1)">+</button>

                </div>

                <button onclick="removerDoCarrinho(${index})" style="margin-left:20px; color:red; border:none; background:none; cursor:pointer;">🗑️</button>

            </div>

        `;

    }).join('');



    subtotalSpn.innerText = `R$ ${acumulado.toFixed(2)}`;

    totalSpn.innerText = `R$ ${acumulado.toFixed(2)}`;

};



window.alterarQuantidade = (index, valor) => {

    const item = db.carrinho[index];

    const novaQtd = item.quantidade + valor;



    if (novaQtd > 0) {

        const produtoDb = db.produtos.find(p => p.id === item.id);

        if (novaQtd <= produtoDb.estoque) {

            item.quantidade = novaQtd;

        } else {

            alert("Quantidade máxima em estoque atingida.");

        }

    }

    save();

    renderizarCarrinho();

};



window.removerDoCarrinho = (index) => {

    db.carrinho.splice(index, 1);

    save();

    renderizarCarrinho();

};



window.prosseguirParaCheckout = () => {

    if (!usuarioLogado) {

        alert("Você precisa estar logado para finalizar a compra.");

        fazerLogin();

        return;

    }

    // Próximo passo: Tela de CPF e Endereço

    window.location.href = "checkout.html";

};



window.renderizarCheckout = () => {

    const boxDados = document.getElementById('dados-usuario-box');

    const resumoItens = document.getElementById('resumo-itens');

    const totalPg = document.getElementById('total-checkout');



    if (!usuarioLogado) return window.location.href = "index.html";



    // 1. Gerenciar campos de dados (CPF/Endereço)

    // Buscamos o usuário atual no DB para ver se ele já tem dados salvos

    const userDb = db.usuarios.find(u => u.id === usuarioLogado.id);



    if (!userDb.cpf || !userDb.endereco) {

        boxDados.innerHTML = `

            <p style="color: #ee4d2d; font-size: 0.9rem;">Identificamos que esta é sua primeira compra. Por favor, preencha os dados obrigatórios:</p>

            <input type="text" id="compra-cpf" placeholder="CPF (Apenas números)" class="input-full">

            <input type="text" id="compra-tel" placeholder="WhatsApp / Celular" class="input-full" value="${userDb.telefone || ''}">

            <textarea id="compra-end" placeholder="Endereço Completo (Rua, Número, Bairro, Cidade)" class="input-full"></textarea>

        `;

    } else {

        boxDados.innerHTML = `

            <div class="dados-salvos">

                <p><strong>Destinatário:</strong> ${userDb.nome}</p>

                <p><strong>CPF:</strong> ${userDb.cpf}</p>

                <p><strong>Endereço:</strong> ${userDb.endereco}</p>

                <button onclick="editarDadosCompra()" class="btn-link">Editar dados de entrega</button>

            </div>

        `;

    }



    // 2. Resumo lateral

    let total = 0;

    resumoItens.innerHTML = db.carrinho.map(item => {

        total += (item.preco * item.quantidade);

        return `<div class="resumo-linha"><span>${item.quantidade}x ${item.nome}</span> <span>R$ ${(item.preco * item.quantidade).toFixed(2)}</span></div>`;

    }).join('');

    totalPg.innerText = `R$ ${total.toFixed(2)}`;

};



window.processarPedido = async () => {

    const userDb = db.usuarios.find(u => u.id === usuarioLogado.id);

    const publicKey = db.configPagamento.pixChave; // Usando o campo que você já tem



    if (!publicKey) {

        alert("Erro: O administrador não configurou as chaves de pagamento.");

        return;

    }



    // 1. Inicializa o Mercado Pago

    const mp = new MercadoPago(publicKey);



    // 2. Prepara os itens do carrinho para o formato que o banco entende

    const itensParaPagamento = db.carrinho.map(item => ({

        title: item.nome,

        unit_price: Number(item.preco),

        quantity: Number(item.quantidade),

        currency_id: 'BRL'

    }));



    // IMPORTANTE: Em um site real, a "Preferência de Pagamento"

    // deve ser criada em um servidor para segurança.

    // Como você está fazendo experimental, o banco oferece um botão de checkout.



    alert("Você será redirecionado para o ambiente seguro de pagamento.");



    // Aqui você faria uma chamada para criar o link de pagamento

    // Por enquanto, vamos manter a criação do pedido no seu banco local:

    finalizarVendaLocal(userDb);

};



function finalizarVendaLocal(userDb) {
    const novoPedido = {
        id: Date.now(),
        cliente: userDb.nome || userDb.usuario,
        itens: [...db.carrinho], // Aqui pegamos tudo o que estava no carrinho para o pedido
        total: document.getElementById('total-checkout').innerText,
        status: "Pendente",
        data: new Date().toLocaleString()
    };

    db.vendas.push(novoPedido);

    // Em vez de apenas "limpar", estamos esvaziando a lista de itens pendentes 
    // pois todos eles agora fazem parte de um pedido oficial (novoPedido.itens)
    db.carrinho = [];

    save(); // Grava a saída dos itens e a entrada da venda no lojaDB
    window.location.href = "sucesso.html";
}

function finalizarRegistroPedido(metodo, userDb) {
    const novoPedido = {
        id: Date.now(),
        cliente: userDb.nome || userDb.usuario,
        itens: [...db.carrinho],
        total: document.getElementById('total-checkout').innerText,
        status: "Aguardando Pagamento",
        metodo: metodo,
        data: new Date().toLocaleString(),
        dataTimestamp: Date.now()
    };

    // 1. Adiciona a venda ao banco
    db.vendas.push(novoPedido);

    // 2. FILTRO INTELIGENTE:
    // Mantém no carrinho apenas os produtos cujos IDs NÃO estão no pedido atual
    const idsComprados = novoPedido.itens.map(item => item.id);
    db.carrinho = db.carrinho.filter(item => !idsComprados.includes(item.id));

    // 3. Salva o banco atualizado (com o que sobrou no carrinho)
    save();
    window.location.href = "sucesso.html";
}



// Função auxiliar para limpar o código

function finalizarRegistroPedido(metodo, userDb) {

    const novoPedido = {

        id: Date.now(),

        cliente: userDb.nome,

        itens: [...db.carrinho],

        total: document.getElementById('total-checkout').innerText,

        status: "Aguardando Pagamento",

        metodo: metodo,

        data: new Date().toLocaleString(),

        dataTimestamp: Date.now()

    };



    // 1. Adiciona a venda ao banco
    db.vendas.push(novoPedido);

    // 2. FILTRO INTELIGENTE:
    // Mantém no carrinho apenas os produtos cujos IDs NÃO estão no pedido atual
    const idsComprados = novoPedido.itens.map(item => item.id);
    db.carrinho = db.carrinho.filter(item => !idsComprados.includes(item.id));

    // 3. Salva o banco atualizado (com o que sobrou no carrinho)
    save();
    window.location.href = "sucesso.html";

}



window.editarDadosCompra = () => {

    const userDb = db.usuarios.find(u => u.id === usuarioLogado.id);

    userDb.cpf = ""; // Reset para forçar o formulário a aparecer

    save();

    renderizarCheckout();

};



// --- FUNÇÕES DO PAINEL ADMIN ---



window.salvarConfigPagamento = () => {

    // Pega os valores dos inputs do seu HTML de Admin

    const chavePix = document.getElementById('admin-pix-key').value;

    const tokenCartao = document.getElementById('admin-card-token').value;



    // Se o objeto de configurações não existir no banco, a gente cria

    if (!db.configPagamento) {

        db.configPagamento = {};

    }



    // Salva os dados

    db.configPagamento.pixChave = chavePix;

    db.configPagamento.cartaoToken = tokenCartao;



    save(); // Esta é a sua função que dá o localStorage.setItem

    alert("Configurações de pagamento salvas com sucesso!");

};



// --- AJUSTE NA HORA DA COMPRA (Checkout) ---



// Procure sua função de processarPedido e verifique se a parte do Pix está assim:

// Ela precisa ler a chave que você salvou no Admi



window.renderizarVendasAdmin = () => {

    const listaVendas = document.getElementById('lista-vendas-admin');

    if (!listaVendas) return;



    if (db.vendas.length === 0) {

        listaVendas.innerHTML = "<tr><td colspan='5' style='text-align:center; padding:20px;'>Nenhuma venda realizada.</td></tr>";

        return;

    }



    const vendasOrdenadas = [...db.vendas].reverse();



    listaVendas.innerHTML = vendasOrdenadas.map(venda => `

        <tr style="border-bottom: 1px solid #eee;">

            <td style="padding:15px;">

                <strong>#${venda.id.toString().slice(-6)}</strong><br>

                <small>${venda.data}</small>

            </td>

            <td>

                <strong>${venda.cliente}</strong>

            </td>

            <td><strong>${venda.total}</strong></td>

            <td>

                <span style="background: ${venda.status === 'Aguardando Pagamento' ? '#ffeeba' : '#c3e6cb'}; padding: 5px 10px; border-radius: 15px; font-size: 0.8rem;">

                    ${venda.status}

                </span>

            </td>

            <td>

                <button onclick="toggleDetalhes(${venda.id})" style="background:#eee; border:1px solid #ccc; padding:5px; cursor:pointer; border-radius:4px;">👁️ Ver Itens</button>

            </td>

        </tr>

        <tr id="detalhe-${venda.id}" style="display:none; background:#f9f9f9;">

            <td colspan="5" style="padding:15px; border-bottom: 1px solid #ddd;">

                <div style="display:grid; gap:10px;">

                    <strong>Produtos deste pedido:</strong>

                    ${venda.itens.map(item => `

                        <div style="display:flex; justify-content:space-between; font-size:0.9rem; border-left:3px solid #3483fa; padding-left:10px;">

                            <span>${item.quantidade}x ${item.nome}</span>

                            <span>R$ ${(item.preco * item.quantidade).toFixed(2)}</span>

                        </div>

                    `).join('')}

                    <div style="margin-top:10px; font-size:0.8rem; color:#666;">

                        <strong>Método:</strong> ${venda.metodo.toUpperCase()}

                    </div>

                </div>

            </td>

        </tr>

    `).join('');

};



// Função para abrir/fechar a linha de detalhes

window.toggleDetalhes = (id) => {

    const el = document.getElementById(`detalhe-${id}`);

    el.style.display = el.style.display === 'none' ? 'table-row' : 'none';

};



window.verDetalhesVenda = (id) => {

    const venda = db.vendas.find(v => v.id === id);

    // Aqui você pode fazer um prompt ou um modal mais elaborado com o endereço

    alert(`Detalhes da Entrega:\n\nCliente: ${venda.cliente}\nTotal: ${venda.total}\nItens: ${venda.itens.map(i => i.nome).join(', ')}`);

};



window.renderizarFinanceiro = () => {

    const filtro = document.getElementById('filtro-data').value;

    const listaCorpo = document.getElementById('lista-financeiro-corpo');

    if (!listaCorpo) return;



    const agora = new Date();



    const vendasFiltradas = db.vendas.filter(venda => {

        const dataVenda = new Date(venda.id);

        const diffDias = (agora - dataVenda) / (1000 * 60 * 60 * 24);
        if (filtro === 'hoje') return diffDias < 1;
        if (filtro === '7dias') return diffDias <= 7;
        if (filtro === '30dias') return diffDias <= 30;
        return true;
    });

    let totalFaturamento = 0;
    let totalItensVendidos = 0;

    listaCorpo.innerHTML = vendasFiltradas.map(venda => {
        const valorLimpo = parseFloat(venda.total.replace('R$', '').replace('.', '').replace(',', '.'));
        totalFaturamento += valorLimpo;

        const qtdItens = venda.itens.reduce((acc, item) => acc + item.quantidade, 0);
        totalItensVendidos += qtdItens;

        return `
            <tr style="border-bottom: 1px solid #eee;">
                <td style="padding: 12px;">${venda.data.split(' ')[0]}</td>
                <td>#${venda.id.toString().slice(-5)}</td>
                <td style="font-size:0.85rem;">${venda.itens.map(i => i.nome).join(', ')}</td>
                <td style="color: #27ae60; font-weight: bold;">${venda.total}</td>
            </tr>
        `;
    }).join('');

    // Atualiza os indicadores no topo
    if (document.getElementById('fin-faturamento')) {
        document.getElementById('fin-faturamento').innerText = `R$ ${totalFaturamento.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
        document.getElementById('fin-pedidos').innerText = vendasFiltradas.length;
        document.getElementById('fin-ticket').innerText = `Itens: ${totalItensVendidos}`;
    }

    if (vendasFiltradas.length === 0) {
        listaCorpo.innerHTML = "<tr><td colspan='4' style='text-align:center; padding:20px;'>Nenhuma venda no período.</td></tr>";
    }
};

/**
 * FUNÇÃO PARA ABRIR PÁGINA DO PRODUTO
 */
window.verProduto = (id) => {
    // Salvamos apenas o ID para o produto.html buscar no banco atualizado
    localStorage.setItem('produtoAtualID', id);
    window.location.href = "produto.html"
};

function salvarAlteracoesPerfil() {
    const novoNome = document.getElementById('edit-nome').value;
    const novoUser = document.getElementById('edit-usuario').value;
    const novoEmail = document.getElementById('edit-email').value;

    // Validação: Usuário já existe? (Ignora se for o próprio usuário atual)
    const usuarioExiste = db.usuarios.find(u => u.usuario === novoUser && u.id !== usuarioLogado.id);
    
    if (usuarioExiste) {
        alert("Este nome de usuário já está em uso!");
        return;
    }

    // Atualiza no Banco de Dados (db)
    const index = db.usuarios.findIndex(u => u.id === usuarioLogado.id);
    db.usuarios[index].nome = novoNome;
    db.usuarios[index].usuario = novoUser;
    db.usuarios[index].email = novoEmail;

    // Atualiza a sessão atual
    usuarioLogado = db.usuarios[index];
    
    // Salva tudo no LocalStorage
    localStorage.setItem('lojaDB', JSON.stringify(db));
    localStorage.setItem('usuarioLogado', JSON.stringify(usuarioLogado));

    alert("Dados atualizados com sucesso!");
    location.reload(); // Recarrega para aplicar as mudanças
}

/**
 * 7. RENDERIZAÇÃO DE INTERFACE (INDEX, ADMIN E PRODUTO)
 */
/**
 * 7. RENDERIZAÇÃO DE INTERFACE (ÚNICA E CENTRALIZADA)
 */
function render() {
    // 7.1 HEADER DINÂMICO (Dentro da função render no seu script.js)
    // 7.1 HEADER DINÂMICO
    // 7.1 HEADER DINÂMICO
    const containerNav = document.querySelector('.user-nav');
    if (containerNav) {
        // ... dentro da function render()
if (usuarioLogado) {
    containerNav.innerHTML = `
    <div class="user-profile-wrapper" style="position: relative; display: flex; align-items: center; gap: 15px;">
        <div class="avatar-wheel" onclick="document.getElementById('profile-dropdown').classList.toggle('show')" style="width:40px; height:40px; background:#3483fa; color:white; border-radius:50%; display:flex; align-items:center; justify-content:center; cursor:pointer; font-weight:bold;">
            ${usuarioLogado.usuario.charAt(0).toUpperCase()}
        </div>
        <div id="profile-dropdown" class="profile-menu-content">
            <div class="menu-header">Olá, ${usuarioLogado.usuario}</div>
            
            <a href="pedidos.html">📦 Meus Pedidos</a>
            
            <a href="account.html">👤 Minha Conta</a>
            
            ${usuarioLogado.role === 'admin' ? '<a href="admin.html" style="color: #27ae60; font-weight: bold;">⚙️ Painel Admin</a>' : ''}
            
            <hr>
            <a href="#" onclick="logout()" style="color: red;">Sair</a>
        </div>
    </div>
    <span class="cart-icon" style="cursor:pointer" onclick="window.location.href='carrinho.html'">🛒</span>
    `;
    // ... resto do código de injeção de CSS
}
            // Injeção de CSS (Executa apenas se o usuário estiver logado e o estilo não existir)
            if (!document.getElementById('perfil-style')) {
                const style = document.createElement('style');
                style.id = 'perfil-style';
                style.innerHTML = `
                .profile-menu-content { position: absolute; top: 50px; right: 0; background: white; border: 1px solid #ddd; box-shadow: 0 8px 16px rgba(0,0,0,0.1); padding: 10px; border-radius: 8px; display: none; min-width: 180px; z-index: 9999; }
                .profile-menu-content.show { display: block; }
                .profile-menu-content a { display: block; padding: 10px; color: #333; text-decoration: none; font-size: 0.9rem; }
                .menu-header { padding: 10px; font-weight: bold; border-bottom: 1px solid #eee; }
                @media (max-width: 768px) {
                    .profile-menu-content { right: 50%; transform: translateX(50%); width: 250px; max-width: 90vw; }
                }
            `;
                document.head.appendChild(style);
            }

        } else {
            // Caso NÃO esteja logado (Isso é importante para não quebrar o layout)
            containerNav.innerHTML = `
            <span onclick="fazerCadastro()" style="cursor:pointer">Crie sua conta</span>
            <span onclick="fazerLogin()" style="cursor:pointer; margin-left:15px;">Entre</span>
            <span class="cart-icon" style="cursor:pointer; margin-left:15px;" onclick="window.location.href='carrinho.html'">🛒</span>
        `;
        }
    } // <--- Aqui fecha o if(containerNav)

    // 7.2 VITRINE (PÁGINA INICIAL) - Agora fora dos blocos de login
    // 7.2 VITRINE (PÁGINA INICIAL) - Atualizada para mostrar Ofertas
    // --- 7.2 VITRINE (PÁGINA INICIAL DO CLIENTE) ---
    const vitrine = document.getElementById('vitrine-index');
    if (vitrine) {
        vitrine.innerHTML = db.produtos.map(p => {
            const precoOriginal = parseFloat(p.preco).toFixed(2).replace('.', ',');
            const temOferta = (db.ofertasAtivas && p.isOferta && p.precoAntigo);

            return `
            <div class="product-card" onclick="verProduto(${p.id})">
                <img src="${(p.imagens && p.imagens[0]) || 'img/placeholder.png'}" style="width:100%; height:180px; object-fit:cover; border-radius:8px;">
                <h4>${p.nome}</h4>
                <div class="price-container">
                    ${temOferta ? 
                        `<span style="text-decoration: line-through; color: #999; font-size: 0.8rem; display: block;">De R$ ${parseFloat(p.precoAntigo).toFixed(2).replace('.', ',')}</span>
                         <span class="price" style="color: #e74c3c; font-weight: bold;">Por R$ ${precoOriginal}</span>` 
                        : `<p class="price">R$ ${precoOriginal}</p>`
                    }
                </div>
                <button class="btn-ver">Ver Detalhes</button>
            </div>`;
        }).join('');
    }

    // --- NOVO: TABELA DE ESTOQUE (PAINEL ADMIN) ---
    const corpoTabela = document.getElementById('product-table-body');
    if (corpoTabela) {
        corpoTabela.innerHTML = db.produtos.map(p => {
            const idSeguro = String(p.id); // Evita erro de arredondamento no mobile
            const precoFormatado = parseFloat(p.preco).toFixed(2).replace('.', ',');

            return `
            <tr>
                <td><img src="${(p.imagens && p.imagens[0]) || 'img/placeholder.png'}" width="40" height="40" style="object-fit:cover; border-radius:4px;"></td>
                <td>${p.nome}</td>
                <td>${p.estoque} un</td>
                <td>R$ ${precoFormatado}</td>
                <td>
                    <button class="btn-excluir" data-id="${idSeguro}" style="color:#e74c3c; background:none; border:none; cursor:pointer; font-weight:bold; padding:5px;">Excluir</button>
                </td>
                <td style="font-family: monospace; font-size: 11px; color: #999;">${idSeguro}</td>
            </tr>`;
        }).join('');
    }

    if (document.getElementById('lista-vendas-admin')) renderizarVendasAdmin();

    if (document.getElementById('financeiro')) renderizarFinanceiro();

    // Lista de Equipe

    const listaEquipe = document.getElementById('lista-equipe');

    if (listaEquipe) {
        const membrosAdmin = db.usuarios.filter(u => u.role === 'admin');
        listaEquipe.innerHTML = membrosAdmin.map(m => `
            <li style="display: flex; justify-content: space-between; padding: 10px; border-bottom: 1px solid #eee;">

                <span><strong>${m.nome || m.usuario}</strong> (${m.email})</span>

                ${m.email !== 'admin@loja.com' ? `<button onclick="removerDaEquipe('${m.email}')" style="color:red; border:none; background:none; cursor:pointer;">Remover</button>` : '<i>Dono</i>'}

            </li>

        `).join('');

    }

    // ... dentro da function render(), logo após a parte da equipe:

 // <--- Aqui fecha a sua function render()

// --- FUNÇÃO DE EXCLUSÃO (DEVE SER GLOBAL) ---
window.excluirProduto = function (id) {
    console.log('excluirProduto called', id);
    if (confirm("Tem certeza que deseja remover este produto?")) {
        // Filtra o banco removendo o ID correspondente
        db.produtos = db.produtos.filter(p => String(p.id) !== String(id));

        // Salva no LocalStorage
        localStorage.setItem('lojaDB', JSON.stringify(db));

        // Atualiza a tela imediatamente
        render();
        alert("Produto removido com sucesso!");
    }
};



/**

 * 9. INICIALIZAÇÃO E EVENTOS GLOBAIS

 */

document.addEventListener('DOMContentLoaded', () => {

    // Garante que o banco não quebre se faltar alguma chave nova

    if (!db.vendas) db.vendas = [];

    if (!db.carrinho) db.carrinho = [];



    render();

    // Delegated listener for admin product table (robust against re-renders)
    const corpoTabela = document.getElementById('product-table-body');
    if (corpoTabela && !corpoTabela.__hasExcluirListener) {
        corpoTabela.addEventListener('click', (e) => {
            const btn = e.target.closest('.btn-excluir');
            if (btn) {
                const id = btn.dataset.id;
                window.excluirProduto(id);
            }
        });
        corpoTabela.__hasExcluirListener = true;
    }

});



// Fecha o menu de perfil se clicar fora dele

window.onclick = (event) => {

    if (!event.target.matches('.avatar-wheel')) {

        const dropdowns = document.getElementsByClassName("profile-menu-content");

        for (let d of dropdowns) {

            if (d.classList.contains('show')) d.classList.remove('show');

        }

    }

};

// Garante que as funções de oferta rodem após a renderização principal
const renderOriginalSjs = render;
render = function () {
    renderOriginalSjs();
    if (typeof renderizarScrollOfertas === 'function') {
        renderizarScrollOfertas();
    }
};