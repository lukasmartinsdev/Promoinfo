(() => {
  'use strict';
  const U = window.PromoUI;
  const M = window.PromoMarketplace;
  let state = M.readState();

  document.addEventListener('DOMContentLoaded', init);

  function init() {
    U.renderHeader('admin');
    U.renderFooter();
    hydrateIcons(document);
    bindDashboard();
    refresh();
  }

  function hydrateIcons(root) {
    root.querySelectorAll('[data-icon]').forEach((node) => { node.innerHTML = U.icon(node.dataset.icon); });
  }


  function feedback(message = '', type = '') {
    const target = document.getElementById('adminFeedback');
    target.textContent = message;
    target.className = `form-feedback ${type ? `is-${type}` : ''}`;
  }



  function bindDashboard() {
    document.querySelector('.admin-nav nav').addEventListener('click', (event) => {
      const button = event.target.closest('[data-admin-view]');
      if (!button) return;
      const view = button.dataset.adminView;
      document.querySelectorAll('[data-admin-view]').forEach((item) => item.classList.toggle('active', item === button));
      document.querySelectorAll('[data-admin-section]').forEach((section) => section.classList.toggle('active', section.dataset.adminSection === view));
      feedback();
      window.scrollTo({ top: document.querySelector('.admin-section').offsetTop - 80, behavior: 'smooth' });
    });
    document.getElementById('adminMerchantSearch').addEventListener('input', renderMerchants);
    document.getElementById('adminMerchantStatus').addEventListener('change', renderMerchants);
    document.getElementById('adminProductSearch').addEventListener('input', renderProducts);
    document.getElementById('adminProductStatus').addEventListener('change', renderProducts);
    document.getElementById('adminMerchantList').addEventListener('click', handleMerchantAction);
    document.getElementById('adminProductList').addEventListener('click', handleProductAction);
    document.getElementById('adminPendingSummary').addEventListener('click', handlePendingAction);
    document.getElementById('exportBackupBtn').addEventListener('click', exportBackup);
    document.getElementById('importBackupInput').addEventListener('change', importBackup);
    document.getElementById('clearLocalDataBtn').addEventListener('click', clearData);
  }

  function refresh() {
    state = M.readState();
    renderMetrics();
    renderPending();
    renderMerchants();
    renderProducts();
    document.getElementById('pendingMerchantBadge').textContent = state.merchants.filter((item) => item.status === 'pending').length;
    document.getElementById('pendingProductBadge').textContent = state.products.filter((item) => item.status === 'pending').length;
  }

  function statusLabel(status) {
    return { pending: 'Em análise', approved: 'Aprovado', rejected: 'Recusado' }[status] || 'Em análise';
  }


  function accessStateLabel(enabled = true) {
    return enabled === false ? 'Login bloqueado' : 'Login ativo';
  }

  function renderMetrics() {
    const approvedMerchants = state.merchants.filter((item) => item.status === 'approved').length;
    const pendingMerchants = state.merchants.filter((item) => item.status === 'pending').length;
    const approvedProducts = state.products.filter((item) => item.status === 'approved').length;
    const pendingProducts = state.products.filter((item) => item.status === 'pending').length;
    document.getElementById('adminMetrics').innerHTML = [
      ['store', state.merchants.length, 'Logins de lojistas'], ['clock', pendingMerchants, 'Lojas pendentes'],
      ['tag', state.products.length, 'Produtos cadastrados'], ['check', approvedProducts, 'Produtos publicados']
    ].map(([icon,value,label]) => `<article><span>${U.icon(icon)}</span><div><strong>${value}</strong><small>${label}</small></div></article>`).join('');
  }

  function renderPending() {
    const merchants = state.merchants.filter((item) => item.status === 'pending').slice(0, 4);
    const products = state.products.filter((item) => item.status === 'pending').slice(0, 4);
    const items = [
      ...merchants.map((item) => ({ type: 'merchant', id: item.id, title: item.tradeName, subtitle: `${item.responsibleName} • ${item.unit}`, image: item.logo })),
      ...products.map((item) => ({ type: 'product', id: item.id, title: item.name, subtitle: `${item.brand} • ${merchantName(item.merchantId)}`, image: item.image }))
    ];
    document.getElementById('adminPendingSummary').innerHTML = items.length ? `<div class="admin-pending-list">${items.map((item) => `<article><div class="admin-pending-media">${item.image ? `<img src="${item.image}" alt="">` : `<span>${U.icon(item.type === 'merchant' ? 'store' : 'tag')}</span>`}</div><div><small>${item.type === 'merchant' ? 'LOJISTA' : 'PRODUTO'}</small><strong>${U.escapeHtml(item.title)}</strong><p>${U.escapeHtml(item.subtitle)}</p></div><button type="button" data-open-admin-item="${item.type}:${U.escapeHtml(item.id)}">Revisar ${U.icon('arrow')}</button></article>`).join('')}</div>` : `<div class="empty-state compact-empty">${U.icon('check')}<h3>Nenhuma pendência</h3><p>Todos os itens enviados já foram revisados.</p></div>`;
  }

  function merchantName(id) {
    return state.merchants.find((item) => item.id === id)?.tradeName || 'Loja não encontrada';
  }

  function initials(name = '') {
    return name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join('').toUpperCase() || 'LJ';
  }

  function filteredMerchants() {
    const q = U.normalize(document.getElementById('adminMerchantSearch').value);
    const status = document.getElementById('adminMerchantStatus').value;
    return state.merchants.filter((item) => (!status || item.status === status) && (!q || U.normalize(`${item.tradeName} ${item.responsibleName} ${item.email} ${item.unit}`).includes(q)));
  }

  function renderMerchants() {
    const list = filteredMerchants();
    document.getElementById('adminMerchantList').innerHTML = list.length ? `<div class="admin-review-list">${list.map((item) => merchantCard(item)).join('')}</div>` : empty('store', 'Nenhum lojista encontrado');
  }

  function merchantCard(item) {
    const media = item.logo ? `<img src="${item.logo}" alt="Logo ${U.escapeHtml(item.tradeName)}">` : `<span>${U.escapeHtml(initials(item.tradeName))}</span>`;
    const accessEnabled = item.accessEnabled !== false;
    return `<article class="admin-review-card merchant-review-card">
      <div class="admin-review-media">${media}</div>
      <div class="admin-review-main"><div><span class="status-pill status-${item.status}">${statusLabel(item.status)}</span><small>${new Date(item.createdAt).toLocaleDateString('pt-BR')}</small></div><h3>${U.escapeHtml(item.tradeName)}</h3><p>${U.escapeHtml(item.segment)} • ${U.escapeHtml(item.unit)} • ${U.escapeHtml(item.location)}</p><dl><div><dt>Responsável</dt><dd>${U.escapeHtml(item.responsibleName)}</dd></div><div><dt>Contato</dt><dd>${U.escapeHtml(item.email)} • ${U.escapeHtml(item.phone || 'Não informado')}</dd></div><div><dt>Documento</dt><dd>${U.escapeHtml(item.document)}</dd></div></dl><div class="login-permission-meta"><span class="status-pill ${accessEnabled ? 'status-approved' : 'status-inactive'}">${accessStateLabel(accessEnabled)}</span><small>Login: ${U.escapeHtml(item.email)}</small></div>${item.description ? `<small class="admin-description">${U.escapeHtml(item.description)}</small>` : ''}${item.reviewNote ? `<small class="review-note">Observação atual: ${U.escapeHtml(item.reviewNote)}</small>` : ''}</div>
      <div class="admin-review-actions admin-review-actions-merchant"><button class="approve" type="button" data-merchant-status="approved" data-id="${U.escapeHtml(item.id)}">${U.icon('check')} Aprovar</button><button class="reject" type="button" data-merchant-status="rejected" data-id="${U.escapeHtml(item.id)}">${U.icon('x')} Recusar</button><button type="button" data-merchant-status="pending" data-id="${U.escapeHtml(item.id)}">${U.icon('clock')} Reanalisar</button><button type="button" data-merchant-access="${accessEnabled ? 'disable' : 'enable'}" data-id="${U.escapeHtml(item.id)}">${U.icon(accessEnabled ? 'x' : 'shield')} ${accessEnabled ? 'Bloquear login' : 'Ativar login'}</button></div>
    </article>`;
  }

  function filteredProducts() {
    const q = U.normalize(document.getElementById('adminProductSearch').value);
    const status = document.getElementById('adminProductStatus').value;
    return state.products.filter((item) => (!status || item.status === status) && (!q || U.normalize(`${item.name} ${item.brand} ${merchantName(item.merchantId)}`).includes(q)));
  }

  function renderProducts() {
    const list = filteredProducts();
    document.getElementById('adminProductList').innerHTML = list.length ? `<div class="admin-review-list">${list.map((item) => productCard(item)).join('')}</div>` : empty('tag', 'Nenhum produto encontrado');
  }

  function productCard(item) {
    const offer = item.variants?.[0]?.offers?.[0] || {};
    const merchant = state.merchants.find((entry) => entry.id === item.merchantId);
    const canApprove = merchant?.status === 'approved';
    return `<article class="admin-review-card product-review-card">
      <div class="admin-review-media product"><img src="${U.escapeHtml(item.image || 'assets/hero-products-main.svg')}" alt="${U.escapeHtml(item.name)}"></div>
      <div class="admin-review-main"><div><span class="status-pill status-${item.status}">${statusLabel(item.status)}</span><small>${new Date(item.updatedAt).toLocaleDateString('pt-BR')}</small></div><h3>${U.escapeHtml(item.name)}</h3><p>${U.escapeHtml(item.brand)} • ${U.escapeHtml(item.model || 'Versão padrão')}</p><dl><div><dt>Loja</dt><dd>${U.escapeHtml(merchant?.tradeName || 'Não encontrada')} <span class="status-pill status-${merchant?.status || 'rejected'}">${statusLabel(merchant?.status)}</span></dd></div><div><dt>Preço</dt><dd>${U.money(offer.price)}</dd></div><div><dt>Estoque</dt><dd>${U.escapeHtml(offer.stock || item.stock || 'Não informado')}</dd></div></dl>${item.description ? `<small class="admin-description">${U.escapeHtml(item.description)}</small>` : ''}${item.reviewNote ? `<small class="review-note">Observação atual: ${U.escapeHtml(item.reviewNote)}</small>` : ''}${!canApprove ? `<small class="review-warning">A loja precisa estar aprovada antes deste produto.</small>` : ''}</div>
      <div class="admin-review-actions"><button class="approve" type="button" data-product-status="approved" data-id="${U.escapeHtml(item.id)}" ${canApprove ? '' : 'disabled'}>${U.icon('check')} Aprovar</button><button class="reject" type="button" data-product-status="rejected" data-id="${U.escapeHtml(item.id)}">${U.icon('x')} Recusar</button><button type="button" data-product-status="pending" data-id="${U.escapeHtml(item.id)}">${U.icon('clock')} Reanalisar</button></div>
    </article>`;
  }

  function empty(icon, title) {
    return `<div class="empty-state compact-empty">${U.icon(icon)}<h3>${title}</h3><p>Revise os filtros ou aguarde novos cadastros.</p></div>`;
  }

  function askNote(status) {
    if (status !== 'rejected') return '';
    return prompt('Informe o motivo da recusa ou os ajustes necessários:') || '';
  }

  function handleMerchantAction(event) {
    const statusButton = event.target.closest('[data-merchant-status]');
    const accessButton = event.target.closest('[data-merchant-access]');
    try {
      if (statusButton && !statusButton.disabled) {
        M.setMerchantStatus(statusButton.dataset.id, statusButton.dataset.merchantStatus, askNote(statusButton.dataset.merchantStatus));
        feedback(`Status do lojista alterado para ${statusLabel(statusButton.dataset.merchantStatus).toLowerCase()}.`, 'success');
        refresh();
        return;
      }
      if (accessButton && !accessButton.disabled) {
        const enabled = accessButton.dataset.merchantAccess === 'enable';
        M.setMerchantAccess(accessButton.dataset.id, enabled);
        feedback(`Permissão de login ${enabled ? 'ativada' : 'bloqueada'} com sucesso.`, 'success');
        refresh();
        return;
      }
    } catch (error) { feedback(error.message, 'error'); }
  }

  function handleProductAction(event) {
    const button = event.target.closest('[data-product-status]');
    if (!button || button.disabled) return;
    try {
      M.setProductStatus(button.dataset.id, button.dataset.productStatus, askNote(button.dataset.productStatus));
      feedback(`Status do produto alterado para ${statusLabel(button.dataset.productStatus).toLowerCase()}.`, 'success');
      refresh();
    } catch (error) { feedback(error.message, 'error'); }
  }

  function handlePendingAction(event) {
    const button = event.target.closest('[data-open-admin-item]');
    if (!button) return;
    const [type, id] = button.dataset.openAdminItem.split(':');
    const viewButton = document.querySelector(`[data-admin-view="${type === 'merchant' ? 'merchants' : 'products'}"]`);
    viewButton.click();
    const search = document.getElementById(type === 'merchant' ? 'adminMerchantSearch' : 'adminProductSearch');
    const item = type === 'merchant' ? state.merchants.find((entry) => entry.id === id) : state.products.find((entry) => entry.id === id);
    search.value = type === 'merchant' ? item?.tradeName || '' : item?.name || '';
    type === 'merchant' ? renderMerchants() : renderProducts();
  }

  function exportBackup() {
    const blob = new Blob([M.exportBackup()], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `promoinfo-backup-${new Date().toISOString().slice(0,10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
    feedback('Backup exportado.', 'success');
  }

  async function importBackup(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!confirm('Importar este backup substituirá todos os dados locais. Continuar?')) { event.target.value = ''; return; }
    try {
      M.importBackup(await file.text());
      feedback('Backup importado com sucesso.', 'success');
      refresh();
    } catch (error) { feedback(error.message, 'error'); }
    event.target.value = '';
  }

  function clearData() {
    if (!confirm('Esta ação apagará todos os lojistas, produtos e configurações locais. Continuar?')) return;
    if (!confirm('Confirme novamente: deseja apagar definitivamente os dados deste navegador?')) return;
    M.clearAllData();
    refresh();
    feedback('Dados locais removidos.', 'success');
  }

})();
