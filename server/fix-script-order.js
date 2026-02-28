/**
 * fix-script-order.js
 * Corrige problemas de ordem de carregamento de scripts
 * Injetar PRIMEIRO (antes de todos os outros scripts)
 */

// Garante que 'db' existe antes de ofertas.js tentar usar
if (typeof db === 'undefined') {
  window.db = JSON.parse(localStorage.getItem('lojaDB')) || {
    usuarios: [],
    produtos: [],
    carrinho: [],
    vendas: [],
    produtosOferta: [],
    ofertasAtivas: false
  };
}

// Garante que 'usuarioLogado' existe
if (typeof usuarioLogado === 'undefined') {
  window.usuarioLogado = JSON.parse(localStorage.getItem('usuarioLogado')) || null;
}

// Proteção para main.js linha 225 - elemento que pode não existir
document.addEventListener('DOMContentLoaded', () => {
  const configLink = document.querySelector('a[href="#config"]');
  if (configLink && typeof configLink.addEventListener === 'function') {
    configLink.addEventListener('click', () => {
      const admin = JSON.parse(localStorage.getItem('usuarioLogadoDados')) || { nome: 'Admin', email: 'admin@loja.com', avatar: 'AM' };
      
      const usernameInput = document.getElementById('new-username');
      const emailInput = document.getElementById('admin-email-input');
      const avatarPreview = document.getElementById('avatarPreview');
      
      if (usernameInput) usernameInput.value = admin.nome;
      if (emailInput) emailInput.value = admin.email;
      if (avatarPreview && admin.avatar) avatarPreview.innerText = admin.avatar.substring(0, 2).toUpperCase();
    });
  }
});
