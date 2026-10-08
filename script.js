const menuButton = document.querySelector('.menu-toggle');
const navigation = document.querySelector('.main-nav');

menuButton?.addEventListener('click', () => {
  const isOpen = menuButton.getAttribute('aria-expanded') === 'true';
  menuButton.setAttribute('aria-expanded', String(!isOpen));
  menuButton.setAttribute('aria-label', isOpen ? 'Abrir menu' : 'Fechar menu');
  navigation?.classList.toggle('is-open', !isOpen);
});
navigation?.querySelectorAll('a').forEach((link) => link.addEventListener('click', () => {
  menuButton?.setAttribute('aria-expanded', 'false');
  menuButton?.setAttribute('aria-label', 'Abrir menu');
  navigation?.classList.remove('is-open');
}));

document.querySelector('#year')?.replaceChildren(String(new Date().getFullYear()));
const productGrid = document.querySelector('#product-grid');
const shopTabs = [...document.querySelectorAll('.shop-tab')];
const shopEmpty = document.querySelector('.shop-empty');
const productSearch = document.querySelector('#product-search');
const productCount = document.querySelector('#product-count');
const cart = new Map();
const cartPanel = document.querySelector('.shop-cart');
const cartCount = document.querySelector('.cart-count');
const cartTotal = document.querySelector('.cart-total');
const cartLink = document.querySelector('.cart-whatsapp');
const money = (cents) => new Intl.NumberFormat('pt-BR', {style:'currency',currency:'BRL'}).format(cents / 100);
const categoryNames = {"revestimentos":"Pisos & revestimentos","construcao":"Construção","tintas":"Tintas","banheiro":"Banheiros","cozinha":"Cozinha & lavanderia","eletro":"Eletro","climatizacao":"Climatização","ferramentas":"Ferramentas"};
let activeCategory = 'todos';
let productCards = [];

const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
let revealObserver = null;
if (!prefersReducedMotion && 'IntersectionObserver' in window) {
  revealObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      }
    });
  }, {threshold:0.12,rootMargin:'0px 0px -4% 0px'});
}
document.querySelectorAll('.reveal').forEach((item) => {
  if (revealObserver) revealObserver.observe(item);
  else item.classList.add('is-visible');
});

function makeElement(tag, className, text) {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (text !== undefined) element.textContent = text;
  return element;
}
function getCassolCode(image) {
  const match = image.match(/(?:^|_)(\d{5,})_\d+(?:_\d+)?\.jpg/i) || image.match(/\/(\d{5,})_1\.jpg/i);
  return match ? match[1] : '';
}
function renderProduct(item) {
  const card = makeElement('article', 'product-card reveal');
  card.dataset.category = item.category;
  const photo = makeElement('div', 'product-image');
  const imageLink = makeElement('a', 'product-image-link');
  imageLink.href = item.url;
  imageLink.target = '_blank';
  imageLink.rel = 'noopener noreferrer';
  imageLink.setAttribute('aria-label', 'Ver ' + item.name + ' na Cassol (abre em nova aba)');
  const image = document.createElement('img');
  image.src = item.image;
  image.alt = item.name;
  image.loading = 'lazy';
  image.decoding = 'async';
  imageLink.append(image);
  photo.append(imageLink);
  photo.append(makeElement('span', 'product-category', categoryNames[item.category] || 'MATERIAL'));
  const visit = makeElement('a', 'product-visit', 'Ver na Cassol ↗');
  visit.href = item.url;
  visit.target = '_blank';
  visit.rel = 'noopener noreferrer';
  photo.append(visit);
  const add = makeElement('button', 'product-add', 'Adicionar à lista ');
  add.type = 'button';
  add.setAttribute('aria-pressed', 'false');
  add.dataset.product = item.name;
  add.dataset.price = String(item.price / 100);
  add.append(makeElement('span', '', '+'));
  photo.append(add);
  card.append(photo);
  const info = makeElement('div', 'product-info');
  info.append(makeElement('p', 'product-brand', 'CASSOL / ' + (categoryNames[item.category] || 'MATERIAL')));
  const title = makeElement('h3', '', item.name);
  info.append(title);
  const price = makeElement('div', 'product-price');
  price.append(makeElement('strong', '', money(item.price)));
  info.append(price);
  const code = getCassolCode(item.image);
  if (code) info.append(makeElement('p', 'product-code', 'Cód. Cassol ' + code));
  card.append(info);
  return card;
}
function filterProducts() {
  const query = (productSearch?.value || '').trim().toLocaleLowerCase('pt-BR');
  let visible = 0;
  productCards.forEach((card) => {
    const categoryMatch = activeCategory === 'todos' || card.dataset.category === activeCategory;
    const searchMatch = !query || card.textContent.toLocaleLowerCase('pt-BR').includes(query);
    card.hidden = !(categoryMatch && searchMatch);
    if (!card.hidden) visible += 1;
  });
  shopTabs.forEach((tab) => {
    const active = tab.dataset.productFilter === activeCategory;
    tab.classList.toggle('is-active', active);
    tab.setAttribute('aria-selected', String(active));
  });
  if (shopEmpty) shopEmpty.hidden = visible !== 0;
  if (productCount) productCount.textContent = visible + (visible === 1 ? ' produto' : ' produtos');
}
shopTabs.forEach((tab) => tab.addEventListener('click', () => {
  activeCategory = tab.dataset.productFilter;
  filterProducts();
}));
productSearch?.addEventListener('input', filterProducts);
document.querySelectorAll('.collection-card[data-product-filter]').forEach((card) => {
  card.addEventListener('click', () => {
    const target = card.dataset.productFilter;
    if (target && shopTabs.some((tab) => tab.dataset.productFilter === target)) {
      activeCategory = target;
      filterProducts();
    }
  });
});

