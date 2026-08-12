(() => {
  'use strict';
  const D = window.PROMOINFO_DATA;
  const U = window.PromoUI;
  const M = window.PromoMarketplace;
  let merchant = null;
  let products = [];
  let productImage = '';
  let profileLogo = '';

  document.addEventListener('DOMContentLoaded', init);

  async function init() {
    const session = M.getSession();
    if (!session || session.role !== 'merchant') return window.location.replace('lojista.html');
    if (session.remoteAuth && !await refreshRemoteSession()) {
      M.logout();
      return window.location.replace('lojista.html');
    }
    merchant = M.getMerchant(session.id);
    if (!merchant) { M.logout(); return window.location.replace('lojista.html'); }
    U.renderHeader('merchant');
    U.renderFooter();
    hydrateIcons(document);
    fillProductSelects();
    bindNavigation();
    bindActions();
    bindProfile();
    bindPassword();
    bindProductEditor();
    refresh();
    if (M.getSession()?.mustChangePassword) {
      openSecurityPanel();
      setPasswordChangeRequired(true);
      feedback('Troque a senha provisória antes de continuar.', 'info');
    }
  }

  function csrfToken() {
    const match = document.cookie.match(/(?:^|; )csrftoken=([^;]+)/);
    return match ? decodeURIComponent(match[1]) : '';
  }

  async function refreshRemoteSession() {
    try {
      const response = await fetch('/api/lojista/sessao/', { credentials: 'same-origin' });
      const result = await response.json().catch(() => ({}));
      if (!response.ok || !result.ok || !result.merchant) return false;
      M.adoptRemoteMerchant(result.merchant);
      return true;
    } catch {
      return false;
    }
  }

  function openSecurityPanel() {
    const button = document.querySelector('[data-panel-view="security"]');
    document.querySelectorAll('[data-panel-view]').forEach((item) => item.classList.toggle('active', item === button));
    document.querySelectorAll('[data-panel-section]').forEach((section) => section.classList.toggle('active', section.dataset.panelSection === 'security'));
  }

  function setPasswordChangeRequired(required) {
    document.querySelectorAll('[data-panel-view]').forEach((button) => {
      if (button.dataset.panelView !== 'security') button.disabled = required;
    });
  }

  function hydrateIcons(root) {
    root.querySelectorAll('[data-icon]').forEach((node) => { node.innerHTML = U.icon(node.dataset.icon); });
  }

  function feedback(message = '', type = '') {
    const target = document.getElementById('panelFeedback');
    target.textContent = message;
    target.className = `form-feedback ${type ? `is-${type}` : ''}`;
  }

  function productFeedback(message = '', type = '') {
    const target = document.getElementById('productFormFeedback');
    target.textContent = message;
    target.className = `form-feedback ${type ? `is-${type}` : ''}`;
  }

  function statusLabel(status) {
    return { pending: 'Em análise', approved: 'Aprovado', rejected: 'Recusado' }[status] || 'Em análise';
  }

  function initials(name = '') {
    return name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join('').toUpperCase() || 'LJ';
  }

  function refresh() {
    merchant = M.getMerchant(merchant.id);
    products = M.merchantProducts(merchant.id);
    document.getElementById('panelStoreName').textContent = merchant.tradeName;
    document.getElementById('panelStoreLocation').textContent = `${merchant.unit} • ${merchant.location}`;
    renderMiniProfile();
    renderStatus();
    renderMetrics();
    renderRecent();
    renderProducts();
    fillProfileForm();
  }

  function renderMiniProfile() {
    const media = merchant.logo ? `<img src="${merchant.logo}" alt="Logo ${U.escapeHtml(merchant.tradeName)}">` : `<span>${U.escapeHtml(initials(merchant.tradeName))}</span>`;
    document.getElementById('merchantMiniProfile').innerHTML = `<div>${media}</div><strong>${U.escapeHtml(merchant.tradeName)}</strong><small>${U.escapeHtml(merchant.email)}</small><span class="status-pill status-${merchant.status}">${statusLabel(merchant.status)}</span>`;
  }

  function renderStatus() {
    const config = {
      pending: { icon: 'clock', title: 'Cadastro em análise', text: 'Você já pode preparar seus produtos, mas eles só poderão ser aprovados depois da aprovação da loja.' },
      approved: { icon: 'check', title: 'Loja aprovada', text: 'Seu perfil pode aparecer no diretório e os produtos aprovados entram automaticamente no catálogo.' },
      rejected: { icon: 'info', title: 'Cadastro precisa de ajustes', text: merchant.reviewNote || 'Revise os dados da loja e salve novamente para reenviar.' }
    }[merchant.status];
    document.getElementById('merchantStatusBanner').innerHTML = `<article class="status-banner status-banner-${merchant.status}"><span>${U.icon(config.icon)}</span><div><strong>${config.title}</strong><p>${U.escapeHtml(config.text)}</p></div></article>`;
  }

  function renderMetrics() {
    const total = products.length;
    const approved = products.filter((item) => item.status === 'approved').length;
    const pending = products.filter((item) => item.status === 'pending').length;
    const rejected = products.filter((item) => item.status === 'rejected').length;
    document.getElementById('merchantMetrics').innerHTML = [
      ['tag', total, 'Produtos cadastrados'], ['check', approved, 'Aprovados'], ['clock', pending, 'Em análise'], ['info', rejected, 'Precisam de ajuste']
    ].map(([icon, value, label]) => `<article><span>${U.icon(icon)}</span><div><strong>${value}</strong><small>${label}</small></div></article>`).join('');
  }

  function productRow(product) {
    const offer = product.variants?.[0]?.offers?.[0] || {};
    return `<article class="merchant-product-row" data-product-id="${U.escapeHtml(product.id)}">
      <div class="merchant-product-thumb"><img src="${U.escapeHtml(product.image || 'assets/hero-products-main.svg')}" alt="${U.escapeHtml(product.name)}"></div>
      <div class="merchant-product-main"><div><span class="status-pill status-${product.status}">${statusLabel(product.status)}</span>${product.active === false ? '<span class="status-pill status-inactive">Inativo</span>' : ''}</div><h3>${U.escapeHtml(product.name)}</h3><p>${U.escapeHtml(product.brand)} • ${U.escapeHtml(product.model || D.categories.find((item) => item.id === product.category)?.label || product.category)}</p>${product.reviewNote ? `<small class="review-note">Observação: ${U.escapeHtml(product.reviewNote)}</small>` : ''}</div>
      <div class="merchant-product-price"><small>Preço</small><strong>${U.money(offer.price)}</strong><span>${U.escapeHtml(offer.stock || 'Consulte')}</span></div>
      <div class="merchant-product-actions"><button type="button" data-edit-product="${U.escapeHtml(product.id)}">${U.icon('tools')} Editar</button><button class="danger" type="button" data-delete-product="${U.escapeHtml(product.id)}">${U.icon('x')} Excluir</button></div>
    </article>`;
  }

  function renderRecent() {
    const recent = products.slice(0, 4);
    document.getElementById('recentProducts').innerHTML = recent.length ? `<div class="merchant-product-list">${recent.map(productRow).join('')}</div>` : emptyProducts();
  }

  function filteredProducts() {
    const q = U.normalize(document.getElementById('merchantProductSearch')?.value || '');
    const status = document.getElementById('merchantProductStatusFilter')?.value || '';
    return products.filter((product) => (!status || product.status === status) && (!q || U.normalize(`${product.name} ${product.brand} ${product.model || ''}`).includes(q)));
  }

  function renderProducts() {
    const list = filteredProducts();
    document.getElementById('merchantProductList').innerHTML = list.length ? `<div class="merchant-product-list">${list.map(productRow).join('')}</div>` : emptyProducts();
  }

  function emptyProducts() {
    return `<div class="empty-state compact-empty">${U.icon('tag')}<h3>Nenhum produto cadastrado</h3><p>Use o botão “Novo produto” para criar seu primeiro anúncio.</p></div>`;
  }

  function bindNavigation() {
    document.querySelector('.merchant-panel-nav nav').addEventListener('click', (event) => {
      const button = event.target.closest('[data-panel-view]');
      if (!button) return;
      const view = button.dataset.panelView;
      document.querySelectorAll('[data-panel-view]').forEach((item) => item.classList.toggle('active', item === button));
      document.querySelectorAll('[data-panel-section]').forEach((section) => section.classList.toggle('active', section.dataset.panelSection === view));
      feedback();
      window.scrollTo({ top: document.querySelector('.panel-section').offsetTop - 80, behavior: 'smooth' });
    });
  }

  function bindActions() {
    document.getElementById('merchantLogoutBtn').addEventListener('click', async () => {
      const session = M.getSession();
      if (session?.remoteAuth) {
        try {
          const csrf = csrfToken();
          await fetch('/api/lojista/sair/', {
            method: 'POST',
            headers: csrf ? { 'X-CSRFToken': csrf } : {},
            credentials: 'same-origin'
          });
        } catch {}
      }
      M.logout();
      window.location.replace('lojista.html');
    });
    document.querySelectorAll('[data-open-product-form]').forEach((button) => button.addEventListener('click', () => openProductEditor()));
    document.getElementById('merchantProductSearch').addEventListener('input', renderProducts);
    document.getElementById('merchantProductStatusFilter').addEventListener('change', renderProducts);
    document.querySelector('.merchant-panel-content').addEventListener('click', handleProductAction);
  }

  function handleProductAction(event) {
    const edit = event.target.closest('[data-edit-product]');
    const remove = event.target.closest('[data-delete-product]');
    if (edit) openProductEditor(products.find((item) => item.id === edit.dataset.editProduct));
    if (remove) {
      const product = products.find((item) => item.id === remove.dataset.deleteProduct);
      if (!product || !confirm(`Excluir o produto “${product.name}”?`)) return;
      M.deleteProduct(merchant.id, product.id);
      feedback('Produto excluído.', 'success');
      refresh();
    }
  }

  function fillProductSelects() {
    const activeCategories = D.categories.filter((item) => item.id !== 'all');
    document.getElementById('productCategory').innerHTML = `<option value="">Selecione</option>${activeCategories.map((item) => `<option value="${U.escapeHtml(item.id)}">${U.escapeHtml(item.label)}</option>`).join('')}`;
    const names = [...new Set([...D.brands.map((item) => item.name), ...D.products.map((item) => item.brand)].filter(Boolean))].sort((a,b) => a.localeCompare(b,'pt-BR'));
    document.getElementById('productBrand').innerHTML = `<option value="">Selecione</option>${names.map((name) => `<option>${U.escapeHtml(name)}</option>`).join('')}`;
  }

  function bindProductEditor() {
    const editor = document.getElementById('productEditor');
    editor.addEventListener('click', (event) => { if (event.target.closest('[data-close-product-editor]')) closeProductEditor(); });
    document.getElementById('productImageInput').addEventListener('change', async (event) => {
      const file = event.target.files?.[0];
      if (!file) return;
      try {
        productFeedback('Otimizando imagem…', 'info');
        productImage = await M.fileToOptimizedDataUrl(file, { maxBytes: M.MAX_PRODUCT_BYTES, maxWidth: 1200, maxHeight: 900, quality: 0.82 });
        document.querySelector('#productImagePreview img').src = productImage;
        productFeedback();
      } catch (error) {
        productFeedback(error.message, 'error');
        event.target.value = '';
      }
    });
    document.getElementById('merchantProductForm').addEventListener('submit', submitProduct);
  }

  function openProductEditor(product = null) {
    const form = document.getElementById('merchantProductForm');
    form.reset();
    form.elements.productId.value = product?.id || '';
    form.elements.active.checked = product?.active !== false;
    document.getElementById('productEditorTitle').textContent = product ? 'Editar produto' : 'Novo produto';
    productImage = product?.image || '';
    document.querySelector('#productImagePreview img').src = productImage || 'assets/hero-products-main.svg';
    if (product) {
      const offer = product.variants?.[0]?.offers?.[0] || {};
      form.elements.name.value = product.name || '';
      form.elements.brand.value = product.brand || '';
      form.elements.category.value = product.category || '';
      form.elements.model.value = product.model || product.variants?.[0]?.label || '';
      form.elements.sku.value = product.sku || '';
      form.elements.price.value = String(offer.price || '').replace('.', ',');
      form.elements.installment.value = offer.installment || '';
      form.elements.stock.value = product.stock || offer.stock || '';
      form.elements.warranty.value = product.warranty || offer.warranty || '';
      form.elements.description.value = product.description || product.variants?.[0]?.subtitle || '';
    }
    productFeedback();
    const editor = document.getElementById('productEditor');
    editor.classList.add('open');
    editor.setAttribute('aria-hidden', 'false');
    document.body.classList.add('no-scroll');
    setTimeout(() => form.elements.name.focus(), 100);
  }

  function closeProductEditor() {
    const editor = document.getElementById('productEditor');
    editor.classList.remove('open');
    editor.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('no-scroll');
  }

  async function submitProduct(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const existing = products.find((item) => item.id === data.get('productId'));
    if (!productImage && !existing?.image) return productFeedback('Selecione uma imagem do produto.', 'error');
    try {
      const saved = M.saveProduct(merchant.id, {
        name: data.get('name'), brand: data.get('brand'), category: data.get('category'), model: data.get('model'), sku: data.get('sku'),
        price: data.get('price'), installment: data.get('installment'), stock: data.get('stock'), warranty: data.get('warranty'),
        description: data.get('description'), image: productImage || existing?.image, active: data.get('active') === 'on'
      }, data.get('productId'));
      productFeedback(`“${saved.name}” foi enviado para análise.`, 'success');
      setTimeout(() => { closeProductEditor(); refresh(); feedback('Produto salvo e enviado para análise.', 'success'); }, 600);
    } catch (error) {
      productFeedback(error.message, 'error');
    }
  }

  function fillProfileForm() {
    const form = document.getElementById('merchantProfileForm');
    ['responsibleName','tradeName','legalName','document','email','phone','whatsapp','unit','location','segment','description'].forEach((key) => { if (form.elements[key]) form.elements[key].value = merchant[key] || ''; });
    profileLogo = merchant.logo || '';
    renderProfileLogo();
  }

  function renderProfileLogo() {
    document.getElementById('profileLogoPreview').innerHTML = profileLogo ? `<img src="${profileLogo}" alt="Logo da loja">` : `<span>${U.escapeHtml(initials(merchant.tradeName))}</span>`;
  }

  function bindProfile() {
    document.getElementById('profileLogoInput').addEventListener('change', async (event) => {
      const file = event.target.files?.[0];
      if (!file) return;
      try {
        profileLogo = await M.fileToOptimizedDataUrl(file, { maxBytes: M.MAX_LOGO_BYTES, maxWidth: 640, maxHeight: 420, quality: 0.86 });
        renderProfileLogo();
        feedback('Nova logo pronta. Salve as alterações para concluir.', 'info');
      } catch (error) {
        feedback(error.message, 'error');
      }
    });
    document.getElementById('merchantProfileForm').addEventListener('submit', (event) => {
      event.preventDefault();
      const data = new FormData(event.currentTarget);
      try {
        merchant = M.updateMerchant(merchant.id, {
          responsibleName: data.get('responsibleName'), tradeName: data.get('tradeName'), legalName: data.get('legalName'),
          document: data.get('document'), email: data.get('email'), phone: data.get('phone'), whatsapp: data.get('whatsapp'),
          unit: data.get('unit'), location: data.get('location'), segment: data.get('segment'), description: data.get('description'), logo: profileLogo
        });
        feedback('Dados da loja atualizados.', 'success');
        refresh();
      } catch (error) {
        feedback(error.message, 'error');
      }
    });
  }

  function bindPassword() {
    document.getElementById('merchantPasswordForm').addEventListener('submit', async (event) => {
      event.preventDefault();
      const form = event.currentTarget;
      const data = new FormData(form);
      if (data.get('newPassword') !== data.get('newPasswordConfirm')) return feedback('As novas senhas não coincidem.', 'error');
      try {
        if (M.getSession()?.remoteAuth) {
          const csrf = csrfToken();
          const response = await fetch('/api/lojista/senha/', {
            method: 'POST',
            headers: csrf ? { 'X-CSRFToken': csrf } : {},
            body: data,
            credentials: 'same-origin'
          });
          const result = await response.json().catch(() => ({ ok: false, error: 'Falha ao atualizar a senha.' }));
          if (!response.ok || !result.ok) throw new Error(result.error || 'Falha ao atualizar a senha.');
          merchant = M.adoptRemoteMerchant({ ...merchant, mustChangePassword: false });
          setPasswordChangeRequired(false);
        } else {
          await M.changePassword(merchant.id, data.get('currentPassword'), data.get('newPassword'));
        }
        form.reset();
        feedback('Senha atualizada com sucesso.', 'success');
      } catch (error) {
        feedback(error.message, 'error');
      }
    });
  }
})();
