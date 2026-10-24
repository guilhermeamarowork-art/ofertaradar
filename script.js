import { products } from './src/data/products.js';

const featuredProductsEl = document.querySelector('#featuredProducts');
const productGridEl = document.querySelector('#productGrid');
const categoryListEl = document.querySelector('#categoryList');
const searchInput = document.querySelector('#searchInput');
const minPriceInput = document.querySelector('#minPrice');
const maxPriceInput = document.querySelector('#maxPrice');
const sortSelect = document.querySelector('#sortSelect');
const clearFiltersBtn = document.querySelector('#clearFilters');
const resultCount = document.querySelector('#resultCount');
const productModal = document.querySelector('#productModal');
const modalContent = document.querySelector('#modalContent');
const modalCloseBtn = document.querySelector('.modal-close');

const categoryIcons = {
  'Informática e computadores': '💻',
  'Celulares e acessórios': '📱',
  'Games e videogames': '🎮',
  'Casa e cozinha': '🏠',
  'Eletrodomésticos': '🔌',
  'Ferramentas': '🛠️',
  'Moda e acessórios': '👕',
  'Esporte e lazer': '⚽'
};

const state = {
  selectedCategory: 'all',
  query: '',
  minPrice: '',
  maxPrice: '',
  sort: 'featured'
};

function formatPrice(value) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
}

function getProductDiscount(product) {
  if (!product.oldPrice || product.oldPrice <= product.price) return 0;
  return Math.round(((product.oldPrice - product.price) / product.oldPrice) * 100);
}

function normalizeText(value) {
  return String(value || '').trim().toLowerCase();
}

function hasAffiliateLink(product) {
  return Boolean(product.affiliateUrl && product.affiliateUrl.trim());
}

function createProductCard(product) {
  const card = document.createElement('article');
  card.className = 'product-card';

  const discount = getProductDiscount(product);
  const tagText = product.featured ? 'Em destaque' : 'Popular';
  const affiliateButtonClass = hasAffiliateLink(product) ? 'card-link' : 'card-link disabled';
  const affiliateLabel = hasAffiliateLink(product) ? 'Ver oferta' : 'Demonstração';

  card.innerHTML = `
    <div class="product-media">
      <span class="badge ${product.featured ? 'accent' : ''}">${tagText}</span>
      <img src="${product.image}" alt="${product.name}" loading="lazy" />
    </div>
    <div class="product-body">
      <span class="category-tag">${product.category}</span>
      <h3>${product.name}</h3>
      <p>${product.description}</p>
      <div class="price-row">
        <span class="actual-price">${formatPrice(product.price)}</span>
        ${product.oldPrice ? `<span class="old-price">${formatPrice(product.oldPrice)}</span>` : ''}
        ${discount ? `<span class="discount">-${discount}%</span>` : ''}
      </div>
      <div class="card-actions">
        <button class="card-button secondary" type="button" data-detail-id="${product.id}">Ver detalhes</button>
        <a
          class="${affiliateButtonClass}"
          href="${hasAffiliateLink(product) ? product.affiliateUrl : '#'}"
          target="${hasAffiliateLink(product) ? '_blank' : '_self'}"
          rel="noopener noreferrer"
          aria-label="${hasAffiliateLink(product) ? 'Ver oferta do produto' : 'Produto demonstrativo'}"
        >
          ${affiliateLabel}
        </a>
      </div>
    </div>
  `;

  return card;
}

function renderFeaturedProducts(items) {
  if (!featuredProductsEl) return;
  const featured = items.filter((product) => product.featured).slice(0, 4);
  featuredProductsEl.innerHTML = '';
  featured.forEach((product) => {
    featuredProductsEl.appendChild(createProductCard(product));
  });
}

function renderCategories(items) {
  if (!categoryListEl) return;
  const categories = [...new Set(items.map((product) => product.category))];

  const allButton = document.createElement('button');
  allButton.type = 'button';
  allButton.className = `category-card ${state.selectedCategory === 'all' ? 'active' : ''}`;
  allButton.dataset.category = 'all';
  allButton.innerHTML = `
    <div class="icon">📦</div>
    <h3>Todos</h3>
    <p>Ver tudo em uma lista só</p>
  `;

  categoryListEl.innerHTML = '';
  categoryListEl.appendChild(allButton);

  categories.forEach((category) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = `category-card ${state.selectedCategory === category ? 'active' : ''}`;
    button.dataset.category = category;
    button.innerHTML = `
      <div class="icon">${categoryIcons[category] || '✨'}</div>
      <h3>${category}</h3>
      <p>${items.filter((item) => item.category === category).length} itens</p>
    `;
    categoryListEl.appendChild(button);
  });

  categoryListEl.querySelectorAll('.category-card').forEach((button) => {
    button.addEventListener('click', () => {
      state.selectedCategory = button.dataset.category || 'all';
      renderAll();
    });
  });
}

