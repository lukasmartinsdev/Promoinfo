(() => {
  'use strict';
  const D = window.PROMOINFO_DATA;
  const U = window.PromoUI;
  document.addEventListener('DOMContentLoaded', () => {
    U.renderHeader('rent'); U.renderFooter();
    document.getElementById('rentUnits').innerHTML = D.units.map((unit) => `<article class="rent-unit-card-v3"><div class="rent-unit-media-v3"><img src="${U.escapeHtml(unit.image)}" alt="${U.escapeHtml(unit.name)}"><span>${U.escapeHtml(unit.short)}</span></div><div class="rent-unit-body-v3"><h3>${U.escapeHtml(unit.name)}</h3><p>${U.escapeHtml(unit.description)}</p><div><span>${U.icon('location')}${U.escapeHtml(unit.address)}</span><span>${U.icon('clock')}${U.escapeHtml(unit.hours)}</span></div><a class="btn btn-secondary full" href="${unit.maps}" target="_blank" rel="noopener">Ver no mapa</a></div></article>`).join('');
    document.getElementById('rentForm').addEventListener('submit', (event) => {
      event.preventDefault(); const data = new FormData(event.currentTarget);
      const text = `Olá! Gostaria de receber informações para alugar uma loja ou stand na PromoInfo.\n\nNome: ${data.get('nome')}\nEmpresa/marca: ${data.get('empresa')}\nSegmento: ${data.get('segmento')}\nUnidade: ${data.get('unidade')}\nMensagem: ${data.get('mensagem') || 'Não informada'}`;
      window.open(U.whatsappHref('21999249260', text), '_blank', 'noopener');
    });
    document.querySelectorAll('[data-icon]').forEach((node) => { node.innerHTML = U.icon(node.dataset.icon); });
  });
})();
