const state = {
  products: [],
  filtered: [],
  heroItems: [],
  heroIndex: 0,
  category: "Todas",
  query: "",
  sort: "random",
  heroTimer: null
};

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];

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
  sortSelect: $("#sortSelect"),
  searchForm: $("#searchForm"),
  searchInput: $("#searchInput"),
  mainNav: $("#mainNav"),
  menuButton: $("#menuButton")
};

function formatBRL(value) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return "";
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL"
  }).format(Number(value));
}

function safeText(value) {
  return String(value ?? "");
}

function loadProducts() {
  // Cria um carimbo de tempo único a cada milissegundo
  const timestamp = new Date().getTime();
  
  // Junta a sua regra de no-store com a URL dinâmica
  return fetch(`data/produtos.json?v=${timestamp}`, { cache: "no-store" })
    .then(response => {
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return response.json();
    });
}

function buildCategories() {
  const categories = ["Todas", ...new Set(
    state.products
      .filter(p => !p.is_empty_card)
      .map(p => p.category)
      .filter(Boolean)
  )];

  els.categoryChips.innerHTML = "";

  categories.forEach(category => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "category-chip" + (category === state.category ? " active" : "");
    button.textContent = category;
    button.addEventListener("click", () => {
      state.category = category;
      buildCategories();
      applyFilters();
      document.querySelector("#ofertas").scrollIntoView({ behavior: "smooth", block: "start" });
    });
    els.categoryChips.appendChild(button);
  });
}

function getMarketplaceLogo(marketplace) {
  const name = String(marketplace || "")
    .trim()
    .toLowerCase();

  if (name.includes("mercado livre")) {
    return "assets/images/logos/logo_mercadolivre.png";
  }

  if (name.includes("amazon")) {
    return "assets/images/logos/logo_amazon.png";
  }

  // 🔥 ADICIONADO: Regra exata para o Magalu com o nome do seu arquivo
  if (name.includes("magalu") || name.includes("magazine luiza")) {
    return "assets/images/logos/logo_magalu.png"; 
  }

  // fallback caso futuramente venha outro marketplace
  return "";
}

function productCard(product) {
  const article = document.createElement("article");
  article.className = "product-card";

  const discount = Number(product.discount || 0);
  const oldPrice = Number(product.old_price || 0);
  const price = Number(product.price || 0);

  if (discount > 60) {
    article.classList.add("super-deal");
  }

  const marketplaceLogo = getMarketplaceLogo(product.marketplace);
  const buttonText = getMarketplaceButtonText(product.marketplace);

  article.innerHTML = `
    <div class="card-top">
      <img
          class="marketplace-logo"
          src="${marketplaceLogo}"
          alt="${safeText(product.marketplace)}"
          loading="lazy"
        >
      ${discount > 0 ? `
        <span class="discount-badge ${discount > 60 ? "hot-deal" : ""}">
          -${discount}% ${discount > 60 ? '<span class="deal-fire">🔥</span>' : ""}
        </span>
      ` : ""}
    </div>

    <div class="product-image-wrap">
      <img class="product-image"
           src="${safeText(product.image_url)}"
           alt="${safeText(product.title)}"
           loading="lazy">
    </div>

    <span class="product-category">${safeText(product.category)}</span>
    <h3 class="product-title">${safeText(product.title)}</h3>

    <div class="product-price-area">
      ${oldPrice > price
        ? `<span class="old-price">De <s>${formatBRL(oldPrice)}</s> por</span>`
        : `<span class="old-price">&nbsp;</span>`}
      <strong class="current-price">${formatBRL(price)}</strong>

      <a class="market-button"
         href="${safeText(product.affiliate_url)}"
         target="_blank"
         rel="noopener sponsored">
        ${buttonText} <span>↗</span>
      </a>
    </div>
  `;

  return article;
}

function getMarketplaceButtonText(marketplace) {
  const name = String(marketplace || "").trim();

  if (name.toLowerCase().includes("amazon")) {
    return "Ver na Amazon";
  }

  if (name.toLowerCase().includes("mercado livre")) {
    return "Ver no Mercado Livre";
  }

  // 🔥 ADICIONADO: Deixa o texto do botão amigável
  if (name.toLowerCase().includes("magalu") || name.toLowerCase().includes("magazine luiza")) {
    return "Ver no Magalu";
  }

  return `Ver em ${name}`;
}

