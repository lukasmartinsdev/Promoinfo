(() => {
  'use strict';
  const U = window.PromoUI;
  const M = window.PromoMarketplace;
  let logoData = '';

  document.addEventListener('DOMContentLoaded', init);

  function init() {
    U.renderHeader('merchant');
    U.renderFooter();
    hydrateIcons(document);
    const session = M.getSession();
    if (session?.role === 'merchant') window.location.replace('painel-lojista.html');
    bindTabs();
    bindForms();
    bindLogo();
  }

  function hydrateIcons(root) {
    root.querySelectorAll('[data-icon]').forEach((node) => { node.innerHTML = U.icon(node.dataset.icon); });
  }

  function feedback(message = '', type = '') {
    const target = document.getElementById('authFeedback');
    target.textContent = message;
    target.className = `form-feedback ${type ? `is-${type}` : ''}`;
  }

  function setBusy(form, busy) {
    form.querySelectorAll('button,input,select,textarea').forEach((element) => { element.disabled = busy; });
  }

  function bindTabs() {
    document.querySelector('.auth-tabs').addEventListener('click', (event) => {
      const button = event.target.closest('[data-auth-tab]');
      if (!button) return;
      const tab = button.dataset.authTab;
      document.querySelectorAll('[data-auth-tab]').forEach((item) => item.classList.toggle('active', item === button));
      document.querySelectorAll('[data-auth-panel]').forEach((panel) => panel.classList.toggle('active', panel.dataset.authPanel === tab));
      feedback();
    });
  }

  function bindLogo() {
    document.getElementById('merchantLogoInput').addEventListener('change', async (event) => {
      const file = event.target.files?.[0];
      if (!file) return;
      try {
        logoData = await M.fileToOptimizedDataUrl(file, { maxBytes: M.MAX_LOGO_BYTES, maxWidth: 640, maxHeight: 420, quality: 0.86 });
        const preview = document.getElementById('merchantLogoPreview');
        preview.hidden = false;
        preview.innerHTML = `<img src="${logoData}" alt="Prévia da logo"><button type="button" id="removeLogoBtn">Remover</button>`;
        document.getElementById('removeLogoBtn').addEventListener('click', () => {
          logoData = '';
          event.target.value = '';
          preview.hidden = true;
          preview.innerHTML = '';
        });
      } catch (error) {
        feedback(error.message, 'error');
        event.target.value = '';
      }
    });
  }

  async function securityChallenge(form, username = '') {
    const payload = new FormData();
    const csrf = form.querySelector('[name="csrfmiddlewaretoken"]')?.value || '';
    const recaptcha = form.querySelector('[name="g-recaptcha-response"]')?.value || '';
    const honeypot = form.querySelector('[name="website"]')?.value || '';
    payload.append('username', username);
    payload.append('website', honeypot);
    if (recaptcha) payload.append('g-recaptcha-response', recaptcha);
    const response = await fetch('/api/auth/challenge/', { method: 'POST', headers: csrf ? { 'X-CSRFToken': csrf } : {}, body: payload, credentials: 'same-origin' });
    const result = await response.json().catch(() => ({ ok: false, error: 'Falha na verificação de segurança.' }));
    if (!response.ok || !result.ok) throw new Error(result.error || 'Falha na verificação de segurança.');
    return result;
  }

  function resetRecaptcha(form) {
    if (!window.grecaptcha || !window.promoinfoRecaptchaWidgets) return;
    const key = form.id === 'merchantLoginForm' ? 'login' : 'register';
    const widgetId = window.promoinfoRecaptchaWidgets[key];
    if (widgetId !== undefined) {
      try { window.grecaptcha.reset(widgetId); } catch {}
    }
  }

  function bindForms() {
    document.getElementById('merchantLoginForm').addEventListener('submit', async (event) => {
      event.preventDefault();
      const form = event.currentTarget;
      const data = new FormData(form);
      feedback('Validando acesso…', 'info');
      setBusy(form, true);
      try {
        await securityChallenge(form, data.get('email'));
        await M.login(data.get('email'), data.get('password'));
        feedback('Acesso confirmado. Abrindo o painel…', 'success');
        window.location.replace('painel-lojista.html');
      } catch (error) {
        feedback(error.message, 'error');
        resetRecaptcha(form)
        setBusy(form, false);
      }
    });

    document.getElementById('merchantRegisterForm').addEventListener('submit', async (event) => {
      event.preventDefault();
      const form = event.currentTarget;
      const data = new FormData(form);
      if (data.get('password') !== data.get('passwordConfirm')) return feedback('As senhas não coincidem.', 'error');
      feedback('Criando cadastro…', 'info');
      setBusy(form, true);
      try {
        await securityChallenge(form, data.get('email'));
        await M.registerMerchant({
          responsibleName: data.get('responsibleName'),
          tradeName: data.get('tradeName'),
          legalName: data.get('legalName'),
          document: data.get('document'),
          email: data.get('email'),
          phone: data.get('phone'),
          whatsapp: data.get('whatsapp'),
          unit: data.get('unit'),
          location: data.get('location'),
          segment: data.get('segment'),
          description: data.get('description'),
          logo: logoData,
          password: data.get('password')
        });
        feedback('Cadastro criado. Abrindo o painel…', 'success');
        window.location.replace('painel-lojista.html');
      } catch (error) {
        feedback(error.message, 'error');
        resetRecaptcha(form)
        setBusy(form, false);
      }
    });
  }
})();