function updateCart() {
  const items = [...cart.values()];
  const total = items.reduce((sum, item) => sum + item.price, 0);
  if (cartPanel) cartPanel.hidden = items.length === 0;
  if (cartCount) cartCount.textContent = items.length + (items.length === 1 ? ' produto na lista' : ' produtos na lista');
  if (cartTotal) cartTotal.textContent = 'Subtotal estimado: ' + money(Math.round(total * 100));
  document.querySelectorAll('.product-add').forEach((button) => {
    const selected = cart.has(button.dataset.product);
    button.setAttribute('aria-pressed', String(selected));
    button.firstChild.textContent = selected ? 'Remover da lista ' : 'Adicionar à lista ';
    button.lastElementChild.textContent = selected ? '−' : '+';
  });
  if (cartLink) {
    const lines = items.map((item) => '• ' + item.name + ': ' + money(Math.round(item.price * 100)));
    const message = 'Olá, Reforme! Quero consultar estes produtos:\n' + lines.join('\n') + '\nSubtotal estimado: ' + money(Math.round(total * 100));
    cartLink.href = 'https://api.whatsapp.com/send?text=' + encodeURIComponent(message);
  }
}
document.addEventListener('click', (event) => {
  const button = event.target.closest('.product-add');
  if (!button) return;
  const name = button.dataset.product;
  if (cart.has(name)) cart.delete(name);
  else cart.set(name, {name,price:Number(button.dataset.price)});
  updateCart();
});

fetch('/products.json')
  .then((response) => {
    if (!response.ok) throw new Error('Não foi possível carregar a lista de produtos.');
    return response.json();
  })
  .then((items) => {
    if (!Array.isArray(items) || items.length !== 210) throw new Error('O catálogo precisa conter 210 produtos.');
    productGrid.replaceChildren(...items.map(renderProduct));
    productCards = [...productGrid.querySelectorAll('.product-card')];
    productCards.forEach((item) => {
      if (revealObserver) revealObserver.observe(item);
      else item.classList.add('is-visible');
    });
    filterProducts();
    updateCart();
  })
  .catch(() => {
    if (productCount) productCount.textContent = 'Catálogo indisponível';
    if (shopEmpty) {
      shopEmpty.hidden = false;
      shopEmpty.textContent = 'Não foi possível carregar os produtos agora. Atualize a página para tentar novamente.';
    }
  });
