const state = {
  products: [],
  filtered: [],
  heroItems: [],
  heroIndex: 0,
  category: "Todas",
  marketplace: "Todos",
  query: "",
  sort: "random",
  heroTimer: null
};

const $ = selector => document.querySelector(selector);
const $$ = selector => [...document.querySelectorAll(selector)];

const els = {
  grid: $("#productsGrid"),
  categoryChips: $("#categoryChips"),
  resultCount: $("#resultCount"),
  emptyState: $("#emptyState"),
  
  heroImage: $("#heroImage"),
  heroTitle: $("#heroTitle"),
  heroDiscount: $("#heroDiscount"),
  heroOldPrice: $("#heroOldPrice"),
  heroPrice: $("#heroPrice"),
  heroButton: $("#heroButton"),
  heroDots: $("#heroDots"),
  heroRank: $("#heroRank"), 

  sortSelect: $("#sortSelect"),
  marketplaceSelect: $("#marketplaceSelect"),

  searchForm: $("#searchForm"),
  searchInput: $("#searchInput"),

  mobileSearchForm: $("#mobileSearchForm"),
  mobileSearchInput: $("#mobileSearchInput"),

  mainNav: $("#mainNav"),
  menuButton: $("#menuButton")
};

/* =========================================================
   UTILITÁRIOS
========================================================= */

function formatBRL(value) {
  const number = Number(value);
  if (value === null || value === undefined || Number.isNaN(number)) {
    return "";
  }
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL"
  }).format(number);
}

function safeText(value) {
  return String(value ?? "");
}

