const menuButton = document.querySelector('.menu-toggle');
const navigation = document.querySelector('.main-nav');

menuButton?.addEventListener('click', () => {
  const isOpen = menuButton.getAttribute('aria-expanded') === 'true';
  menuButton.setAttribute('aria-expanded', String(!isOpen));
  menuButton.setAttribute('aria-label', isOpen ? 'Abrir menu' : 'Fechar menu');
  navigation?.classList.toggle('is-open', !isOpen);
});

navigation?.querySelectorAll('a').forEach((link) => {
  link.addEventListener('click', () => {
    menuButton?.setAttribute('aria-expanded', 'false');
    menuButton?.setAttribute('aria-label', 'Abrir menu');
    navigation.classList.remove('is-open');
  });
});

const revealItems = document.querySelectorAll('.reveal');
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

if (reduceMotion || !('IntersectionObserver' in window)) {
  revealItems.forEach((item) => item.classList.add('is-visible'));
} else {
  const revealObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.13, rootMargin: '0px 0px -5% 0px' });

  revealItems.forEach((item) => revealObserver.observe(item));
}

document.querySelector('#year').textContent = new Date().getFullYear();

const productCards = [...document.querySelectorAll('.product-card')];
const shopTabs = [...document.querySelectorAll('.shop-tab')];
const shopEmpty = document.querySelector('.shop-empty');

function filterProducts(category) {
  const visibleCards = productCards.filter((card) => {
    const matches = category === 'todos' || card.dataset.category === category;
    card.hidden = !matches;
    return matches;
  });

  shopTabs.forEach((tab) => {
    const active = tab.dataset.productFilter === category;
    tab.classList.toggle('is-active', active);
    tab.setAttribute('aria-selected', String(active));
  });

  if (shopEmpty) shopEmpty.hidden = visibleCards.length > 0;
}

shopTabs.forEach((tab) => {
  tab.addEventListener('click', () => filterProducts(tab.dataset.productFilter));
});

document.querySelectorAll('.collection-card[data-product-filter]').forEach((card) => {
  card.addEventListener('click', () => filterProducts(card.dataset.productFilter));
});

const cart = new Map();
const cartPanel = document.querySelector('.shop-cart');
const cartCount = document.querySelector('.cart-count');
const cartTotal = document.querySelector('.cart-total');
const cartLink = document.querySelector('.cart-whatsapp');
const formatPrice = (value) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

function updateCart() {
  const items = [...cart.values()];
  const total = items.reduce((sum, item) => sum + item.price, 0);
  if (cartPanel) cartPanel.hidden = items.length === 0;
  if (cartCount) cartCount.textContent = `${items.length} ${items.length === 1 ? 'produto' : 'produtos'} na lista`;
  if (cartTotal) cartTotal.textContent = `Subtotal: ${formatPrice(total)}`;

  document.querySelectorAll('.product-add').forEach((button) => {
    const product = button.dataset.product;
    const selected = cart.has(product);
    button.setAttribute('aria-pressed', String(selected));
    button.firstChild.textContent = selected ? 'Remover da lista ' : 'Adicionar à lista ';
    button.lastElementChild.textContent = selected ? '−' : '+';
  });

  if (cartLink) {
    const lines = items.map(({ name, price }) => `• ${name}: ${formatPrice(price)}`);
    const message = `Olá, Reforme! Quero consultar estes produtos:\n${lines.join('\n')}\nSubtotal: ${formatPrice(total)}`;
    cartLink.href = `https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`;
  }
}

document.querySelectorAll('.product-add').forEach((button) => {
  button.addEventListener('click', () => {
    const name = button.dataset.product;
    if (cart.has(name)) {
      cart.delete(name);
    } else {
      cart.set(name, { name, price: Number(button.dataset.price) });
    }
    updateCart();
  });
});
