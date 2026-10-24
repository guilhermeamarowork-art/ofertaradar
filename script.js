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
const productDetailRoot = document.querySelector('#productDetail');
const productNotFound = document.querySelector('#productNotFound');

const categoryIcons = {
  'Informática e computadores': '🖥️',
  'Celulares e acessórios': '📱',
  'Games e videogames': '🎮',
  'Casa e cozinha': '🏠',
  'Eletrodomésticos': '🔌',
  'Ferramentas': '🧰',
  'Moda e acessórios': '🧥',
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
  if (value === null || value === undefined || Number.isNaN(Number(value))) {
    return 'Preço sob consulta';
  }

  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(Number(value));
}

function getProductDiscount(product) {
  if (!product || !product.oldPrice || product.oldPrice <= (product.price ?? 0)) {
    return 0;
  }

  return Math.round(((product.oldPrice - product.price) / product.oldPrice) * 100);
}

function normalizeText(value) {
  return String(value || '').trim().toLowerCase();
}

function hasAffiliateLink(product) {
  return Boolean(product && product.affiliateUrl && product.affiliateUrl.trim());
}

function getProductById(id) {
  return products.find((product) => product.id === id) || null;
}

function buildSpecs(product) {
  if (Array.isArray(product?.specs) && product.specs.length > 0) {
    return product.specs;
  }

  return [
    { label: 'Marca', value: product?.brand || 'Marca não informada' },
    { label: 'Categoria', value: product?.category || 'Categoria não informada' },
    { label: 'Especificações técnicas', value: 'Sem especificações técnicas verificadas informadas no momento.' }
  ];
}

function getRelatedProducts(product) {
  if (!product) return [];

  const relatedIds = Array.isArray(product.relatedIds) ? product.relatedIds : [];

  if (relatedIds.length > 0) {
    return relatedIds
      .map((id) => getProductById(id))
      .filter(Boolean)
      .slice(0, 3);
  }

  return products
    .filter((item) => item.id !== product.id && item.category === product.category)
    .slice(0, 3);
}

