(() => {
  'use strict';
  const D = window.PROMOINFO_DATA;
  const U = window.PromoUI;
  const params = new URLSearchParams(location.search);
  let savedLocation = '';
  try { savedLocation = localStorage.getItem('promoinfo-location') || ''; } catch {}
  const state = {
    query: params.get('busca') || '',
    category: params.get('categoria') || '',
    brand: params.get('marca') || '',
    unit: params.get('unidade') || (savedLocation && savedLocation !== 'Todos os shoppings' ? savedLocation : ''),
    sort: params.get('ordem') === 'ofertas' ? 'offers-desc' : (params.get('ordem') || 'relevance'),
    page: Math.max(1, Number(params.get('pagina') || 1)),
    perPage: 20
  };

  document.addEventListener('DOMContentLoaded', init);

  function init() {
    U.renderHeader('products');
    U.renderFooter();
    renderFilters();
    bindEvents();
    render();
    hydrateIcons(document);
  }

  function hydrateIcons(root) {
    root.querySelectorAll('[data-icon]').forEach((node) => { node.innerHTML = U.icon(node.dataset.icon); });
  }

  function publicProducts() {
    return D.products.filter((product) => U.getMinPrice(product));
  }

  function allUnits() {
    return [...new Set(publicProducts().flatMap((product) => U.getAllOffers(product).map((offer) => offer.unit)).filter(Boolean))].sort((a,b) => a.localeCompare(b,'pt-BR'));
  }

  function productText(product) {
    return U.normalize([
      product.name, product.brand, product.category,
      ...(product.variants || []).map((variant) => `${variant.label} ${variant.subtitle || ''}`),
      ...U.getAllOffers(product).map((offer) => `${offer.store} ${offer.unit} ${offer.location || ''}`)
    ].join(' '));
  }

  function filteredProducts() {
    const q = U.normalize(state.query);
    const list = publicProducts().filter((product) => {
      const offers = U.getAllOffers(product);
      return (!q || productText(product).includes(q)) &&
        (!state.category || product.category === state.category) &&
        (!state.brand || U.normalize(product.brand) === U.normalize(state.brand)) &&
        (!state.unit || offers.some((offer) => U.normalize(offer.unit) === U.normalize(state.unit)));
    });
    if (state.sort === 'offers-desc') list.sort((a,b) => U.getOfferCount(b)-U.getOfferCount(a));
    else if (state.sort === 'price-asc') list.sort((a,b) => U.getMinPrice(a)-U.getMinPrice(b));
    else if (state.sort === 'price-desc') list.sort((a,b) => U.getMinPrice(b)-U.getMinPrice(a));
    else if (state.sort === 'name') list.sort((a,b) => a.name.localeCompare(b.name,'pt-BR'));
    else list.sort((a,b) => U.getOfferCount(b)-U.getOfferCount(a) || a.name.localeCompare(b.name,'pt-BR'));
    return list;
  }

  function renderFilters() {
    document.getElementById('catalogSearch').value = state.query;
    document.getElementById('catalogSort').value = state.sort;
    document.getElementById('categoryFilters').innerHTML = U.marketplaceCategories().map((category) => filterButton('category', category.id, category.label, state.category === category.id, publicProducts().filter((product) => product.category === category.id).length)).join('');
    document.getElementById('brandFilters').innerHTML = U.activeProductBrands().map((brand) => filterButton('brand', brand.name, brand.name, U.normalize(state.brand) === U.normalize(brand.name))).join('');
    document.getElementById('unitFilters').innerHTML = allUnits().map((unit) => filterButton('unit', unit, unit, U.normalize(state.unit) === U.normalize(unit))).join('');
  }

  function filterButton(type, value, label, active, count = null) {
    return `<button class="${active ? 'active' : ''}" type="button" data-filter-type="${type}" data-filter-value="${U.escapeHtml(value)}"><span>${U.escapeHtml(label)}</span>${Number.isFinite(count) ? `<small>${count}</small>` : ''}</button>`;
  }

  function productCard(product) {
    const min = U.getMinPrice(product);
    const count = U.getOfferCount(product);
    const labels = (product.variants || []).map((variant) => variant.label).filter(Boolean).slice(0,3).join(' • ');
    return `<article class="product-card product-card-v3">
      <a class="product-media organic-media media-${U.escapeHtml(product.category)}" href="produto.html?id=${encodeURIComponent(product.id)}"><span class="product-badge">${count} ${count===1?'LOJA':'LOJAS'}</span><img src="${U.escapeHtml(U.assetForTheme(product.image))}" alt="${U.escapeHtml(product.name)}" loading="lazy" width="520" height="360" onerror="this.src='assets/hero-products-main.svg'"></a>
      <div class="product-body"><div class="product-meta"><span>${U.escapeHtml(product.brand || 'Tecnologia')}</span><span>${count} ofertas</span></div><h3><a href="produto.html?id=${encodeURIComponent(product.id)}">${U.escapeHtml(product.name)}</a></h3><div class="variant-line">${(product.variants||[]).length>1?`${product.variants.length} versões: `:'Versão: '}${U.escapeHtml(labels||'publicada')}</div><div class="price-line"><div><small>A partir de</small><strong>${U.money(min)}</strong></div><span class="unit-chip">${U.escapeHtml(cheapestUnit(product))}</span></div><a class="btn btn-primary full" href="produto.html?id=${encodeURIComponent(product.id)}">Ver ofertas</a></div>
    </article>`;
  }

  function cheapestUnit(product) {
    return U.getAllOffers(product).sort((a,b) => Number(a.price)-Number(b.price))[0]?.unit || 'Consulte';
  }

  function render() {
    const products = filteredProducts();
    const totalPages = Math.max(1, Math.ceil(products.length/state.perPage));
    if (state.page > totalPages) state.page = totalPages;
    const start = (state.page-1)*state.perPage;
    const pageItems = products.slice(start,start+state.perPage);
    const selectedCategory = D.categories.find((category) => category.id === state.category);
    document.getElementById('productGrid').innerHTML = pageItems.length ? pageItems.map(productCard).join('') : `<div class="empty-state">${U.icon('search')}<h3>${selectedCategory ? `Ainda não há anúncios em ${U.escapeHtml(selectedCategory.label)}` : 'Nenhum produto encontrado'}</h3><p>${selectedCategory ? 'A categoria já está disponível para os lojistas anunciarem. Veja outras categorias ou limpe o filtro.' : 'Altere os filtros ou busque por outro termo.'}</p>${selectedCategory ? '<button class="btn btn-secondary" id="emptyClearCategory" type="button">Ver todos os produtos</button>' : ''}</div>`;
    document.getElementById('emptyClearCategory')?.addEventListener('click', () => { state.category = ''; state.page = 1; renderFilters(); render(); });
    document.getElementById('resultsLabel').textContent = `${products.length.toLocaleString('pt-BR')} ${products.length===1?'produto encontrado':'produtos encontrados'}`;
    document.getElementById('productCount').textContent = publicProducts().length.toLocaleString('pt-BR');
    document.getElementById('offerCount').textContent = publicProducts().reduce((sum,product) => sum+U.getOfferCount(product),0).toLocaleString('pt-BR');
    document.getElementById('storeCount').textContent = (D.directoryStores?.length || D.stores?.length || 0).toLocaleString('pt-BR');
    const localCount = publicProducts().filter((product) => product.local).length;
    const meta = D.catalogMetadata || window.PROMOINFO_IMPORTED?.metadata || {};
    document.getElementById('catalogMetadata').textContent = localCount ? `${localCount} anúncio${localCount === 1 ? '' : 's'} local${localCount === 1 ? '' : 'is'} aprovado${localCount === 1 ? '' : 's'} • catálogo-base ativo` : (meta.generatedAt ? `Catálogo sincronizado em ${new Date(meta.generatedAt).toLocaleString('pt-BR')}` : 'Catálogo-base de apresentação');
    renderActiveFilters();
    renderPagination(totalPages);
    updateUrl();
  }

  function renderActiveFilters() {
    const chips = [];
    if (state.query) chips.push(['query',`Busca: ${state.query}`]);
    if (state.category) chips.push(['category',D.categories.find((category)=>category.id===state.category)?.label || state.category]);
    if (state.brand) chips.push(['brand',state.brand]);
    if (state.unit) chips.push(['unit',state.unit]);
    document.getElementById('activeFilters').innerHTML = chips.map(([type,label]) => `<button type="button" data-remove-filter="${type}">${U.escapeHtml(label)} ${U.icon('x')}</button>`).join('');
  }

  function renderPagination(totalPages) {
    const current = state.page;
    const pages = [];
    for (let page=Math.max(1,current-2); page<=Math.min(totalPages,current+2); page+=1) pages.push(page);
    document.getElementById('pagination').innerHTML = totalPages<=1 ? '' : `<button type="button" data-page="${current-1}" ${current===1?'disabled':''}>Anterior</button>${pages.map((page)=>`<button type="button" data-page="${page}" class="${page===current?'active':''}">${page}</button>`).join('')}<button type="button" data-page="${current+1}" ${current===totalPages?'disabled':''}>Próxima</button>`;
  }

  function updateUrl() {
    const url = new URL(location.href);
    [['busca',state.query],['categoria',state.category],['marca',state.brand],['unidade',state.unit],['ordem',state.sort],['pagina',state.page>1?String(state.page):'']].forEach(([key,value]) => value ? url.searchParams.set(key,value) : url.searchParams.delete(key));
    history.replaceState({},'',url);
  }

  function bindEvents() {
    document.getElementById('catalogSearch').addEventListener('input',(event)=>{state.query=event.target.value;state.page=1;render();});
    document.getElementById('catalogSort').addEventListener('change',(event)=>{state.sort=event.target.value;state.page=1;render();});
    document.querySelector('.catalog-sidebar-v3').addEventListener('click',(event)=>{
      const button=event.target.closest('[data-filter-type]'); if(!button)return;
      const type=button.dataset.filterType; const value=button.dataset.filterValue;
      state[type]=U.normalize(state[type])===U.normalize(value)?'':value; state.page=1; renderFilters(); render();
    });
    document.getElementById('activeFilters').addEventListener('click',(event)=>{
      const button=event.target.closest('[data-remove-filter]');if(!button)return;
      const type=button.dataset.removeFilter; state[type]=''; state.page=1; if(type==='query')document.getElementById('catalogSearch').value=''; renderFilters();render();
    });
    document.getElementById('clearFilters').addEventListener('click',()=>{state.query='';state.category='';state.brand='';state.unit='';state.page=1;document.getElementById('catalogSearch').value='';renderFilters();render();});
    document.getElementById('pagination').addEventListener('click',(event)=>{const button=event.target.closest('[data-page]');if(!button||button.disabled)return;state.page=Number(button.dataset.page);render();scrollTo({top:document.querySelector('.catalog-section-v3').offsetTop-110,behavior:'smooth'});});
    document.addEventListener('promoinfo:locationchange', (event) => {
      state.unit = event.detail.location === 'Todos os shoppings' ? '' : event.detail.location;
      state.page = 1;
      renderFilters();
      render();
    });
  }
})();
