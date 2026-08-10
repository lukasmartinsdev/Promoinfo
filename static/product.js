(() => {
  'use strict';
  const D = window.PROMOINFO_DATA;
  const U = window.PromoUI;
  const params = new URLSearchParams(window.location.search);
  const requestedId = params.get('id');
  const product = D.products.find((item) => item.id === requestedId) || D.products.find((item) => U.getMinPrice(item));
  let variantId = params.get('variant') || product?.variants?.[0]?.id;
  let sortMode = 'price';

  document.addEventListener('DOMContentLoaded', init);

  function init() {
    U.renderHeader('products');
    U.renderFooter();
    if (!product) return renderMissing();
    document.title = `${product.name} | PromoInfo Mix`;
    renderAll();
    document.getElementById('offerSort')?.addEventListener('change', (event) => { sortMode = event.target.value; renderOffers(); });
  }

  function renderMissing() {
    document.getElementById('productDetail').innerHTML = `<div class="empty-state">${U.icon('search')}<h2>Produto não encontrado</h2><p>Este produto pode ter sido removido ou ainda não foi aprovado.</p><a class="btn btn-primary" href="catalogo.html">Voltar ao catálogo</a></div>`;
    document.getElementById('breadcrumb').innerHTML = `<a href="index.html">Início</a><span>›</span><strong>Produto não encontrado</strong>`;
    document.getElementById('sponsoredOffer').innerHTML = '';
    document.getElementById('offersGrid').innerHTML = '';
    document.getElementById('relatedProducts').innerHTML = '';
  }

  function renderAll() {
    renderBreadcrumb();
    renderProduct();
    renderOffers();
    renderRelated();
  }

  function renderBreadcrumb() {
    const category = D.categories.find((item) => item.id === product.category)?.label || 'Produtos';
    document.getElementById('breadcrumb').innerHTML = `<a href="index.html">Início</a><span>›</span><a href="catalogo.html?categoria=${encodeURIComponent(product.category)}">${U.escapeHtml(category)}</a><span>›</span><strong>${U.escapeHtml(product.name)}</strong>`;
  }

  function currentVariant() {
    return product.variants.find((variant) => variant.id === variantId) || product.variants[0];
  }

  function renderProduct() {
    const variant = currentVariant();
    const offers = U.getOffers(product, variant.id);
    const min = offers[0]?.price;
    const max = offers.length ? offers[offers.length - 1].price : null;
    const description = product.description || variant.subtitle || '';
    document.getElementById('productDetail').innerHTML = `
      <div class="product-hero-media organic-media media-${U.escapeHtml(product.category)}">
        <div class="hero-media-badge">${offers.length} ${offers.length === 1 ? 'LOJA' : 'LOJAS'}</div>
        <img src="${U.escapeHtml(U.assetForTheme(product.image))}" alt="${U.escapeHtml(product.name)}" width="720" height="560" onerror="this.src='assets/hero-products-main.svg'">
      </div>
      <div class="product-hero-info">
        <div class="product-hero-top"><span class="brand-label">${U.escapeHtml(product.brand)}</span>${product.local ? '<span class="local-ad-label">ANÚNCIO DE LOJISTA</span>' : ''}</div>
        <h1>${U.escapeHtml(product.name)}</h1>
        <p class="variant-subtitle">${U.escapeHtml(variant.subtitle || '')}</p>
        <div class="variant-selector"><strong>Escolha a versão:</strong><div>${product.variants.map((item) => `<button class="variant-button ${item.id === variant.id ? 'active' : ''}" type="button" data-variant="${U.escapeHtml(item.id)}"><span>${U.escapeHtml(item.label)}</span><small>${U.getOffers(product, item.id).length} ofertas</small></button>`).join('')}</div></div>
        <div class="product-price-summary"><div><small>Menor preço encontrado</small><strong>${U.money(min)}</strong><span>${max && max !== min ? `Faixa até ${U.money(max)}` : 'Consulte disponibilidade'}</span></div><div class="summary-stat"><span>${U.icon('store')}</span><strong>${offers.length}</strong><small>lojas nesta versão</small></div><div class="summary-stat"><span>${U.icon('location')}</span><strong>${new Set(offers.map((offer) => offer.unit)).size}</strong><small>unidades disponíveis</small></div></div>
        <div class="product-hero-actions"><a class="btn btn-primary" href="#offersGrid">Comparar ofertas ${U.icon('arrow')}</a><a class="btn btn-secondary" href="catalogo.html?categoria=${encodeURIComponent(product.category)}">Ver produtos semelhantes</a></div>
        ${description ? `<div class="product-description-box"><strong>Descrição</strong><p>${U.escapeHtml(description)}</p>${product.warranty ? `<span>${U.icon('shield')} Garantia: ${U.escapeHtml(product.warranty)}</span>` : ''}</div>` : ''}
        <div class="product-disclaimer">${U.icon('info')}<span>Preços, estoque, condições e garantia devem ser confirmados com o lojista. A PromoInfo organiza anúncios de lojas físicas.</span></div>
      </div>`;
    document.querySelectorAll('[data-variant]').forEach((button) => button.addEventListener('click', () => {
      variantId = button.dataset.variant;
      const url = new URL(window.location.href); url.searchParams.set('variant', variantId); history.replaceState({}, '', url);
      renderProduct(); renderOffers();
    }));
  }

  function sortedOffers() {
    const offers = U.getOffers(product, currentVariant().id);
    if (sortMode === 'unit') offers.sort((a, b) => String(a.unit).localeCompare(String(b.unit), 'pt-BR') || Number(a.price) - Number(b.price));
    if (sortMode === 'store') offers.sort((a, b) => String(a.store).localeCompare(String(b.store), 'pt-BR'));
    return offers;
  }

  function renderOffers() {
    const offers = sortedOffers();
    const sponsored = offers.find((offer) => offer.sponsored);
    const prices = offers.map((offer) => Number(offer.price)).filter((price) => price > 0);
    const cheapestPrice = prices.length ? Math.min(...prices) : null;
    const sponsoredTarget = document.getElementById('sponsoredOffer');
    sponsoredTarget.innerHTML = sponsored ? `
      <article class="sponsored-strip">
        <div class="sponsored-icon">${U.icon('tag')}</div>
        <div><span>ANÚNCIO PATROCINADO</span><strong>${U.escapeHtml(sponsored.store)}</strong><small>${U.escapeHtml(sponsored.unit)} • ${U.escapeHtml(sponsored.location || '')}</small></div>
        <div class="sponsored-price"><small>Preço anunciado</small><strong>${U.money(sponsored.price)}</strong></div>
        ${sponsored.source ? `<a class="btn btn-primary" href="${U.escapeHtml(sponsored.source)}" ${sponsored.local ? '' : 'target="_blank" rel="noopener"'}>${sponsored.local ? 'Ver loja' : 'Ver anúncio'}</a>` : ''}
      </article>` : '';

    document.getElementById('offersGrid').innerHTML = offers.length ? offers.map((offer, index) => offerCard(offer, Number(offer.price) === cheapestPrice, index)).join('') : `<div class="empty-state">${U.icon('info')}<h3>Nenhuma oferta disponível</h3><p>Esta versão ainda não possui uma oferta válida.</p></div>`;
  }

  function offerCard(offer, cheapest, index) {
    const storeImage = U.getStoreAsset(offer.store);
    const initials = String(offer.store || 'Loja').split(/\s+/).slice(0, 2).map((part) => part[0]).join('').toUpperCase();
    const whatsapp = U.whatsappHref(offer.phone, `Olá! Vi a oferta de ${product.name} ${currentVariant().label} na PromoInfo Mix.`);
    const source = offer.source || '';
    const sourceLabel = offer.local ? 'Ver loja' : 'Ver anúncio';
    const contactButtons = [
      source ? `<a class="btn btn-primary" href="${U.escapeHtml(source)}" ${offer.local ? '' : 'target="_blank" rel="noopener"'}>${sourceLabel} ${U.icon(offer.local ? 'store' : 'external')}</a>` : '',
      whatsapp ? `<a class="btn btn-whatsapp" href="${whatsapp}" target="_blank" rel="noopener">${U.icon('whatsapp')} WhatsApp</a>` : ''
    ].filter(Boolean).join('');
    return `
      <article class="offer-card ${cheapest ? 'best-offer' : ''}">
        <div class="offer-store-media organic-media">
          ${storeImage ? `<img src="${U.escapeHtml(storeImage)}" alt="${U.escapeHtml(offer.store)}" width="420" height="260">` : `<div class="store-initials">${U.escapeHtml(initials)}</div>`}
          <div class="offer-badges">${cheapest ? '<span class="best-badge">MENOR PREÇO</span>' : ''}${offer.sponsored ? '<span class="sponsored-badge">PATROCINADO</span>' : ''}</div>
        </div>
        <div class="offer-card-body">
          <div class="offer-store-head"><div><h3>${U.escapeHtml(offer.store)}</h3><p>${U.icon('location')}${U.escapeHtml(offer.unit)}${offer.location ? ` • ${U.escapeHtml(offer.location)}` : ''}</p></div><span class="offer-position">#${index + 1}</span></div>
          <div class="offer-value"><small>${cheapest ? 'Melhor opção encontrada' : 'Preço anunciado'}</small><strong>${U.money(offer.price)}</strong><span>${U.escapeHtml(offer.installment || 'Consulte o lojista')}</span></div>
          <div class="offer-contact"><span>${U.icon('telephone')}${U.escapeHtml(offer.phone || 'Contato disponível no perfil da loja')}</span>${offer.stock ? `<span>${U.icon('box')}${U.escapeHtml(offer.stock)}</span>` : ''}${offer.warranty ? `<span>${U.icon('shield')}${U.escapeHtml(offer.warranty)}</span>` : ''}</div>
          <div class="offer-actions">${contactButtons || '<span class="contact-unavailable">Consulte a loja no diretório.</span>'}</div>
        </div>
      </article>`;
  }

  function renderRelated() {
    const related = D.products.filter((item) => item.id !== product.id && U.getMinPrice(item) && (item.category === product.category || item.brand === product.brand)).slice(0, 4);
    document.getElementById('relatedProducts').innerHTML = related.map((item) => {
      const count = U.getOfferCount(item); const min = U.getMinPrice(item);
      return `<article class="product-card compact"><a class="product-media organic-media media-${U.escapeHtml(item.category)}" href="produto.html?id=${encodeURIComponent(item.id)}"><span class="product-badge">${count} ${count === 1 ? 'LOJA' : 'LOJAS'}</span><img src="${U.escapeHtml(U.assetForTheme(item.image))}" alt="${U.escapeHtml(item.name)}" loading="lazy" width="520" height="360"></a><div class="product-body"><div class="product-meta"><span>${U.escapeHtml(item.brand)}</span><span>${count} ofertas</span></div><h3><a href="produto.html?id=${encodeURIComponent(item.id)}">${U.escapeHtml(item.name)}</a></h3><div class="price-line"><div><small>A partir de</small><strong>${U.money(min)}</strong></div></div><a class="btn btn-primary full" href="produto.html?id=${encodeURIComponent(item.id)}">Ver ofertas</a></div></article>`;
    }).join('') || `<div class="empty-state compact-empty">${U.icon('tag')}<h3>Sem produtos relacionados</h3><p>Explore outras categorias no catálogo.</p></div>`;
  }
})();
