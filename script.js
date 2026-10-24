import { products } from './src/data/products.js';

const featuredProductsEl = document.querySelector('#featuredProducts');
const productGridEl = document.querySelector('#productGrid');
const categoryListEl = document.querySelector('#categoryList');
const searchInput = document.querySelector('#searchInput');
const resultCount = document.querySelector('#resultCount');

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

function formatPrice(value) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
}

function createProductCard(product) {
  const card = document.createElement('article');
  card.className = 'product-card';

  const hasAffiliateLink = Boolean(product.affiliateUrl && product.affiliateUrl.trim());
  const tagText = product.featured ? 'Em destaque' : 'Popular';

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
        ${product.discount ? `<span class="discount">-${product.discount}%</span>` : ''}
      </div>
      <div class="card-actions">
        <a
          class="card-link ${hasAffiliateLink ? '' : 'disabled'}"
          href="${hasAffiliateLink ? product.affiliateUrl : '#'}"
          target="${hasAffiliateLink ? '_blank' : '_self'}"
          rel="noopener noreferrer"
          aria-label="${hasAffiliateLink ? 'Ver oferta do produto' : 'Produto demonstrativo'}"
        >
          ${hasAffiliateLink ? 'Ver oferta' : 'Demonstração'}
        </a>
      </div>
    </div>
  `;

  return card;
}

function renderFeaturedProducts(items) {
  const featured = items.filter((product) => product.featured).slice(0, 4);
  featuredProductsEl.innerHTML = '';
  featured.forEach((product) => {
    featuredProductsEl.appendChild(createProductCard(product));
  });
}

function renderCategories(items) {
  const categories = [...new Set(items.map((product) => product.category))];
  const allButton = document.createElement('button');
  allButton.className = 'category-card active';
  allButton.type = 'button';
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
    button.className = 'category-card';
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
      categoryListEl.querySelectorAll('.category-card').forEach((element) => {
        element.classList.toggle('active', element === button);
      });

      const selectedCategory = button.dataset.category;
      const filtered = filterProducts(selectedCategory, searchInput.value.trim());
      renderProductList(filtered);
    });
  });
}

function filterProducts(category, query) {
  const normalized = query.toLowerCase();

  return products.filter((product) => {
    const matchesCategory = category === 'all' || product.category === category;
    const matchesQuery =
      !normalized ||
      product.name.toLowerCase().includes(normalized) ||
      product.description.toLowerCase().includes(normalized) ||
      product.category.toLowerCase().includes(normalized);

    return matchesCategory && matchesQuery;
  });
}

function renderProductList(items) {
  productGridEl.innerHTML = '';

  if (!items.length) {
    productGridEl.innerHTML = `
      <div class="empty-state" style="grid-column: 1 / -1; background: #fff; border: 1px solid rgba(17,45,97,0.08); border-radius: 22px; padding: 30px; text-align: center; color: var(--muted);">
        Nenhum produto encontrado para esta busca.
      </div>
    `;
    resultCount.textContent = '0 produtos';
    return;
  }

  resultCount.textContent = `${items.length} produto${items.length > 1 ? 's' : ''}`;

  items.forEach((product) => {
    productGridEl.appendChild(createProductCard(product));
  });
}

searchInput.addEventListener('input', (event) => {
  const categoryButtons = categoryListEl.querySelectorAll('.category-card');
  let activeCategory = 'all';

  categoryButtons.forEach((button) => {
    if (button.classList.contains('active')) {
      activeCategory = button.dataset.category || 'all';
    }
  });

  const filtered = filterProducts(activeCategory, event.target.value);
  renderProductList(filtered);
});

renderFeaturedProducts(products);
renderCategories(products);
renderProductList(products);