function createProductCard(product) {
  const card = document.createElement('article');
  card.className = 'product-card';

  const discount = getProductDiscount(product);
  const tagText = product.featured ? 'Em destaque' : 'Popular';
  const affiliateButtonClass = hasAffiliateLink(product) ? 'card-link' : 'card-link disabled';
  const affiliateLabel = hasAffiliateLink(product) ? 'Ver oferta' : 'Indisponível';

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
          aria-label="${hasAffiliateLink(product) ? 'Ver oferta do produto' : 'Produto sem link de oferta disponível'}"
        >
          ${affiliateLabel}
        </a>
      </div>
      <div class="card-cta-row">
        <a href="./product.html?id=${encodeURIComponent(product.id)}" class="text-link">Abrir página completa</a>
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
          <span>${product.brand || 'Marca não informada'}</span>
          <span>Categoria: ${product.category}</span>
        </div>

        <div class="modal-actions">
          <a href="./product.html?id=${encodeURIComponent(product.id)}" class="detail-link">Página completa</a>
          <a href="${hasLink ? product.affiliateUrl : '#'}" class="${hasLink ? '' : 'disabled'}" target="${hasLink ? '_blank' : '_self'}" rel="noopener noreferrer">${hasLink ? 'Ver oferta' : 'Indisponível'}</a>
        </div>
      </div>
    </div>
  `;

  productModal.classList.remove('hidden');
  productModal.setAttribute('aria-hidden', 'false');
}

function closeModal() {
  if (!productModal) return;

  productModal.classList.add('hidden');
  productModal.setAttribute('aria-hidden', 'true');
}

function renderProductDetailPage() {
  if (!productDetailRoot) return;

  const urlParams = new URLSearchParams(window.location.search);
  const productId = urlParams.get('id');
  const product = getProductById(productId);

  if (!product) {
    productDetailRoot.innerHTML = `
      <div class="product-not-found">
        <div class="not-found-card">
          <p class="eyebrow eyebrow-light">Produto não encontrado</p>
          <h1>Não encontramos este item</h1>
          <p>O produto solicitado não está disponível no catálogo ou foi removido.</p>
          <div class="detail-actions">
            <a href="./index.html" class="btn btn-primary">Voltar ao catálogo</a>
          </div>
        </div>
      </div>
    `;

    if (productNotFound) productNotFound.hidden = false;
    return;
  }

  const discount = getProductDiscount(product);
  const relatedProducts = getRelatedProducts(product);
  const specs = buildSpecs(product);

  productDetailRoot.innerHTML = `
    <article class="product-detail-page">
      <div class="detail-top">
        <div class="detail-visual">
          <img src="${product.image}" alt="${product.name}" />
        </div>

        <div class="detail-info">
          <span class="detail-badge">${product.category}</span>
          <h1>${product.name}</h1>
          <p class="detail-brand">Marca: ${product.brand || 'Marca não informada'}</p>
          <p class="detail-description">${product.description}</p>

          <div class="detail-price-box">
            <div class="detail-price-line">
              <span class="detail-price">${formatPrice(product.price)}</span>
              ${product.oldPrice ? `<span class="detail-old-price">${formatPrice(product.oldPrice)}</span>` : ''}
              ${discount ? `<span class="detail-discount">-${discount}%</span>` : ''}
            </div>
            <small>Preço e disponibilidade podem sofrer alterações sem aviso prévio.</small>
          </div>

          <div class="detail-actions">
            <a
              class="btn btn-primary ${hasAffiliateLink(product) ? '' : 'disabled'}"
              href="${hasAffiliateLink(product) ? product.affiliateUrl : '#'}"
              target="${hasAffiliateLink(product) ? '_blank' : '_self'}"
              rel="noopener noreferrer"
            >
              ${hasAffiliateLink(product) ? 'Ver oferta no Mercado Livre' : 'Link indisponível'}
            </a>
            <a href="./index.html" class="btn btn-secondary">Voltar ao catálogo</a>
          </div>

          <div class="detail-notice">
            <strong>Aviso:</strong> os preços, disponibilidade e condições do produto podem mudar ao longo do tempo e variam conforme o anunciante.
          </div>
        </div>
      </div>

      <section class="detail-section">
        <div class="section-heading catalog-heading">
          <div>
            <span class="eyebrow eyebrow-light">Detalhes do produto</span>
            <h2>Informações e especificações</h2>
          </div>
        </div>

        <div class="spec-grid">
          ${specs
            .map(
              (spec) => `
                <div class="spec-item">
                  <span>${spec.label}</span>
                  <strong>${spec.value}</strong>
                </div>
              `
            )
            .join('')}
        </div>
      </section>

      ${relatedProducts.length > 0 ? `
        <section class="detail-section">
          <div class="section-heading catalog-heading">
            <div>
              <span class="eyebrow eyebrow-light">Relacionados</span>
              <h2>Produtos relacionados</h2>
            </div>
          </div>

          <div class="product-grid product-grid-compact">
            ${relatedProducts
              .map(
                (relatedProduct) => `
                  <article class="product-card compact-card">
                    <div class="product-media">
                      <img src="${relatedProduct.image}" alt="${relatedProduct.name}" loading="lazy" />
                    </div>
                    <div class="product-body">
                      <span class="category-tag">${relatedProduct.category}</span>
                      <h3>${relatedProduct.name}</h3>
                      <div class="price-row">
                        <span class="actual-price">${formatPrice(relatedProduct.price)}</span>
                        ${relatedProduct.oldPrice ? `<span class="old-price">${formatPrice(relatedProduct.oldPrice)}</span>` : ''}
                      </div>
                      <div class="card-actions">
                        <a href="./product.html?id=${encodeURIComponent(relatedProduct.id)}" class="card-link">Ver produto</a>
                      </div>
                    </div>
                  </article>
                `
              )
              .join('')}
          </div>
        </section>
      ` : ''}
    </article>
  `;
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
    const backdropClick = event.target === productModal;
    const closeButton = event.target.closest('.modal-close');
    if (backdropClick || closeButton) {
      closeModal();
    }
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

if (document.body.dataset.page === 'product') {
  renderProductDetailPage();
} else {
  renderFeaturedProducts(products);
  renderAll();

  if (searchInput) searchInput.value = '';
  if (minPriceInput) minPriceInput.value = '';
  if (maxPriceInput) maxPriceInput.value = '';
  if (sortSelect) sortSelect.value = 'featured';
  if (resultCount) resultCount.textContent = `${products.length} produtos`;
}
