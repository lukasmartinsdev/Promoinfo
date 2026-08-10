(() => {
  'use strict';
  const D = window.PROMOINFO_DATA;
  const U = window.PromoUI;
  const params = new URLSearchParams(window.location.search);
  const state = { query: '', unit: '', visible: 24 };

  document.addEventListener('DOMContentLoaded', init);

  function init() {
    U.renderHeader('stores');
    U.renderFooter();
    hydrateIcons(document);
    document.getElementById('directoryCount').textContent = D.directoryStores.length.toLocaleString('pt-BR');
    renderUnitFilters();
    renderFeatured();
    renderDirectory();
    bindEvents();
    const requested = params.get('loja');
    if (requested) setTimeout(() => document.getElementById(`store-${safeId(requested)}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 180);
  }

  function hydrateIcons(root) {
    root.querySelectorAll('[data-icon]').forEach((node) => { node.innerHTML = U.icon(node.dataset.icon); });
  }

  function safeId(value = '') {
    return String(value).replace(/[^a-zA-Z0-9_-]/g, '-');
  }

  function initials(name = '') {
    return name.split(/\s+/).filter(Boolean).slice(0,2).map((part) => part[0]).join('').toUpperCase() || 'LJ';
  }

  function storeMedia(store) {
    return store.image ? `<img src="${U.escapeHtml(store.image)}" alt="${U.escapeHtml(store.name)}" loading="lazy" width="520" height="320">` : `<div class="store-placeholder-logo">${U.escapeHtml(initials(store.name))}</div>`;
  }

  function renderUnitFilters() {
    const units = ['', ...new Set(D.directoryStores.map((store) => store.unit).filter(Boolean))];
    document.getElementById('unitFilters').innerHTML = units.map((unit) => `<button class="${state.unit === unit ? 'active' : ''}" data-unit="${U.escapeHtml(unit)}">${unit || 'Todas'}</button>`).join('');
  }

  function renderFeatured() {
    document.getElementById('fullStoreCards').innerHTML = D.stores.map((store) => {
      const whatsapp = U.whatsappHref(store.whatsapp || store.phone, `Olá! Conheci a ${store.name} pela PromoInfo Mix.`);
      const profile = store.source || '';
      return `<article class="store-card" id="store-${safeId(store.id)}">
        <div class="store-media organic-media">${storeMedia(store)}<span class="store-unit">${U.escapeHtml(store.unit)}</span></div>
        <div class="store-body"><small>${U.escapeHtml(store.location)}</small><h3>${U.escapeHtml(store.name)}</h3><p>${U.escapeHtml(store.description || '')}</p><div class="store-tags">${(store.specialties || []).map((item) => `<span>${U.escapeHtml(item)}</span>`).join('')}</div><div class="store-contact-list"><span>${U.icon('telephone')}${U.escapeHtml(store.phone || 'Consulte')}</span><span>${U.icon('clock')}Lojista desde ${U.escapeHtml(store.since || 'cadastro local')}</span></div><div class="store-actions">${whatsapp ? `<a class="btn btn-primary" href="${whatsapp}" target="_blank" rel="noopener">${U.icon('whatsapp')} WhatsApp</a>` : ''}${profile && !store.local ? `<a class="btn btn-secondary" href="${U.escapeHtml(profile)}" target="_blank" rel="noopener">Perfil original</a>` : `<a class="btn btn-secondary" href="catalogo.html?busca=${encodeURIComponent(store.name)}">Ver produtos</a>`}</div></div>
      </article>`;
    }).join('');
  }

  function filteredDirectory() {
    const q = U.normalize(state.query);
    return D.directoryStores.filter((store) => {
      const unitOk = !state.unit || U.normalize(store.unit) === U.normalize(state.unit);
      const text = `${store.name} ${store.unit} ${store.location} ${store.phone}`;
      return unitOk && (!q || U.normalize(text).includes(q));
    });
  }

  function renderDirectory() {
    const stores = filteredDirectory();
    document.getElementById('directorySummary').textContent = `${stores.length.toLocaleString('pt-BR')} ${stores.length === 1 ? 'loja encontrada' : 'lojas encontradas'}.`;
    document.getElementById('directoryGrid').innerHTML = stores.slice(0, state.visible).map((store) => {
      const source = store.source || store.sourceUrl || '';
      const media = store.image ? `<img src="${U.escapeHtml(store.image)}" alt="">` : U.escapeHtml(initials(store.name));
      const link = store.local ? `lojas.html?loja=${encodeURIComponent(store.id)}` : source;
      return `<article class="directory-card"><div class="directory-avatar ${store.image ? 'has-image' : ''}">${media}</div><div class="directory-info"><h3>${U.escapeHtml(store.name)}</h3><p>${U.icon('location')}${U.escapeHtml(store.unit)} • ${U.escapeHtml(store.location)}</p><span>${U.icon('telephone')}${U.escapeHtml(store.phone || 'Consulte')}</span></div>${link ? `<a href="${U.escapeHtml(link)}" ${store.local ? '' : 'target="_blank" rel="noopener"'} aria-label="Ver loja ${U.escapeHtml(store.name)}">${U.icon('arrow')}</a>` : '<span class="directory-no-link">—</span>'}</article>`;
    }).join('') || `<div class="empty-state">${U.icon('search')}<h3>Nenhuma loja encontrada</h3><p>Tente outro termo ou unidade.</p></div>`;
    document.getElementById('moreStoresBtn').hidden = state.visible >= stores.length;
  }

  function bindEvents() {
    document.getElementById('storeSearch').addEventListener('input', (event) => { state.query = event.target.value; state.visible = 24; renderDirectory(); });
    document.getElementById('unitFilters').addEventListener('click', (event) => { const button = event.target.closest('[data-unit]'); if (!button) return; state.unit = button.dataset.unit; state.visible = 24; renderUnitFilters(); renderDirectory(); });
    document.getElementById('moreStoresBtn').addEventListener('click', () => { state.visible += 24; renderDirectory(); });
  }
})();