function getFilteredProducts() {
  const query = normalizeText(state.query);
  const minPrice = Number(state.minPrice || 0);
  const maxPrice = Number(state.maxPrice || Number.POSITIVE_INFINITY);

  let filtered = products.filter((product) => {
    const matchesCategory = state.selectedCategory === 'all' || product.category === state.selectedCategory;
    const matchesQuery =
      !query ||
      normalizeText(product.name).includes(query) ||
      normalizeText(product.description).includes(query) ||
      normalizeText(product.category).includes(query);

    const matchesMin = Number(product.price) >= minPrice;
    const matchesMax = Number(product.price) <= maxPrice;

    return matchesCategory && matchesQuery && matchesMin && matchesMax;
  });

  switch (state.sort) {
    case 'price-asc':
      filtered = [...filtered].sort((a, b) => a.price - b.price);
      break;
    case 'price-desc':
      filtered = [...filtered].sort((a, b) => b.price - a.price);
      break;
    case 'discount':
      filtered = [...filtered].sort((a, b) => getProductDiscount(b) - getProductDiscount(a));
      break;
    default:
      filtered = [...filtered].sort((a, b) => {
        if (a.featured !== b.featured) return Number(b.featured) - Number(a.featured);
        return new Date(b.createdAt) - new Date(a.createdAt);
      });
      break;
  }

  return filtered;
}

function renderProductList(items) {
  if (!productGridEl) return;
  productGridEl.innerHTML = '';

  if (!items.length) {
    productGridEl.innerHTML = `
      <div class="empty-state">
        <strong>Nenhum produto encontrado.</strong>
        Tente ajustar a busca, a categoria ou os filtros de preço.
      </div>
    `;
    if (resultCount) resultCount.textContent = '0 produtos';
    return;
  }

  if (resultCount) {
    resultCount.textContent = `${items.length} produto${items.length > 1 ? 's' : ''}`;
  }

  items.forEach((product) => {
    productGridEl.appendChild(createProductCard(product));
  });
}

function renderAll() {
  renderCategories(products);
  renderProductList(getFilteredProducts());
}

function openModal(product) {
  if (!modalContent || !productModal) return;

  const discount = getProductDiscount(product);
  const hasLink = hasAffiliateLink(product);

  modalContent.innerHTML = `
    <div class="product-modal-content">
      <img src="${product.image}" alt="${product.name}" />
      <div class="modal-copy">
        <span class="modal-tag">${product.category}</span>
        <h3 id="modalTitle">${product.name}</h3>
        <p>${product.description}</p>

        <div class="modal-price-row">
          <span class="actual-price">${formatPrice(product.price)}</span>
          ${product.oldPrice ? `<span class="old-price">${formatPrice(product.oldPrice)}</span>` : ''}
          ${discount ? `<span class="discount">-${discount}%</span>` : ''}
        </div>

        <div class="modal-meta">
          <span>${product.featured ? 'Destaque' : 'Popular'}</span>
          <span>${hasLink ? 'Link de afiliado disponível' : 'Demonstração'}</span>
          <span>Categoria: ${product.category}</span>
        </div>

        <div class="modal-actions">
          <a href="${hasLink ? product.affiliateUrl : '#'}" class="${hasLink ? '' : 'disabled'}" target="${hasLink ? '_blank' : '_self'}" rel="noopener noreferrer">${hasLink ? 'Ver oferta' : 'Indisponível'}</a>
          <button type="button" class="modal-close-button">Fechar</button>
        </div>
      </div>
    </div>
  `;

  const modalCloseButton = modalContent.querySelector('.modal-close-button');
  if (modalCloseButton) {
    modalCloseButton.addEventListener('click', closeModal);
  }

  productModal.classList.remove('hidden');
  productModal.setAttribute('aria-hidden', 'false');
}

function closeModal() {
  if (!productModal) return;
  productModal.classList.add('hidden');
  productModal.setAttribute('aria-hidden', 'true');
}

if (searchInput) {
  searchInput.addEventListener('input', (event) => {
    state.query = event.target.value;
    renderAll();
  });
}

if (minPriceInput) {
  minPriceInput.addEventListener('input', (event) => {
    state.minPrice = event.target.value;
    renderAll();
  });
}

if (maxPriceInput) {
  maxPriceInput.addEventListener('input', (event) => {
    state.maxPrice = event.target.value;
    renderAll();
  });
}

if (sortSelect) {
  sortSelect.addEventListener('change', (event) => {
    state.sort = event.target.value;
    renderAll();
  });
}

if (clearFiltersBtn) {
  clearFiltersBtn.addEventListener('click', () => {
    state.selectedCategory = 'all';
    state.query = '';
    state.minPrice = '';
    state.maxPrice = '';
    state.sort = 'featured';

    if (searchInput) searchInput.value = '';
    if (minPriceInput) minPriceInput.value = '';
    if (maxPriceInput) maxPriceInput.value = '';
    if (sortSelect) sortSelect.value = 'featured';

    renderAll();
  });
}

if (productGridEl) {
  productGridEl.addEventListener('click', (event) => {
    const button = event.target.closest('[data-detail-id]');
    if (!button) return;

    const product = products.find((item) => item.id === button.dataset.detailId);
    if (product) {
      openModal(product);
    }
  });
}

if (productModal) {
  productModal.addEventListener('click', (event) => {
    const shouldClose = event.target.matches('[data-close="true"]') || event.target === productModal;
    if (shouldClose) closeModal();
  });
}

if (modalCloseBtn) {
  modalCloseBtn.addEventListener('click', closeModal);
}

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && productModal && !productModal.classList.contains('hidden')) {
    closeModal();
  }
});

renderFeaturedProducts(products);
renderAll();

if (searchInput) searchInput.value = '';
if (minPriceInput) minPriceInput.value = '';
if (maxPriceInput) maxPriceInput.value = '';
if (sortSelect) sortSelect.value = 'featured';
if (resultCount) resultCount.textContent = `${products.length} produtos`;