function escapeHTML(value) {
  return safeText(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function escapeAttribute(value) {
  return escapeHTML(value);
}

/* =========================================================
   PRODUTO VÁLIDO
========================================================= */

function isValidProduct(product) {
  const empty = product?.is_empty_card;
  return !(empty === true || empty === "true" || empty === 1 || empty === "1");
}

/* =========================================================
   LEITURA DO JSON
========================================================= */

function loadProducts() {
  const timestamp = new Date().getTime();
  return fetch(`data/produtos.json?v=${timestamp}`, { cache: "no-store" })
    .then(response => {
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      return response.json();
    });
}

/* =========================================================
   MARKETPLACES
========================================================= */

function normalizeMarketplace(marketplace) {
  return safeText(marketplace).trim();
}

function getMarketplaceCanonicalName(marketplace) {
  const original = normalizeMarketplace(marketplace);
  const name = original.toLowerCase();

  if (name.includes("mercado livre")) return "Mercado Livre";
  if (name.includes("amazon")) return "Amazon";
  if (name.includes("magalu") || name.includes("magazine luiza")) return "Magalu";
  return original || "Outro";
}

function getMarketplaceLogo(marketplace) {
  const canonical = getMarketplaceCanonicalName(marketplace);
  if (canonical === "Mercado Livre") return "assets/images/logos/logo_mercadolivre.png";
  if (canonical === "Amazon") return "assets/images/logos/logo_amazon.png";
  if (canonical === "Magalu") return "assets/images/logos/logo_magalu.png";
  return "";
}

function getMarketplaceButtonText(marketplace) {
  const canonical = getMarketplaceCanonicalName(marketplace);
  if (canonical === "Amazon") return "Ver na Amazon";
  if (canonical === "Mercado Livre") return "Ver no Mercado Livre";
  if (canonical === "Magalu") return "Ver no Magalu";
  return "Ver no marketplace";
}

function buildMarketplaceFilter() {
  const marketplaces = [
    "Todos",
    ...new Set(
      state.products
        .filter(isValidProduct)
        .map(product => getMarketplaceCanonicalName(product.marketplace))
        .filter(Boolean)
    )
  ];

  els.marketplaceSelect.innerHTML = "";

  marketplaces.forEach(marketplace => {
    const option = document.createElement("option");
    option.value = marketplace;
    option.textContent = marketplace === "Todos" ? "Todos os marketplaces" : marketplace;
    els.marketplaceSelect.appendChild(option);
  });

  if (!marketplaces.includes(state.marketplace)) {
    state.marketplace = "Todos";
  }
  els.marketplaceSelect.value = state.marketplace;
}

/* =========================================================
   ÍCONES DE CATEGORIAS
========================================================= */

function getCategoryIcon(category) {
  const name = safeText(category).normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  
  const icons = {
    phone: `<svg viewBox="0 0 24 24"><rect x="7" y="2.5" width="10" height="19" rx="2.2"></rect><path d="M10 5h4"></path><path d="M11 18.5h2"></path></svg>`,
    computer: `<svg viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="12" rx="1.8"></rect><path d="M8 20h8"></path><path d="M10 16v4"></path><path d="M14 16v4"></path></svg>`,
    home: `<svg viewBox="0 0 24 24"><path d="M3 11.5 12 4l9 7.5"></path><path d="M5.5 10.5V20h13v-9.5"></path><path d="M9 20v-6h6v6"></path></svg>`,
    beauty: `<svg viewBox="0 0 24 24"><path d="M9 7h6"></path><path d="M10 3h4v4h-4z"></path><rect x="7" y="7" width="10" height="14" rx="2"></rect></svg>`,
    appliance: `<svg viewBox="0 0 24 24"><rect x="6" y="3" width="12" height="18" rx="2"></rect><circle cx="12" cy="12" r="4"></circle><path d="M9 6h.01M12 6h.01"></path></svg>`,
    audio: `<svg viewBox="0 0 24 24"><path d="M4 13v-2a8 8 0 0 1 16 0v2"></path><path d="M4 13v5h4v-7H6"></path><path d="M20 13v5h-4v-7h2"></path></svg>`,
    sport: `<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="8"></circle><path d="m8.5 5.7 2.2 2.8-1 3.1-3.5.5"></path><path d="m15.5 18.3-2.2-2.8 1-3.1 3.5-.5"></path></svg>`,
    game: `<svg viewBox="0 0 24 24"><path d="M7.5 8h9a4.5 4.5 0 0 1 4.2 6.2l-1.3 3.1a2 2 0 0 1-3 .8L14.5 16h-5l-1.9 2.1a2 2 0 0 1-3-.8l-1.3-3.1A4.5 4.5 0 0 1 7.5 8Z"></path><path d="M7 11v4M5 13h4"></path><circle cx="16.5" cy="11.8" r=".7"></circle><circle cx="18.5" cy="14" r=".7"></circle></svg>`,
    tool: `<svg viewBox="0 0 24 24"><path d="m14 5 5-2-2 5-3 1-5 5"></path><path d="m8 13-5 5 3 3 5-5"></path></svg>`,
    pet: `<svg viewBox="0 0 24 24"><circle cx="7" cy="7" r="2"></circle><circle cx="17" cy="7" r="2"></circle><circle cx="5" cy="12" r="2"></circle><circle cx="19" cy="12" r="2"></circle><path d="M8.5 19c1.3 1 5.7 1 7 0 1.5-1.2 1.4-4-.2-5.2-1.8-1.4-4.8-1.4-6.6 0C7.1 15 7 17.8 8.5 19Z"></path></svg>`,
    grid: `<svg viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7" rx="1"></rect><rect x="14" y="3" width="7" height="7" rx="1"></rect><rect x="3" y="14" width="7" height="7" rx="1"></rect><rect x="14" y="14" width="7" height="7" rx="1"></rect></svg>`
  };

  if (name.includes("celular") || name.includes("telefone") || name.includes("comunicacao")) return icons.phone;
  if (name.includes("computador") || name.includes("informatica") || name === "pc" || name.includes("notebook")) return icons.computer;
  if (name.includes("casa") || name.includes("decoracao") || name.includes("moveis")) return icons.home;
  if (name.includes("beleza") || name.includes("saude") || name.includes("cuidado") || name.includes("perfume")) return icons.beauty;
  if (name.includes("eletrodomest") || name.includes("cozinha")) return icons.appliance;
  if (name.includes("audio") || name.includes("fone")) return icons.audio;
  if (name.includes("esporte")) return icons.sport;
  if (name.includes("game") || name.includes("brinquedo") || name.includes("jogo")) return icons.game;
  if (name.includes("ferramenta") || name.includes("construcao") || name.includes("automot")) return icons.tool;
  if (name.includes("pet")) return icons.pet;

  return icons.grid;
}

function buildCategories() {
  const categories = [
    "Todas",
    ...new Set(state.products.filter(isValidProduct).map(product => product.category).filter(Boolean))
  ];

  els.categoryChips.innerHTML = "";

  categories.forEach(category => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "category-item" + (category === state.category ? " active" : "");
    button.innerHTML = `
      <span class="category-icon">${getCategoryIcon(category)}</span>
      <span class="category-name">${escapeHTML(category)}</span>
    `;
    button.addEventListener("click", () => {
      state.category = category;
      buildCategories();
      applyFilters();
      document.querySelector("#ofertas").scrollIntoView({ behavior: "smooth", block: "start" });
    });
    els.categoryChips.appendChild(button);
  });
}

function cleanTitle(title, maxLength = 74) {
  let clean = safeText(title).replace(/\s+/g, " ").trim();
  const separators = [" | ", " - ", " – ", " — "];
  for (const separator of separators) {
    if (clean.includes(separator)) {
      clean = clean.split(separator)[0].trim();
      break;
    }
  }
  if (clean.length > maxLength) {
    clean = clean.substring(0, maxLength - 3).trim() + "...";
  }
  return clean;
}

/* =========================================================
   CARDS & BANNERS
========================================================= */

function productCard(product) {
  const article = document.createElement("article");
  article.className = "product-card";
  const discount = Number(product.discount || 0);
  const oldPrice = Number(product.old_price || 0);
  const price = Number(product.price || 0);
  const isSuperDeal = discount > 60;

  if (isSuperDeal) { article.classList.add("super-deal"); }
  const marketplaceLogo = getMarketplaceLogo(product.marketplace);
  const marketplaceName = getMarketplaceCanonicalName(product.marketplace);
  const buttonText = getMarketplaceButtonText(product.marketplace);

  article.innerHTML = `
    ${isSuperDeal ? `<span class="super-deal-label">OFERTA IMPERDÍVEL</span>` : ""}
    <div class="card-marketplace-corner">
      ${marketplaceLogo ? `<img class="marketplace-logo" src="${escapeAttribute(marketplaceLogo)}" alt="${escapeAttribute(marketplaceName)}" loading="lazy">` : `<span class="marketplace-name">${escapeHTML(marketplaceName)}</span>`}
    </div>
    <div class="card-media">
      ${discount > 0 ? `<span class="discount-badge">-${discount}%</span>` : ""}
      <div class="product-image-wrap">
        <img class="product-image" src="${escapeAttribute(product.image_url)}" alt="${escapeAttribute(product.title)}" loading="lazy">
      </div>
    </div>
    <div class="card-content">
      <span class="product-category">${escapeHTML(product.category)}</span>
      <h3 class="product-title">${escapeHTML(product.title)}</h3>
      <div class="product-price-area">
        ${oldPrice > price ? `<span class="old-price">De <s>${formatBRL(oldPrice)}</s></span>` : `<span class="old-price">&nbsp;</span>`}
        <strong class="current-price">${formatBRL(price)}</strong>
        <a class="market-button" href="${escapeAttribute(product.affiliate_url)}" target="_blank" rel="noopener sponsored">
          ${escapeHTML(buttonText)}
          <span>↗</span>
        </a>
      </div>
    </div>
  `;
  return article;
}

function midPromoBanner(product) {
  const article = document.createElement("article");
  article.className = "mid-promo-banner";
  const discount = Number(product.discount || 0);
  const oldPrice = Number(product.old_price || 0);
  const price = Number(product.price || 0);
  const marketplaceLogo = getMarketplaceLogo(product.marketplace);
  const marketplaceName = getMarketplaceCanonicalName(product.marketplace);
  const buttonText = getMarketplaceButtonText(product.marketplace);

  article.innerHTML = `
    <div class="mid-promo-copy">
      <span class="mid-promo-kicker">⚡ DESTAQUE VASY</span>
      <h3>${escapeHTML(cleanTitle(product.title, 62))}</h3>
      ${discount > 0 ? `<strong class="mid-promo-discount">-${discount}%</strong>` : ""}
      ${oldPrice > price ? `<span class="mid-promo-old">De <s>${formatBRL(oldPrice)}</s> por</span>` : ""}
      <strong class="mid-promo-price">${formatBRL(price)}</strong>
      <a class="mid-promo-button" href="${escapeAttribute(product.affiliate_url)}" target="_blank" rel="noopener sponsored">
        ${escapeHTML(buttonText)} <span>↗</span>
      </a>
    </div>
    <div class="mid-promo-image">
      ${marketplaceLogo ? `<img class="mid-promo-marketplace" src="${escapeAttribute(marketplaceLogo)}" alt="${escapeAttribute(marketplaceName)}">` : ""}
      <img class="mid-promo-product" src="${escapeAttribute(product.image_url)}" alt="${escapeAttribute(product.title)}" loading="lazy">
    </div>
  `;
  return article;
}

/* =========================================================
   FILTROS E ORDENAÇÃO
========================================================= */

function applyFilters() {
  const query = state.query.trim().toLocaleLowerCase("pt-BR");
  let list = state.products.filter(isValidProduct);

  if (state.category !== "Todas") {
    list = list.filter(product => product.category === state.category);
  }

  if (state.marketplace !== "Todos") {
    list = list.filter(product => getMarketplaceCanonicalName(product.marketplace) === state.marketplace);
  }

  if (query) {
    list = list.filter(product => {
      const haystack = [product.title, product.category, product.marketplace, getMarketplaceCanonicalName(product.marketplace)].join(" ").toLocaleLowerCase("pt-BR");
      return haystack.includes(query);
    });
  }

  list.sort((a, b) => {
    if (state.sort === "discount") return Number(b.discount || 0) - Number(a.discount || 0);
    if (state.sort === "price-asc") return Number(a.price || 0) - Number(b.price || 0);
    if (state.sort === "price-desc") return Number(b.price || 0) - Number(a.price || 0);
    return Number(a._randomOrder || 0) - Number(b._randomOrder || 0);
  });

  state.filtered = list;
  syncFilterUI();
  renderGrid();
}

function syncFilterUI() {
  els.sortSelect.value = state.sort;
  els.marketplaceSelect.value = state.marketplace;
  $$(".quick-filter").forEach(button => {
    button.classList.toggle("active", button.dataset.sort === state.sort);
  });
}

function renderGrid() {
  els.grid.innerHTML = "";
  const products = state.filtered;

  if (products.length === 0) {
    els.resultCount.textContent = "0 ofertas encontradas";
    els.emptyState.hidden = false;
    return;
  }

  els.emptyState.hidden = true;
  const bannerIndex = products.length > 8 ? 8 : -1;

  products.forEach((product, index) => {
    if (index === bannerIndex) {
      els.grid.appendChild(midPromoBanner(product));
      return;
    }
    els.grid.appendChild(productCard(product));
  });

  const total = products.length;
  els.resultCount.textContent = `${total} ${total === 1 ? "oferta encontrada" : "ofertas encontradas"}`;
}

/* =========================================================
   HERO BANNER DINÂMICO
========================================================= */

function setHero(index, resetTimer = false) {
  if (!state.heroItems.length) return;

  state.heroIndex = (index + state.heroItems.length) % state.heroItems.length;
  const product = state.heroItems[state.heroIndex];

  els.heroImage.style.animation = "none";
  requestAnimationFrame(() => {
    els.heroImage.style.animation = "";
    els.heroImage.src = product.image_url;
    els.heroImage.alt = product.title;
  });

  // Atualiza o Ranking no canto da tela (Selo com Posição 1, 2, 3...)
  if (els.heroRank) {
    els.heroRank.textContent = state.heroIndex + 1;
  }

  els.heroTitle.textContent = cleanTitle(product.title, 70);
  els.heroDiscount.textContent = `-${Number(product.discount || 0)}%`;

  const oldPrice = Number(product.old_price || 0);
  const price = Number(product.price || 0);

  if (oldPrice > price) {
    els.heroOldPrice.textContent = `DE ${formatBRL(oldPrice)} POR`;
  } else {
    els.heroOldPrice.textContent = "";
  }

  els.heroPrice.textContent = formatBRL(price);
  els.heroButton.href = product.affiliate_url;

  [...els.heroDots.children].forEach((dot, dotIndex) => {
    dot.classList.toggle("active", dotIndex === state.heroIndex);
  });

  if (resetTimer) {
    restartHeroTimer();
  }
}

function buildHero() {
  state.heroItems = state.products
    .filter(product => isValidProduct(product) && Number(product.discount || 0) > 0)
    .sort((a, b) => Number(b.discount || 0) - Number(a.discount || 0))
    .slice(0, 5);

  els.heroDots.innerHTML = "";

  state.heroItems.forEach((_, index) => {
    const dot = document.createElement("button");
    dot.type = "button";
    dot.setAttribute("aria-label", `Ir para oferta ${index + 1}`);
    dot.addEventListener("click", () => setHero(index, true));
    els.heroDots.appendChild(dot);
  });

  setHero(0);
  restartHeroTimer();
}

function restartHeroTimer() {
  clearInterval(state.heroTimer);
  if (state.heroItems.length <= 1) return;
  state.heroTimer = setInterval(() => {
    setHero(state.heroIndex + 1);
  }, 6500);
}

/* =========================================================
   EVENTOS DA PÁGINA
========================================================= */

function clearAll() {
  state.category = "Todas";
  state.marketplace = "Todos";
  state.query = "";
  state.sort = "random";
  els.searchInput.value = "";
  els.mobileSearchInput.value = "";
  buildCategories();
  buildMarketplaceFilter();
  applyFilters();
}

$("#heroPrev").addEventListener("click", () => setHero(state.heroIndex - 1, true));
$("#heroNext").addEventListener("click", () => setHero(state.heroIndex + 1, true));

function handleSearchSubmit(event, input) {
  event.preventDefault();
  state.query = input.value;
  els.searchInput.value = state.query;
  els.mobileSearchInput.value = state.query;
  applyFilters();
  document.querySelector("#ofertas").scrollIntoView({ behavior: "smooth" });
}

els.searchForm.addEventListener("submit", event => handleSearchSubmit(event, els.searchInput));
els.mobileSearchForm.addEventListener("submit", event => handleSearchSubmit(event, els.mobileSearchInput));

els.searchInput.addEventListener("input", () => {
  state.query = els.searchInput.value;
  els.mobileSearchInput.value = state.query;
  applyFilters();
});
els.mobileSearchInput.addEventListener("input", () => {
  state.query = els.mobileSearchInput.value;
  els.searchInput.value = state.query;
  applyFilters();
});

els.sortSelect.addEventListener("change", () => {
  state.sort = els.sortSelect.value;
  applyFilters();
});

$$(".quick-filter").forEach(button => {
  button.addEventListener("click", () => {
    state.sort = button.dataset.sort;
    applyFilters();
  });
});

els.marketplaceSelect.addEventListener("change", () => {
  state.marketplace = els.marketplaceSelect.value;
  applyFilters();
});

$("#clearFilters").addEventListener("click", clearAll);
$("#resetSearch").addEventListener("click", clearAll);

els.menuButton.addEventListener("click", () => {
  const open = els.mainNav.classList.toggle("open");
  els.menuButton.setAttribute("aria-expanded", String(open));
});

els.mainNav.addEventListener("click", event => {
  if (event.target.matches("a")) {
    els.mainNav.classList.remove("open");
    els.menuButton.setAttribute("aria-expanded", "false");
  }
});

document.addEventListener("visibilitychange", () => {
  if (document.hidden) {
    clearInterval(state.heroTimer);
  } else {
    restartHeroTimer();
  }
});

$("#year").textContent = new Date().getFullYear();

/* =========================================================
   INICIALIZAÇÃO
========================================================= */
loadProducts().then(products => {
    state.products = Array.isArray(products)
      ? products.map(product => ({ ...product, _randomOrder: Math.random() }))
      : [];
    buildCategories();
    buildMarketplaceFilter();
    buildHero();
    applyFilters();
  }).catch(error => {
    console.error(error);
    els.resultCount.textContent = "Não foi possível carregar as ofertas.";
    els.emptyState.hidden = false;
    const strong = els.emptyState.querySelector("strong");
    const span = els.emptyState.querySelector("span");
    if (strong) strong.textContent = "Erro ao carregar as ofertas.";
    if (span) span.textContent = "Verifique o arquivo data/produtos.json.";
  });