function applyFilters() {
  const query = state.query.trim().toLocaleLowerCase("pt-BR");

  let list = state.products.filter(p => !p.is_empty_card);

  if (state.category !== "Todas") {
    list = list.filter(p => p.category === state.category);
  }

  if (query) {
    list = list.filter(p => {
      const haystack = [
        p.title,
        p.category,
        p.marketplace
      ].join(" ").toLocaleLowerCase("pt-BR");

      return haystack.includes(query);
    });
  }

  list.sort((a, b) => {

    if (state.sort === "discount") {
      return Number(b.discount || 0) - Number(a.discount || 0);
    }

    if (state.sort === "price-asc") {
      return Number(a.price) - Number(b.price);
    }

    if (state.sort === "price-desc") {
      return Number(b.price) - Number(a.price);
    }

    // Ordem inicial aleatória
    return a._randomOrder - b._randomOrder;

  });

  state.filtered = list;
  renderGrid();
}

function renderGrid() {
  els.grid.innerHTML = "";
  state.filtered.forEach(product => els.grid.appendChild(productCard(product)));

  const total = state.filtered.length;
  els.resultCount.textContent = `${total} ${total === 1 ? "oferta encontrada" : "ofertas encontradas"}`;
  els.emptyState.hidden = total > 0;
}

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

  els.heroDiscount.textContent = `-${Number(product.discount || 0)}%`;
  
  // --- INÍCIO DA LIMPEZA DO TÍTULO ---
  // Corta o título no primeiro traço ou vírgula (Remove o excesso de palavras-chave da Amazon)
  let cleanTitle = String(product.title || "")
    .replace(/\s+/g, " ")
    .trim();

  const separators = [
    " | ",
    " - ",
    " – ",
    " — "
  ];

  for (const separator of separators) {
    if (cleanTitle.includes(separator)) {
      cleanTitle = cleanTitle.split(separator)[0].trim();
      break;
    }
  }

  if (cleanTitle.length > 72) {
    cleanTitle =
      cleanTitle.substring(0, 69).trim() + "...";
  }
  els.heroTitle.textContent = cleanTitle;
  // --- FIM DA LIMPEZA ---

  els.heroOldPrice.innerHTML = `De <s>${formatBRL(product.old_price)}</s> por`;
  els.heroPrice.textContent = formatBRL(product.price);
  els.heroButton.href = product.affiliate_url;

  [...els.heroDots.children].forEach((dot, i) => {
    dot.classList.toggle("active", i === state.heroIndex);
  });

  if (resetTimer) restartHeroTimer();
}

function buildHero() {
  state.heroItems = state.products
    .filter(p => !p.is_empty_card && Number(p.discount || 0) > 0)
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
  state.heroTimer = setInterval(() => setHero(state.heroIndex + 1), 6500);
}

function clearAll() {
  state.category = "Todas";
  state.query = "";
  els.searchInput.value = "";
  buildCategories();
  applyFilters();
}

$("#heroPrev").addEventListener("click", () => setHero(state.heroIndex - 1, true));
$("#heroNext").addEventListener("click", () => setHero(state.heroIndex + 1, true));

els.searchForm.addEventListener("submit", event => {
  event.preventDefault();
  state.query = els.searchInput.value;
  applyFilters();
  document.querySelector("#ofertas").scrollIntoView({ behavior: "smooth" });
});

els.searchInput.addEventListener("input", () => {
  state.query = els.searchInput.value;
  applyFilters();
});

els.sortSelect.addEventListener("change", () => {
  state.sort = els.sortSelect.value;
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
  if (document.hidden) clearInterval(state.heroTimer);
  else restartHeroTimer();
});

document.querySelector("#year").textContent = new Date().getFullYear();

loadProducts()
  .then(products => {

    state.products = Array.isArray(products)
      ? products.map(product => ({
          ...product,
          _randomOrder: Math.random()
        }))
      : [];

    buildCategories();
    buildHero();
    applyFilters();

  })
