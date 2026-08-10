(() => {
  'use strict';
  const D = window.PROMOINFO_DATA;
  const U = window.PromoUI;
  const parts = D.parts;
  const partKeys = Object.keys(parts);
  const requiredCount = partKeys.filter((key) => parts[key].required).length;
  const state = { build: {}, activeType: '', query: '', sort: 'price' };

  const imageMap = {
    r5500: 'assets/products/processed/396658.png', r5700g: 'assets/products/processed/ryzen-7-5700g.png', r8600g: 'assets/products/processed/394535.png',
    rtx3050: 'assets/products/processed/rtx-3050-6gb.png', rtx3060: 'assets/products/processed/rtx-3060-12gb.png', rtx4060ti: 'assets/products/processed/379473.png',
    'a400-240': 'assets/products/processed/kingston-a400-240.png', 'a400-960': 'assets/products/processed/kingston-a400-960.png', 'nv3-1tb': 'assets/products/processed/kingston-nv3-1tb.png'
  };

  document.addEventListener('DOMContentLoaded', init);

  function init() {
    U.renderHeader('builder'); U.renderFooter(); hydrateIcons(document);
    restoreBuild(); renderConfiguration(); bindEvents();
  }

  function hydrateIcons(root) {
    root.querySelectorAll('[data-icon]').forEach((node) => { node.innerHTML = U.icon(node.dataset.icon); });
  }

  function restoreBuild() {
    let savedName = '';
    try { state.build = JSON.parse(localStorage.getItem('promoinfo-build') || '{}') || {}; savedName = localStorage.getItem('promoinfo-build-name') || ''; } catch { state.build = {}; }
    if (savedName) document.getElementById('buildName').value = savedName;
  }

  function partIcon(type) {
    const map = { cpu: 'cpu', motherboard: 'cpu', ram: 'memory', gpu: 'gpu', storage: 'ssd', psu: 'power', case: 'box' };
    return map[type] || 'cpu';
  }

  function renderConfiguration() {
    const list = document.getElementById('configList');
    list.innerHTML = partKeys.map((type, index) => configRow(type, index)).join('');
    updateSummary();
  }

  function configRow(type, index) {
    const config = parts[type]; const selected = state.build[type]; const check = selected ? compatibility(type, selected) : { ok: true };
    const media = selected ? optionMedia(selected, type, 'small') : `<div class="empty-part-icon">${U.icon(partIcon(type))}</div>`;
    return `
      <article class="config-row ${selected ? 'is-selected' : ''} ${!check.ok ? 'has-error' : ''}">
        <div class="config-step"><span>${String(index + 1).padStart(2, '0')}</span><small>${config.required ? 'OBRIGATÓRIO' : 'OPCIONAL'}</small></div>
        <div class="config-media organic-media">${media}</div>
        <div class="config-info"><span class="config-type">${U.escapeHtml(config.label)}</span>${selected ? `<h3>${U.escapeHtml(selected.name)}</h3><p>${U.escapeHtml(selected.store)} • ${technicalSummary(selected)}</p><div class="config-status ${check.ok ? 'ok' : 'error'}">${U.icon(check.ok ? 'check' : 'info')}${U.escapeHtml(check.reason)}</div>` : `<h3>Nenhuma peça selecionada</h3><p>Escolha uma opção para continuar a montagem.</p>`}</div>
        <div class="config-price">${selected ? `<small>A partir de</small><strong>${U.money(selected.price)}</strong>` : '<small>Selecione</small><strong>—</strong>'}</div>
        <div class="config-actions"><button class="btn ${selected ? 'btn-secondary' : 'btn-primary'}" type="button" data-open-part="${type}">${selected ? 'Trocar peça' : 'Escolher peça'} ${U.icon(selected ? 'refresh' : 'plus')}</button>${selected ? `<button class="remove-part" type="button" data-remove-part="${type}" aria-label="Remover ${U.escapeHtml(config.label)}">${U.icon('x')}</button>` : ''}</div>
      </article>`;
  }

  function optionMedia(option, type, size = '') {
    const image = imageMap[option.id];
    return image ? `<img class="part-image ${size}" src="${U.escapeHtml(U.assetForTheme(image))}" alt="${U.escapeHtml(option.name)}">` : `<div class="part-vector ${size}">${U.icon(partIcon(type))}<span>${U.escapeHtml(shortLabel(option.name))}</span></div>`;
  }

  function shortLabel(name) {
    return name.split(/\s+/).slice(0, 3).join(' ');
  }

  function technicalSummary(option) {
    const details = [];
    if (option.socket) details.push(option.socket);
    if (option.memory) details.push(option.memory);
    if (option.capacity) details.push(`${option.capacity}W`);
    if (option.watts) details.push(`${option.watts}W TDP`);
    return details.join(' • ') || 'Oferta publicada';
  }

  function compatibility(type, option) {
    const cpu = state.build.cpu; const motherboard = state.build.motherboard; const ram = state.build.ram;
    if (type === 'motherboard' && cpu && option.socket && cpu.socket && option.socket !== cpu.socket) return { ok: false, reason: `Socket ${option.socket} incompatível com o processador ${cpu.socket}.` };
    if (type === 'cpu' && motherboard && option.socket && motherboard.socket && option.socket !== motherboard.socket) return { ok: false, reason: `Processador ${option.socket} incompatível com a placa-mãe ${motherboard.socket}.` };
    if (type === 'ram' && motherboard && option.memory && motherboard.memory && option.memory !== motherboard.memory) return { ok: false, reason: `${option.memory} incompatível com a placa-mãe ${motherboard.memory}.` };
    if (type === 'motherboard' && ram && option.memory && ram.memory && option.memory !== ram.memory) return { ok: false, reason: `Placa-mãe ${option.memory} incompatível com a memória ${ram.memory}.` };
    if (type === 'psu') {
      const minimum = estimatedWatts() + 120;
      if (option.capacity && option.capacity < minimum) return { ok: false, reason: `Fonte abaixo da recomendação de ${minimum}W.` };
    }
    return { ok: true, reason: 'Compatível com a configuração atual.' };
  }

  function estimatedWatts() {
    return Object.entries(state.build).filter(([type]) => type !== 'psu').reduce((sum, [, option]) => sum + Number(option?.watts || 0), 0);
  }

  function openSelection(type) {
    state.activeType = type; state.query = ''; state.sort = 'price';
    document.getElementById('selectionTitle').textContent = parts[type].label;
    document.getElementById('selectionSubtitle').textContent = type === 'motherboard' && state.build.cpu ? `Mostrando opções compatíveis com ${state.build.cpu.socket}.` : 'Opções compatíveis com a configuração atual.';
    document.getElementById('optionSearch').value = '';
    document.getElementById('optionSort').value = 'price';
    renderOptions();
    const drawer = document.getElementById('selectionDrawer'); drawer.classList.add('open'); drawer.setAttribute('aria-hidden', 'false'); document.body.classList.add('no-scroll');
  }

  function closeSelection() {
    const drawer = document.getElementById('selectionDrawer'); drawer.classList.remove('open'); drawer.setAttribute('aria-hidden', 'true'); document.body.classList.remove('no-scroll');
  }

  function renderOptions() {
    const type = state.activeType; if (!type) return;
    let options = [...parts[type].options];
    const query = U.normalize(state.query);
    options = options.filter((option) => !query || U.normalize(`${option.name} ${option.store} ${technicalSummary(option)}`).includes(query));
    options.sort(state.sort === 'name' ? (a, b) => a.name.localeCompare(b.name, 'pt-BR') : (a, b) => Number(a.price) - Number(b.price));
    document.getElementById('optionGrid').innerHTML = options.map((option) => optionCard(type, option)).join('') || `<div class="empty-state">${U.icon('search')}<h3>Nenhuma opção encontrada</h3></div>`;
  }

  function optionCard(type, option) {
    const result = compatibility(type, option); const selected = state.build[type]?.id === option.id;
    return `
      <article class="part-option-card ${!result.ok ? 'disabled' : ''} ${selected ? 'selected' : ''}">
        <div class="part-option-media organic-media">${optionMedia(option, type)}</div>
        <div class="part-option-body"><span class="option-store">${U.escapeHtml(option.store)}</span><h3>${U.escapeHtml(option.name)}</h3><p>${U.escapeHtml(technicalSummary(option))}</p><div class="option-compatibility ${result.ok ? 'ok' : 'error'}">${U.icon(result.ok ? 'check' : 'info')}<span>${U.escapeHtml(result.reason)}</span></div><div class="option-bottom"><div><small>A partir de</small><strong>${U.money(option.price)}</strong></div><button type="button" data-select-option="${U.escapeHtml(option.id)}" ${result.ok ? '' : 'disabled'}>${selected ? 'Selecionada' : 'Selecionar'}</button></div><a class="source-link" href="${option.source}" target="_blank" rel="noopener">Ver anúncio original ${U.icon('external')}</a></div>
      </article>`;
  }

  function selectOption(optionId) {
    const type = state.activeType; const option = parts[type].options.find((item) => item.id === optionId); if (!option || !compatibility(type, option).ok) return;
    state.build[type] = option;
    if (type === 'cpu' && state.build.motherboard && state.build.motherboard.socket !== option.socket) delete state.build.motherboard;
    if (type === 'motherboard') {
      if (state.build.cpu && state.build.cpu.socket !== option.socket) delete state.build.cpu;
      if (state.build.ram && state.build.ram.memory !== option.memory) delete state.build.ram;
    }
    if (state.build.psu && !compatibility('psu', state.build.psu).ok) delete state.build.psu;
    saveBuild(); closeSelection(); renderConfiguration(); U.showToast(`${option.name} adicionada à configuração.`);
  }

  function saveBuild() {
    try {
      localStorage.setItem('promoinfo-build', JSON.stringify(state.build));
      localStorage.setItem('promoinfo-build-name', document.getElementById('buildName').value.trim() || 'Meu PC PromoInfo');
    } catch {}
  }

  function updateSummary() {
    const selected = partKeys.filter((type) => state.build[type]);
    const requiredSelected = partKeys.filter((type) => parts[type].required && state.build[type]).length;
    const total = selected.reduce((sum, type) => sum + Number(state.build[type].price || 0), 0);
    const watts = estimatedWatts(); const psu = state.build.psu; const capacity = psu?.capacity || 0;
    const percent = Math.round((requiredSelected / requiredCount) * 100);
    const issues = selected.map((type) => compatibility(type, state.build[type])).filter((result) => !result.ok);
    document.getElementById('progressLabel').textContent = `${requiredSelected} de ${requiredCount} componentes obrigatórios`;
    document.getElementById('progressPercent').textContent = `${percent}%`;
    document.getElementById('progressFill').style.width = `${percent}%`;
    document.getElementById('summaryCount').textContent = `${selected.length}/${partKeys.length}`;
    document.getElementById('chosenCount').textContent = selected.length;
    document.getElementById('buildTotal').textContent = U.money(total) === 'Consulte' ? 'R$ 0,00' : U.money(total);
    document.getElementById('buildWatts').textContent = watts;
    document.getElementById('psuCapacity').textContent = capacity || '—';
    const energyPercent = capacity ? Math.min(100, Math.round((watts / capacity) * 100)) : Math.min(100, Math.round((watts / 650) * 100));
    const energyFill = document.getElementById('energyFill'); energyFill.style.width = `${energyPercent}%`; energyFill.className = capacity && watts > capacity * .8 ? 'danger' : watts > 0 ? 'active' : '';
    document.getElementById('energyHint').textContent = !watts ? 'A recomendação de fonte aparecerá conforme você selecionar as peças.' : capacity ? `${watts}W estimados em uma fonte de ${capacity}W. Recomendamos manter margem de segurança.` : `Consumo atual estimado em ${watts}W. Escolha uma fonte com pelo menos ${watts + 120}W.`;
    const status = document.getElementById('compatibilityStatus');
    if (issues.length) status.innerHTML = `${U.icon('info')}<div><strong>Revise a compatibilidade</strong><small>${U.escapeHtml(issues[0].reason)}</small></div>`;
    else if (requiredSelected === requiredCount) status.innerHTML = `${U.icon('check')}<div><strong>Configuração pronta</strong><small>Todos os componentes obrigatórios foram selecionados.</small></div>`;
    else if (selected.length) status.innerHTML = `${U.icon('shield')}<div><strong>Compatível até aqui</strong><small>Continue escolhendo as peças obrigatórias.</small></div>`;
    else status.innerHTML = `${U.icon('shield')}<div><strong>Pronto para começar</strong><small>Escolha o processador para liberar a compatibilidade.</small></div>`;
    const name = document.getElementById('buildName').value.trim() || 'Meu PC PromoInfo'; document.getElementById('summaryBuildName').textContent = name;
    document.getElementById('summarySelected').innerHTML = selected.length ? selected.map((type) => `<div class="summary-piece"><span>${U.icon(partIcon(type))}</span><div><small>${U.escapeHtml(parts[type].label)}</small><strong>${U.escapeHtml(state.build[type].name)}</strong></div><b>${U.money(state.build[type].price)}</b></div>`).join('') : '<div class="summary-empty">As peças escolhidas aparecerão aqui.</div>';
  }

  function bindEvents() {
    document.getElementById('configList').addEventListener('click', (event) => {
      const open = event.target.closest('[data-open-part]'); if (open) openSelection(open.dataset.openPart);
      const remove = event.target.closest('[data-remove-part]'); if (remove) { delete state.build[remove.dataset.removePart]; saveBuild(); renderConfiguration(); }
    });
    document.getElementById('selectionDrawer').addEventListener('click', (event) => {
      if (event.target.closest('[data-close-selection]')) closeSelection();
      const option = event.target.closest('[data-select-option]'); if (option) selectOption(option.dataset.selectOption);
    });
    document.getElementById('optionSearch').addEventListener('input', (event) => { state.query = event.target.value; renderOptions(); });
    document.getElementById('optionSort').addEventListener('change', (event) => { state.sort = event.target.value; renderOptions(); });
    document.getElementById('buildName').addEventListener('input', updateSummary);
    document.getElementById('saveBuildBtn').addEventListener('click', () => { saveBuild(); U.showToast('Configuração salva neste navegador.'); });
    document.getElementById('resetBuildBtn').addEventListener('click', () => { if (confirm('Limpar toda a configuração?')) { state.build = {}; saveBuild(); renderConfiguration(); } });
    document.getElementById('compareBuildBtn').addEventListener('click', () => {
      if (!Object.keys(state.build).length) return U.showToast('Escolha pelo menos uma peça para comparar.');
      const stores = [...new Set(Object.values(state.build).map((item) => item.store))]; U.showToast(`Sua configuração reúne ofertas de ${stores.length} ${stores.length === 1 ? 'loja' : 'lojas'}.`);
    });
    document.getElementById('requestQuoteBtn').addEventListener('click', () => {
      const selected = Object.entries(state.build); if (!selected.length) return U.showToast('Escolha as peças antes de solicitar orçamento.');
      const text = selected.map(([type, option]) => `${parts[type].label}: ${option.name} — ${U.money(option.price)} (${option.store})`).join('\n');
      window.open(U.whatsappHref('21999249260', `Olá! Gostaria de solicitar orçamento para esta configuração:\n${text}`), '_blank', 'noopener');
    });
  }
})();
