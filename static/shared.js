(() => {
  'use strict';

  const paths = {
    search: '<circle cx="11" cy="11" r="7"></circle><path d="m20 20-3.8-3.8"></path>',
    user: '<circle cx="12" cy="8" r="4"></circle><path d="M4 21a8 8 0 0 1 16 0"></path>',
    cart: '<path d="M3 3h2l2.2 11.2a2 2 0 0 0 2 1.6h7.9a2 2 0 0 0 2-1.6L21 7H6"></path><circle cx="10" cy="20" r="1.2"></circle><circle cx="18" cy="20" r="1.2"></circle>',
    menu: '<path d="M4 6h16M4 12h16M4 18h16"></path>',
    x: '<path d="M6 6l12 12M18 6 6 18"></path>',
    chevron: '<path d="m8 10 4 4 4-4"></path>',
    arrow: '<path d="M5 12h14M14 7l5 5-5 5"></path>',
    location: '<path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0z"></path><circle cx="12" cy="10" r="2.5"></circle>',
    star: '<path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2-5.6-3-5.6 3 1.1-6.2L3 9.6l6.2-.9z"></path>',
    store: '<path d="M4 9h16l-2-6H6z"></path><path d="M5 9v12h14V9M9 21v-6h6v6"></path>',
    compare: '<path d="M7 3v14M7 3 3 7M7 3l4 4M17 21V7m0 14 4-4m-4 4-4-4"></path>',
    check: '<path d="m5 12 4 4L19 6"></path>',
    shield: '<path d="M12 3 4 6v6c0 5 3.4 8.3 8 10 4.6-1.7 8-5 8-10V6z"></path><path d="m9 12 2 2 4-5"></path>',
    card: '<rect x="3" y="5" width="18" height="14" rx="2"></rect><path d="M3 10h18M7 15h4"></path>',
    headset: '<path d="M4 13a8 8 0 0 1 16 0v6h-4v-6h4M4 13v6h4v-6z"></path><path d="M16 21h-4"></path>',
    truck: '<path d="M3 5h11v12H3zM14 9h4l3 4v4h-7z"></path><circle cx="7" cy="19" r="2"></circle><circle cx="18" cy="19" r="2"></circle>',
    cpu: '<rect x="6" y="6" width="12" height="12" rx="2"></rect><path d="M9 1v3M15 1v3M9 20v3M15 20v3M20 9h3M20 14h3M1 9h3M1 14h3M9 9h6v6H9z"></path>',
    laptop: '<rect x="4" y="4" width="16" height="11" rx="1"></rect><path d="M2 19h20l-2-4H4z"></path>',
    phone: '<rect x="7" y="2" width="10" height="20" rx="2"></rect><path d="M11 18h2"></path>',
    telephone: '<path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 2 .7 2.9a2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.2-1.2a2 2 0 0 1 2.1-.5c1 .3 1.9.6 2.9.7A2 2 0 0 1 22 16.9z"></path>',
    memory: '<rect x="3" y="7" width="18" height="10" rx="2"></rect><path d="M6 10h2v4H6zM10 10h2v4h-2zM14 10h2v4h-2zM18 10h1v4h-1M6 17v3M10 17v3M14 17v3M18 17v3"></path>',
    gpu: '<rect x="3" y="6" width="15" height="11" rx="2"></rect><circle cx="9" cy="11.5" r="2.8"></circle><path d="M18 9h3v5h-3M6 17v2M10 17v2M14 17v2"></path>',
    monitor: '<rect x="3" y="5" width="18" height="12" rx="2"></rect><path d="M8 21h8M12 17v4"></path>',
    wrench: '<path d="m14 6 4-4 4 4-4 4"></path><path d="M16 8 7 17"></path><path d="m6 15-4 4 3 3 4-4"></path><path d="m3 3 18 18"></path><path d="m3 3 4 1-3 3-1-4Z"></path>',
    ssd: '<rect x="5" y="2" width="14" height="20" rx="2"></rect><circle cx="9" cy="7" r="1"></circle><circle cx="15" cy="7" r="1"></circle><path d="M8 12h8M8 16h5"></path>',
    power: '<path d="M12 2v8"></path><path d="M7 5.5a8 8 0 1 0 10 0"></path>',
    box: '<path d="m3 7 9-4 9 4-9 4z"></path><path d="M3 7v10l9 4 9-4V7M12 11v10"></path>',
    tools: '<path d="M14.7 6.3a4 4 0 0 0-5-5l2.2 2.2-3.4 3.4-2.2-2.2a4 4 0 0 0 5 5L20 18.4 18.4 20l-8.7-8.7"></path>',
    map: '<path d="m3 6 6-3 6 3 6-3v15l-6 3-6-3-6 3zM9 3v15M15 6v15"></path>',
    whatsapp: '<path fill="currentColor" stroke="none" d="M12.04 2a9.84 9.84 0 0 0-8.43 14.92L2 22l5.23-1.55A9.94 9.94 0 1 0 12.04 2Zm0 17.98a8.1 8.1 0 0 1-4.13-1.13l-.3-.18-3.1.92.94-3.02-.2-.31a8.06 8.06 0 1 1 6.79 3.72Zm4.43-6.03c-.24-.12-1.44-.71-1.66-.79-.22-.08-.38-.12-.54.12-.16.24-.62.79-.76.95-.14.16-.28.18-.52.06-.24-.12-1.02-.38-1.94-1.2-.72-.64-1.2-1.43-1.34-1.67-.14-.24-.02-.37.1-.49.11-.11.24-.28.36-.42.12-.14.16-.24.24-.4.08-.16.04-.3-.02-.42-.06-.12-.54-1.3-.74-1.78-.2-.47-.4-.41-.54-.42h-.46c-.16 0-.42.06-.64.3-.22.24-.84.82-.84 2s.86 2.32.98 2.48c.12.16 1.69 2.58 4.09 3.62.57.25 1.02.39 1.37.5.58.18 1.1.16 1.51.1.46-.07 1.44-.59 1.64-1.16.2-.57.2-1.06.14-1.16-.06-.1-.22-.16-.46-.28Z"></path>',
    clock: '<circle cx="12" cy="12" r="9"></circle><path d="M12 7v5l3 2"></path>',
    tag: '<path d="M20 13 11 22l-9-9V4h9z"></path><circle cx="7" cy="9" r="1.5"></circle>',
    home: '<path d="m3 11 9-8 9 8"></path><path d="M5 10v10h14V10M9 20v-6h6v6"></path>',
    heart: '<path d="M20.8 4.6a5.4 5.4 0 0 0-7.6 0L12 5.8l-1.2-1.2a5.4 5.4 0 0 0-7.6 7.6L12 21l8.8-8.8a5.4 5.4 0 0 0 0-7.6z"></path>',
    moon: '<path d="M21 12.8A8.5 8.5 0 1 1 11.2 3 6.6 6.6 0 0 0 21 12.8z"></path>',
    sun: '<circle cx="12" cy="12" r="4"></circle><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"></path>',
    filter: '<path d="M4 5h16M7 12h10M10 19h4"></path>',
    bolt: '<path d="m13 2-9 12h7l-1 8 9-12h-7z"></path>',
    info: '<circle cx="12" cy="12" r="9"></circle><path d="M12 11v6M12 7h.01"></path>',
    plus: '<path d="M12 5v14M5 12h14"></path>',
    minus: '<path d="M5 12h14"></path>',
    refresh: '<path d="M20 7v5h-5"></path><path d="M4 17v-5h5"></path><path d="M6.1 8a7 7 0 0 1 11.6-2.6L20 8M4 16l2.3 2.6A7 7 0 0 0 18 16"></path>',
    external: '<path d="M14 3h7v7M10 14 21 3"></path><path d="M21 14v5a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5"></path>',
    mouse: '<path d="M12 2a6 6 0 0 0-6 6v8a6 6 0 0 0 12 0V8a6 6 0 0 0-6-6z"></path><path d="M12 2v7M9 9h6"></path>',
    keyboard: '<rect x="2" y="5" width="20" height="14" rx="2"></rect><path d="M5 9h2M9 9h2M13 9h2M17 9h2M5 13h2M9 13h2M13 13h6M5 17h10"></path>',
    camera: '<path d="M4 7h4l2-3h4l2 3h4v12H4z"></path><circle cx="12" cy="13" r="4"></circle>',
    watch: '<rect x="7" y="5" width="10" height="14" rx="3"></rect><path d="M9 5V2h6v3M9 19v3h6v-3"></path>',
    printer: '<path d="M6 9V3h12v6M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path><path d="M6 14h12v7H6z"></path>',
    wifi: '<path d="M5 12.5a10 10 0 0 1 14 0M8.5 16a5 5 0 0 1 7 0"></path><circle cx="12" cy="20" r="1"></circle>',
    list: '<path d="M8 6h13M8 12h13M8 18h13"></path><circle cx="3" cy="6" r="1"></circle><circle cx="3" cy="12" r="1"></circle><circle cx="3" cy="18" r="1"></circle>'
  };

  function getStoredTheme() {
    try { return localStorage.getItem('promoinfo-theme') === 'dark' ? 'dark' : 'light'; } catch { return 'light'; }
  }

  function updateThemeAssets(theme) {
    document.querySelectorAll('[data-theme-light-src][data-theme-dark-src]').forEach((image) => {
      image.src = theme === 'dark' ? image.dataset.themeDarkSrc : image.dataset.themeLightSrc;
    });
  }

  function syncThemeButton(theme) {
    const button = document.getElementById('themeToggle');
    if (!button) return;
    const isDark = theme === 'dark';
    button.innerHTML = icon(isDark ? 'sun' : 'moon');
    button.setAttribute('aria-label', isDark ? 'Ativar tema claro' : 'Ativar tema escuro');
    button.setAttribute('title', isDark ? 'Usar tema claro' : 'Usar tema escuro');
  }

  function applyTheme(theme, persist = true) {
    const selected = theme === 'dark' ? 'dark' : 'light';
    document.body?.classList.toggle('theme-dark', selected === 'dark');
    document.documentElement.dataset.theme = selected;
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', selected === 'dark' ? '#06101d' : '#ff5a00');
    if (persist) { try { localStorage.setItem('promoinfo-theme', selected); } catch {} }
    updateThemeAssets(selected);
    syncThemeButton(selected);
    document.dispatchEvent(new CustomEvent('promoinfo:themechange', { detail: { theme: selected } }));
  }

  applyTheme(getStoredTheme(), false);

  function icon(name, className = '') {
    const content = paths[name] || paths.info;
    return `<svg class="ui-icon ${className}" viewBox="0 0 24 24" aria-hidden="true" focusable="false">${content}</svg>`;
  }

  function money(value) {
    const number = Number(value);
    if (!Number.isFinite(number) || number <= 0) return 'Consulte';
    return number.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  }

  function normalize(value = '') {
    return String(value).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  }

  function escapeHtml(value = '') {
    return String(value).replace(/[&<>'"]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#039;', '"': '&quot;' }[char]));
  }

  function getOffers(product, variantId) {
    const variants = product?.variants || [];
    const selected = variants.find((variant) => variant.id === variantId) || variants[0];
    return selected ? [...selected.offers].filter((offer) => Number(offer.price) > 0).sort((a, b) => Number(a.price) - Number(b.price)) : [];
  }

  function getAllOffers(product) {
    return (product?.variants || []).flatMap((variant) => variant.offers || []).filter((offer) => Number(offer.price) > 0);
  }

  function getMinPrice(product) {
    const prices = getAllOffers(product).map((offer) => Number(offer.price)).filter((price) => price > 0);
    return prices.length ? Math.min(...prices) : null;
  }

  function getOfferCount(product) {
    return getAllOffers(product).length;
  }

  function assetForTheme(path = '') {
    const value = String(path || '');
    const isDark = document.body?.classList.contains('theme-dark');
    if (isDark && value.includes('assets/products/processed/') && !value.includes('/dark/')) {
      return value.replace('assets/products/processed/', 'assets/products/processed/dark/');
    }
    return value;
  }

  function getStoreAsset(storeName) {
    const data = window.PROMOINFO_DATA || {};
    const store = [...(data.stores || []), ...(data.directoryStores || [])].find((item) => normalize(item.name) === normalize(storeName));
    return store?.image || '';
  }

  function hasPhone(phone) {
    return String(phone || '').replace(/\D/g, '').length >= 10;
  }

  function whatsappHref(phone, message) {
    const digits = String(phone || '').replace(/\D/g, '');
    if (digits.length < 10) return '';
    const normalized = digits.startsWith('55') ? digits : `55${digits}`;
    return `https://wa.me/${normalized}?text=${encodeURIComponent(message || 'Olá! Gostaria de mais informações.')}`;
  }

  function activeProductCategories() {
    const data = window.PROMOINFO_DATA || {};
    const ids = new Set((data.products || []).filter((product) => getMinPrice(product)).map((product) => product.category));
    return (data.categories || []).filter((item) => item.id === 'all' || ids.has(item.id));
  }

  function marketplaceCategories() {
    const data = window.PROMOINFO_DATA || {};
    return (data.categories || []).filter((item) => item.id !== 'all');
  }

  function activeProductBrands() {
    const data = window.PROMOINFO_DATA || {};
    const names = new Set((data.products || []).filter((product) => getMinPrice(product)).map((product) => normalize(product.brand)));
    return (data.brands || []).filter((item) => names.has(normalize(item.name)));
  }

  function renderHeader(active = '') {
    const target = document.getElementById('siteHeader');
    if (!target) return;
    const activeClass = (name) => active === name ? 'is-active' : '';
    const session = window.PromoMarketplace?.getSession?.();
    const accountHref = session?.role === 'merchant' ? 'painel-lojista.html' : 'lojista.html';
    const accountSmall = session?.role === 'admin' ? 'Administração' : session?.role === 'merchant' ? 'Sua loja' : 'Anuncie seus produtos';
    const accountStrong = session?.role === 'admin' ? 'Painel admin' : session?.role === 'merchant' ? 'Painel do lojista' : 'Área do lojista';
    target.innerHTML = `
      <header class="site-header">
        <div class="header-main">
          <div class="container header-row">
            <button class="mobile-menu-btn" id="mobileMenuBtn" type="button" aria-label="Abrir menu">${icon('menu')}</button>
            <a class="brand" href="/" aria-label="Página inicial PromoInfo Mix"><img src="/assets/promoinfo-logo.png" alt="PromoInfo Mix"></a>
            <button class="location-compact" id="locationBtn" type="button">${icon('location')}<span><small>Comprar em</small><strong id="locationText">Todos os shoppings</strong></span>${icon('chevron','chevron')}</button>
            <form class="header-search" id="headerSearch">
              <input id="headerSearchInput" type="search" placeholder="Buscar produto, marca ou loja" aria-label="Buscar produto, marca ou loja">
              <button type="submit" aria-label="Buscar">${icon('search')}</button>
            </form>
            <div class="header-actions">
              <button class="round-action theme-toggle" id="themeToggle" type="button" aria-label="Ativar tema escuro" title="Usar tema escuro">${icon('moon')}</button>
              <a class="restricted-area-btn" href="/area-restrita/" aria-label="Abrir área restrita" title="Área restrita">${icon('shield')}<span><strong>Área restrita</strong></span></a>
              <a class="account-btn ${activeClass('merchant') || activeClass('admin')}" href="${accountHref}">${icon('user')}<span><small>${accountSmall}</small><strong>${accountStrong}</strong></span></a>
            </div>
          </div>
          <div class="location-popover" id="locationPopover" hidden>
            <button data-location="Todos os shoppings">Todos os shoppings</button>
            <button data-location="Barra">PromoInfo Barra</button>
            <button data-location="Centro">PromoInfo Centro</button>
            <button data-location="Norte">PromoInfo Norte</button>
            <button data-location="Tijuca">PromoInfo Tijuca</button>
          </div>
        </div>
        <nav class="main-nav">
          <div class="container nav-row">
            <button class="categories-trigger" id="categoriesTrigger" type="button">${icon('menu')}<span>Todas as categorias</span>${icon('chevron','chevron')}</button>
            <a class="${activeClass('offers')}" href="/catalogo.html?ordem=ofertas">Ofertas</a>
            <a class="${activeClass('products')}" href="/catalogo.html">Comparar preços</a>
            <a class="${activeClass('builder')}" href="/monte-seu-pc.html">Monte seu PC</a>
            <a class="${activeClass('stores')}" href="/lojas.html">Lojas</a>
            <a href="/catalogo.html?categoria=servicos">Serviços</a>
            <a href="/#marcas">Marcas</a>
            <a class="${activeClass('merchant')}" href="/lojista.html">Área do lojista</a>
            <a class="restricted-nav-link" href="/area-restrita/">${icon('shield')}Área restrita</a>
            <a class="rent-link" href="/alugue.html">${icon('store')}Alugue sua loja</a>
          </div>
          <div class="mega-menu" id="megaMenu" hidden><div class="container mega-grid" id="megaGrid"></div></div>
        </nav>
      </header>
      <div class="mobile-drawer" id="mobileDrawer" aria-hidden="true">
        <button class="drawer-backdrop" type="button" data-close-drawer aria-label="Fechar menu"></button>
        <aside class="drawer-panel">
          <div class="drawer-head"><img src="/assets/promoinfo-logo.png" alt="PromoInfo Mix"><button type="button" data-close-drawer aria-label="Fechar">${icon('x')}</button></div>
          <a href="/">Início</a><a href="/catalogo.html?ordem=ofertas">Ofertas</a><a href="/catalogo.html">Comparar preços</a><a href="/monte-seu-pc.html">Monte seu PC</a><a href="/lojas.html">Lojas</a><a href="/#marcas">Marcas</a><a href="/lojista.html">Área do lojista</a><a href="/area-restrita/">Área restrita</a><a href="/alugue.html">Alugue sua loja</a>
        </aside>
      </div>
      <div class="toast" id="globalToast" role="status" aria-live="polite"></div>`;

    const categories = marketplaceCategories().filter((item) => item.featured !== false);
    const megaGrid = document.getElementById('megaGrid');
    if (megaGrid) {
      megaGrid.innerHTML = categories.map((item) => `<a class="mega-item" href="/catalogo.html?categoria=${encodeURIComponent(item.id)}"><span>${icon(iconNameForCategory(item.id))}</span><strong>${escapeHtml(item.label)}</strong><small>Ver produtos</small></a>`).join('');
    }

    const locationBtn = document.getElementById('locationBtn');
    const locationPopover = document.getElementById('locationPopover');
    locationBtn?.addEventListener('click', () => { locationPopover.hidden = !locationPopover.hidden; });
    locationPopover?.addEventListener('click', (event) => {
      const button = event.target.closest('[data-location]');
      if (!button) return;
      document.getElementById('locationText').textContent = button.dataset.location;
      locationPopover.hidden = true;
      try { localStorage.setItem('promoinfo-location', button.dataset.location); } catch {}
      document.dispatchEvent(new CustomEvent('promoinfo:locationchange', { detail: { location: button.dataset.location } }));
    });
    let savedLocation = '';
    try { savedLocation = localStorage.getItem('promoinfo-location') || ''; } catch {}
    if (savedLocation && document.getElementById('locationText')) document.getElementById('locationText').textContent = savedLocation;

    const categoriesTrigger = document.getElementById('categoriesTrigger');
    const megaMenu = document.getElementById('megaMenu');
    categoriesTrigger?.addEventListener('click', () => { megaMenu.hidden = !megaMenu.hidden; });

    const mobileMenuBtn = document.getElementById('mobileMenuBtn');
    const mobileDrawer = document.getElementById('mobileDrawer');
    mobileMenuBtn?.addEventListener('click', () => { mobileDrawer.classList.add('open'); mobileDrawer.setAttribute('aria-hidden', 'false'); });
    mobileDrawer?.addEventListener('click', (event) => {
      if (event.target.closest('[data-close-drawer]')) { mobileDrawer.classList.remove('open'); mobileDrawer.setAttribute('aria-hidden', 'true'); }
    });

    const themeToggle = document.getElementById('themeToggle');
    syncThemeButton(getStoredTheme());
    updateThemeAssets(getStoredTheme());
    themeToggle?.addEventListener('click', () => {
      const next = document.body.classList.contains('theme-dark') ? 'light' : 'dark';
      applyTheme(next);
    });

    document.getElementById('headerSearch')?.addEventListener('submit', (event) => {
      event.preventDefault();
      const value = document.getElementById('headerSearchInput').value.trim();
      if (!value) return;
      window.location.href = `catalogo.html?busca=${encodeURIComponent(value)}`;
    });

    document.addEventListener('click', (event) => {
      if (!event.target.closest('#locationBtn') && !event.target.closest('#locationPopover') && locationPopover) locationPopover.hidden = true;
      if (!event.target.closest('#categoriesTrigger') && !event.target.closest('#megaMenu') && megaMenu) megaMenu.hidden = true;
      const toastTarget = event.target.closest('[data-toast]');
      if (toastTarget) showToast(toastTarget.dataset.toast);
    });
  }

  function iconNameForCategory(id = '') {
    const map = { all: 'star', destaque: 'star', notebook: 'laptop', celular: 'phone', tablet: 'phone', computador: 'laptop', gabinete: 'box', processador: 'cpu', 'placa-mae': 'cpu', memoria: 'memory', armazenamento: 'ssd', 'placa-video': 'gpu', fonte: 'bolt', refrigeracao: 'refresh', monitor: 'monitor', teclado: 'keyboard', mouse: 'mouse', audio: 'headset', webcam: 'camera', cameras: 'camera', perifericos: 'mouse', impressoras: 'printer', automacao: 'card', rede: 'wifi', games: 'box', software: 'list', wearables: 'watch', 'smart-home': 'home', seguranca: 'shield', acessorios: 'tag', servicos: 'wrench' };
    return map[id] || 'tag';
  }

  function showToast(message) {
    const toast = document.getElementById('globalToast');
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add('show');
    clearTimeout(showToast.timer);
    showToast.timer = setTimeout(() => toast.classList.remove('show'), 2800);
  }

  function assistantGreeting() {
    const hour = new Date().getHours();
    if (hour < 12) return 'Bom dia';
    if (hour < 18) return 'Boa tarde';
    return 'Boa noite';
  }

  function readCookie(name) {
    const prefix = `${name}=`;
    return document.cookie.split(';').map(part => part.trim()).find(part => part.startsWith(prefix))?.slice(prefix.length) || '';
  }

  function ensurePromoAssistant() {
    if (location.pathname.startsWith('/area-restrita') || location.pathname.startsWith('/funcionarios')) return;
    if (document.getElementById('promoAssistant')) return;
    const greeting = assistantGreeting();
    const history = [];
    const root = document.createElement('div');
    root.id = 'promoAssistant';
    root.className = 'promo-assistant';
    root.innerHTML = `
      <button class="promo-assistant-trigger promo-assistant-trigger-face" type="button" aria-expanded="false" aria-controls="promoAssistantPanel" title="Fale com a Ana" aria-label="Abrir conversa com a Ana, Assistente PromoInfo">
        <span class="promo-assistant-face"><img src="/assets/ana-assistente-promoinfo.png" alt="Ana, Assistente PromoInfo"></span>
        <span class="promo-assistant-online-dot" aria-hidden="true"></span>
      </button>
      <section class="promo-assistant-panel promo-assistant-chat promo-assistant-chat-v11" id="promoAssistantPanel" hidden aria-label="Ana, Assistente PromoInfo">
        <header class="promo-assistant-chat-head promo-assistant-chat-head-v11">
          <div class="promo-assistant-character-v11" aria-hidden="true">
            <img src="/assets/ana-assistente-promoinfo.png" alt="">
          </div>
          <div class="promo-assistant-title">
            <small>ANA • ASSISTENTE PROMOINFO</small>
            <strong>${greeting}! 👋</strong>
            <span>Produtos, ofertas, hardware e cultura geral.</span>
          </div>
          <button type="button" data-assistant-close aria-label="Fechar">${icon('x')}</button>
        </header>
        <div class="promo-assistant-status"><span class="promo-assistant-status-dot"></span><span data-assistant-status>Online • Assistente PromoInfo</span></div>
        <div class="promo-assistant-messages" id="promoAssistantMessages">
          <article class="assistant-msg bot">${greeting}! Sou a Ana. Posso te ajudar com produtos, ofertas, lojas, compatibilidade de hardware e também perguntas de cultura geral.</article>
        </div>
        <div class="promo-assistant-suggestions">
          <button type="button" data-assistant-suggest="RTX 4060 funciona em uma placa-mãe B550?">RTX 4060 + B550?</button>
          <button type="button" data-assistant-suggest="me mostre as ofertas em destaque">Ofertas em destaque</button>
          <button type="button" data-assistant-suggest="onde comprar SSD">Onde comprar SSD?</button>
        </div>
        <form class="promo-assistant-form" id="promoAssistantForm">
          <input id="promoAssistantInput" maxlength="700" placeholder="Ex.: Ryzen 7 5700G funciona na B550?" autocomplete="off" aria-label="Pergunte à Ana, Assistente PromoInfo">
          <button type="submit" aria-label="Enviar">${icon('arrow')}</button>
        </form>
        <p class="promo-assistant-disclaimer">Informações de preço, estoque e garantia devem ser confirmadas com o lojista.</p>
      </section>`;
    document.body.appendChild(root);

    const trigger = root.querySelector('.promo-assistant-trigger');
    const panel = root.querySelector('.promo-assistant-panel');
    const form = root.querySelector('#promoAssistantForm');
    const input = root.querySelector('#promoAssistantInput');
    const messages = root.querySelector('#promoAssistantMessages');
    const status = root.querySelector('[data-assistant-status]');
    const submitButton = form.querySelector('button[type="submit"]');
    const toggle = (open) => {
      panel.hidden = !open;
      trigger.setAttribute('aria-expanded', String(open));
      if (open) setTimeout(() => input.focus(), 60);
    };

    trigger.addEventListener('click', () => toggle(panel.hidden));
    root.querySelector('[data-assistant-close]').addEventListener('click', () => toggle(false));
    root.querySelectorAll('[data-assistant-suggest]').forEach(btn => btn.addEventListener('click', () => {
      input.value = btn.dataset.assistantSuggest;
      form.requestSubmit();
    }));

    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      const question = input.value.trim();
      if (!question) return;
      appendAssistantMessage(messages, question, 'user');
      history.push({ role: 'user', content: question });
      if (history.length > 8) history.splice(0, history.length - 8);
      input.value = '';
      input.disabled = true;
      submitButton.disabled = true;
      const typing = appendAssistantMessage(messages, 'Ana está verificando…', 'bot typing');

      try {
        const response = await fetch('/api/ana/', {
          method: 'POST',
          credentials: 'same-origin',
          headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': decodeURIComponent(readCookie('csrftoken')),
          },
          body: JSON.stringify({ message: question }),
        });
        const payload = await response.json().catch(() => ({}));
        typing.remove();
        if (!response.ok || !payload.ok) throw new Error(payload.error || 'Não foi possível consultar a Ana agora.');
        appendAssistantMessage(messages, payload.answer, 'bot');
        history.push({ role: 'assistant', content: payload.answer });
        if (history.length > 8) history.splice(0, history.length - 8);
        if (status) status.textContent = payload.limited
          ? 'Assistente PromoInfo • acesso limitado'
          : 'Online • Assistente PromoInfo';
      } catch (error) {
        typing.remove();
        appendAssistantMessage(messages, error.message || 'Não consegui responder agora. Tente novamente em instantes.', 'bot error');
      } finally {
        input.disabled = false;
        submitButton.disabled = false;
        input.focus();
      }
    });
  }

  function appendAssistantMessage(container, text, type) {
    const article = document.createElement('article');
    article.className = `assistant-msg ${type}`;
    article.textContent = String(text || '');
    container.appendChild(article);
    container.scrollTop = container.scrollHeight;
    return article;
  }

  function renderFooter() {
    const target = document.getElementById('siteFooter');
    if (!target) return;
    target.innerHTML = `
      <footer class="site-footer">
        <div class="container footer-grid">
          <div class="footer-brand"><img src="/assets/promoinfo-logo.png" alt="PromoInfo Mix"><p>Rede de shoppings com lojas físicas de tecnologia e outros segmentos no Rio de Janeiro.</p></div>
          <div><h3>Comprar</h3><a href="/catalogo.html">Comparar produtos</a><a href="/catalogo.html?ordem=ofertas">Ofertas</a><a href="/monte-seu-pc.html">Monte seu PC</a><a href="/#marcas">Marcas</a></div>
          <div><h3>Unidades</h3><a href="/#unidades">Barra</a><a href="/#unidades">Centro</a><a href="/#unidades">Norte</a><a href="/#unidades">Tijuca</a></div>
          <div><h3>Para lojistas</h3><a href="/lojista.html">Cadastrar ou acessar painel</a><a href="/alugue.html">Alugue sua loja</a><a href="/lojas.html">Diretório de lojas</a><a href="tel:21999249260">Comercial: (21) 99924-9260</a></div>
          <div><h3>Informações</h3><a href="/privacidade.html">Privacidade</a><a href="/termos.html">Termos de uso</a><a href="/area-restrita/">Área restrita</a></div>
        </div>
        <div class="container footer-bottom"><span>© 2026 PromoInfo Mix — tecnologia, lojas e comparação de ofertas.</span><span>Preços, estoque e condições devem ser confirmados diretamente com cada lojista.</span></div>
      </footer>`;
    ensurePromoAssistant();
  }

  window.PromoUI = { icon, money, normalize, escapeHtml, getOffers, getAllOffers, getMinPrice, getOfferCount, getStoreAsset, assetForTheme, hasPhone, whatsappHref, activeProductCategories, marketplaceCategories, activeProductBrands, renderHeader, renderFooter, showToast, iconNameForCategory, applyTheme, getStoredTheme, updateThemeAssets };
})();
