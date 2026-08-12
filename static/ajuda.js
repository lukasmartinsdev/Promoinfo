(() => {
  'use strict';

  document.addEventListener('DOMContentLoaded', () => {
    const UI = window.PromoUI;
    UI?.renderHeader('help');
    UI?.renderFooter();

    const search = document.getElementById('faqSearch');
    const categoryButtons = [...document.querySelectorAll('[data-faq-category]')];
    const items = [...document.querySelectorAll('[data-faq-item]')];
    const resultCount = document.getElementById('faqResultCount');
    const emptyState = document.getElementById('faqEmptyState');
    const expandButton = document.getElementById('faqExpandAll');
    let activeCategory = 'all';

    const normalize = (value) => UI?.normalize
      ? UI.normalize(value)
      : String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

    function visibleItems() {
      return items.filter((item) => !item.hidden);
    }

    function syncExpandButton() {
      const visible = visibleItems();
      const allOpen = visible.length > 0 && visible.every((item) => item.open);
      expandButton.textContent = allOpen ? 'Recolher respostas' : 'Expandir respostas';
      expandButton.setAttribute('aria-pressed', String(allOpen));
    }

    function filterFaq() {
      const term = normalize(search?.value);
      let count = 0;

      items.forEach((item) => {
        const categories = String(item.dataset.category || '').split(' ');
        const matchesCategory = activeCategory === 'all' || categories.includes(activeCategory);
        const matchesTerm = !term || normalize(item.textContent).includes(term);
        item.hidden = !(matchesCategory && matchesTerm);
        if (!item.hidden) count += 1;
      });

      resultCount.textContent = `${count} ${count === 1 ? 'resposta encontrada' : 'respostas encontradas'}`;
      emptyState.hidden = count !== 0;
      syncExpandButton();
    }

    search?.addEventListener('input', filterFaq);

    categoryButtons.forEach((button) => {
      button.addEventListener('click', () => {
        activeCategory = button.dataset.faqCategory || 'all';
        categoryButtons.forEach((item) => {
          const selected = item === button;
          item.classList.toggle('is-active', selected);
          item.setAttribute('aria-pressed', String(selected));
        });
        filterFaq();
      });
    });

    expandButton?.addEventListener('click', () => {
      const visible = visibleItems();
      const shouldOpen = visible.some((item) => !item.open);
      visible.forEach((item) => { item.open = shouldOpen; });
      syncExpandButton();
    });

    items.forEach((item) => item.addEventListener('toggle', syncExpandButton));

    document.getElementById('openAnaFromHelp')?.addEventListener('click', () => {
      document.querySelector('.promo-assistant-trigger')?.click();
    });

    filterFaq();
  });
})();
