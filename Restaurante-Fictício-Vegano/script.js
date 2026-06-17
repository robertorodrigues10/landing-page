/* Inicia a biblioteca AOS (animações ao scroll) */
if (window.AOS && typeof AOS.init === 'function') {
  AOS.init();
}



/* Validação do formulário de contato antes de redirecionar para o Gmail */
document.addEventListener('DOMContentLoaded', function () {
  const forms = document.querySelectorAll('form[data-email-subject]');

  function validarEmail(email) {
    return /\S+@\S+\.\S+/.test(email);
  }

  if (forms.length) {
    forms.forEach((form) => {
      const nomeInput = form.querySelector('[name="nome"]');
      const emailInput = form.querySelector('[name="email"]');
      const mensagemInput = form.querySelector('[name="mensagem"]');

      form.addEventListener('submit', function (e) {
        if (!nomeInput || !emailInput || !mensagemInput) return;

        [nomeInput, emailInput, mensagemInput].forEach((el) => el.classList.remove('is-invalid'));

      let valido = true;

      if (!nomeInput.value.trim()) {
        nomeInput.classList.add('is-invalid');
        valido = false;
      }

      if (!emailInput.value.trim() || !validarEmail(emailInput.value.trim())) {
        emailInput.classList.add('is-invalid');
        valido = false;
      }

      if (!mensagemInput.value.trim() || mensagemInput.value.trim().length < 5) {
        mensagemInput.classList.add('is-invalid');
        valido = false;
      }

      if (!valido) {
        e.preventDefault();
        const primeiroInvalido = form.querySelector('.is-invalid');
        if (primeiroInvalido) primeiroInvalido.focus();
        return;
      }

      e.preventDefault();
      const submitBtn = form.querySelector('button[type="submit"]');
      if (submitBtn) {
        if (!submitBtn.dataset.origText) submitBtn.dataset.origText = submitBtn.textContent;
        submitBtn.disabled = true;
        submitBtn.textContent = 'Abrindo Gmail...';
      }

      const emailTo = 'roberto.rodrigues10@aluno.ifce.edu.br';
      const subject = form.dataset.emailSubject || 'Contato - Restaurante Fictício';
      const body = `Nome: ${nomeInput.value.trim()}\nEmail: ${emailInput.value.trim()}\n\nMensagem:\n${mensagemInput.value.trim()}`;
      const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&tf=1&to=${encodeURIComponent(emailTo)}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

      window.open(gmailUrl, '_blank');
    });
  });
  }



  // Restaura botões de submit quando o usuário volta ao site (ex.: fechou Gmail)
  function restoreSubmitButtons() {
    document.querySelectorAll('form[data-email-subject] button[type="submit"]').forEach((btn) => {
      if (btn.disabled) btn.disabled = false;
      if (btn.dataset.origText) btn.textContent = btn.dataset.origText;
    });
  }

  document.addEventListener('visibilitychange', function () {
    if (!document.hidden) restoreSubmitButtons();
  });

  window.addEventListener('focus', restoreSubmitButtons);



// Lógica de pedido no cardápio
  const orderButton = document.getElementById('send-order');
  const orderSummary = document.getElementById('order-summary');
  const orderNameInput = document.getElementById('order-name');
  const orderAddressInput = document.getElementById('order-address');
  const dishQuantityInputs = Array.from(document.querySelectorAll('.dish-quantity'));
  const quantityButtons = Array.from(document.querySelectorAll('.qty-decrease, .qty-increase'));

  function formatPrice(value) {
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  }

  function getOrderItems() {
    return dishQuantityInputs
      .map((input) => {
        const quantity = parseInt(input.value, 10) || 0;
        if (quantity <= 0) return null;
        const card = input.closest('.dish-card');
        const name = card?.dataset.name || card?.querySelector('h3')?.textContent || 'Prato';
        const price = parseFloat(card?.dataset.price || '0');
        return { name, price, quantity, total: price * quantity };
      })
      .filter(Boolean);
  }

  function updateOrderSummary() {
    if (!orderSummary) return;
    const items = getOrderItems();
    if (!items.length) {
      orderSummary.textContent = 'Escolha as quantidades, informe nome e endereço, e envie seu pedido.';
      return;
    }

    const total = items.reduce((sum, item) => sum + item.total, 0);
    const itemText = items
      .map((item) => `${item.quantity}x ${item.name}`)
      .join(', ');
    const nameText = orderNameInput?.value.trim() ? ` | Nome: ${orderNameInput.value.trim()}` : '';
    const addressText = orderAddressInput?.value.trim() ? ` | Endereço: ${orderAddressInput.value.trim()}` : '';
    orderSummary.textContent = `Pedido: ${itemText} — Total: ${formatPrice(total)}${nameText}${addressText}`;
  }

  function buildGmailOrderUrl(items) {
    const emailTo = 'roberto.rodrigues10@aluno.ifce.edu.br';
    const subject = 'Compra:';
    const bodyLines = [];
    if (orderNameInput?.value.trim()) {
      bodyLines.push(`Nome para entrega: ${orderNameInput.value.trim()}`);
    }
    if (orderAddressInput?.value.trim()) {
      bodyLines.push(`Endereço de entrega: ${orderAddressInput.value.trim()}`);
    }
    if (bodyLines.length) {
      bodyLines.push('');
    }
    bodyLines.push(...items.map((item) => `${item.quantity}x ${item.name} - ${formatPrice(item.price)} = ${formatPrice(item.total)}`));
    const total = items.reduce((sum, item) => sum + item.total, 0);
    bodyLines.push('');
    bodyLines.push(`Total: ${formatPrice(total)}`);
    const body = bodyLines.join('\n');
    return `https://mail.google.com/mail/?view=cm&fs=1&tf=1&to=${encodeURIComponent(emailTo)}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  }

  function openGmailUrl(url) {
    try {
      const opened = window.open(url, '_blank');
      if (!opened) {
        window.location.href = url;
      }
    } catch (error) {
      window.location.href = url;
    }
  }

  dishQuantityInputs.forEach((input) => {
    input.addEventListener('input', updateOrderSummary);
    input.addEventListener('change', updateOrderSummary);
  });

  quantityButtons.forEach((button) => {
    button.addEventListener('click', function () {
      const card = button.closest('.dish-card');
      const input = card && card.querySelector('.dish-quantity');
      if (!input) return;
      const current = parseInt(input.value, 10) || 0;
      const delta = button.classList.contains('qty-increase') ? 1 : -1;
      const nextValue = Math.max(0, current + delta);
      input.value = nextValue;
      updateOrderSummary();
    });
  });

  [orderNameInput, orderAddressInput].forEach((input) => {
    if (input) input.addEventListener('input', updateOrderSummary);
  });

  if (orderButton) {
    orderButton.addEventListener('click', function (event) {
      event.preventDefault();
      const items = getOrderItems();
      if (!items.length) {
        if (orderSummary) orderSummary.textContent = 'Por favor, selecione pelo menos um prato antes de enviar.';
        return;
      }

      if (!orderNameInput?.value.trim()) {
        if (orderSummary) orderSummary.textContent = 'Por favor, informe o nome para entrega.';
        orderNameInput?.focus();
        return;
      }

      if (!orderAddressInput?.value.trim()) {
        if (orderSummary) orderSummary.textContent = 'Por favor, informe o endereço para entrega.';
        orderAddressInput?.focus();
        return;
      }

      const gmailUrl = buildGmailOrderUrl(items);
      openGmailUrl(gmailUrl);
    });
  }

  updateOrderSummary();



// Lógica de busca e navegação  
  const searchForm = document.querySelector('form[role="search"]');
  const searchInput = searchForm ? searchForm.querySelector('.search') : null;
  const isCardapioPage = document.body.classList.contains('cardapio-page');
  const dishCards = Array.from(document.querySelectorAll('.dish-card'));
  const menuSection = document.querySelector('.menu-section');
  let noResultsMessage;

  const navSearchMap = new Map([
    ['home', 'home.html'],
    ['Home', 'home.html'],
    ['HOME', 'home.html'],
    ['início', 'home.html'],
    ['Início', 'home.html'],
    ['INÍCIO', 'home.html'],
    ['logo', 'logo.html'],
    ['Logo', 'logo.html'],
    ['LOGO', 'logo.html'],

    ['sobre', 'sobre.html'],
    ['Sobre', 'sobre.html'],
    ['SOBRE', 'sobre.html'],
    ['nós', 'sobre.html'],
    ['Nós', 'sobre.html'],
    ['NÓS', 'sobre.html'],

    ['cardápio', 'cardapio.html'],
    ['Cardápio', 'cardapio.html'],
    ['CARDÁPIO', 'cardapio.html'],
    ['cardapio', 'cardapio.html'],
    ['Cardapio', 'cardapio.html'],
    ['CARDAPIO', 'cardapio.html'],

    ['contato', 'contato.html'],
    ['Contato', 'contato.html'],
    ['CONTATO', 'contato.html'],
  ]);

const normalizedNavSearchMap = new Map();

  function normalizeSearchTerm(term) {
    return term
      .trim()
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
  }

  function buildNormalizedNavSearchMap() {
    navSearchMap.forEach((url, key) => {
      const normalizedKey = normalizeSearchTerm(key);
      if (normalizedKey) {
        normalizedNavSearchMap.set(normalizedKey, url);
      }
    });
  }

  function getNavRedirect(query) {
    const normalized = normalizeSearchTerm(query);
    if (!normalized) return null;

    if (normalizedNavSearchMap.size === 0) {
      buildNormalizedNavSearchMap();
    }

    if (normalizedNavSearchMap.has(normalized)) {
      return normalizedNavSearchMap.get(normalized);
    }

    const queryWords = normalized.split(/[^a-z0-9]+/).filter(Boolean);
    for (const [key, url] of normalizedNavSearchMap.entries()) {
      if (queryWords.includes(key)) {
        return url;
      }
    }

    for (const [key, url] of normalizedNavSearchMap.entries()) {
      if (normalized.includes(key) || key.includes(normalized)) {
        return url;
      }
    }

    return null;
  }

  function createNoResultsMessage() {
    if (!menuSection || noResultsMessage) return;
    noResultsMessage = document.createElement('div');
    noResultsMessage.className = 'no-results text-center mt-4';
    noResultsMessage.textContent = 'Nenhum resultado encontrado para sua pesquisa.';
    menuSection.appendChild(noResultsMessage);
  }

  function showNoResults(show) {
    if (!noResultsMessage) createNoResultsMessage();
    if (noResultsMessage) {
      noResultsMessage.style.display = show ? 'block' : 'none';
    }
  }

  function filterDishes(term) {
    const normalized = term.trim().toLowerCase();
    if (!dishCards.length) return;

    let found = false;
    dishCards.forEach((card) => {
      const title = card.querySelector('h3')?.textContent || '';
      const description = card.querySelector('p')?.textContent || '';
      const text = `${title} ${description}`.toLowerCase();
      const match = normalized === '' || text.includes(normalized);
      const wrapper = card.parentElement;
      if (wrapper) {
        wrapper.style.display = match ? 'flex' : 'none';
      } else {
        card.style.display = match ? 'flex' : 'none';
      }
      if (match) found = true;
    });

    showNoResults(!found && normalized !== '');
  }

  function handleSearchSubmit(event) {
    event.preventDefault();
    if (!searchInput) return;

    const query = searchInput.value.trim();
    const redirectPage = getNavRedirect(query);

    if (redirectPage) {
      window.location.href = redirectPage;
      return;
    }

    if (isCardapioPage && dishCards.length) {
      filterDishes(query);
      return;
    }

    if (!query) {
      window.location.href = 'cardapio.html';
      return;
    }

    window.location.href = `cardapio.html?search=${encodeURIComponent(query)}`;
  }

  if (searchForm && searchInput) {
    searchForm.addEventListener('submit', handleSearchSubmit);
  }

  if (isCardapioPage && searchInput) {
    const params = new URLSearchParams(window.location.search);
    const searchQuery = params.get('search') || '';
    if (searchQuery) {
      searchInput.value = searchQuery;
      filterDishes(searchQuery);
    }
  }
});



// Depois de criar o searchInput
let searchTimeout;
searchInput.addEventListener('input', function () {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => {
    filterDishes(this.value);
  }, 300);
});



// Dentro do loop dos quantityButtons
button.setAttribute('aria-label', button.classList.contains('qty-increase') ? 'Aumentar quantidade' : 'Diminuir quantidade');