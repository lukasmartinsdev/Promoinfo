(() => {
  'use strict';

  const STORAGE_KEY = 'promoinfo-marketplace-v1';
  const SESSION_KEY = 'promoinfo-session-v1';
  const MAX_LOGO_BYTES = 450 * 1024;
  const MAX_PRODUCT_BYTES = 1100 * 1024;

  function emptyState() {
    return { version: 2, merchants: [], products: [], settings: {}, updatedAt: new Date().toISOString() };
  }


  function ensureStateShape(input) {
    const base = { ...emptyState(), ...(input || {}) };
    base.settings = { ...(base.settings || {}) };
    base.merchants = Array.isArray(base.merchants) ? base.merchants.map((merchant) => ({
      ...merchant,
      accessEnabled: merchant?.accessEnabled !== false,
      accessRole: 'merchant'
    })) : [];
    base.products = Array.isArray(base.products) ? base.products : [];
    return base;
  }

  function readState() {
    try {
      const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
      return ensureStateShape(parsed);
    } catch {
      return ensureStateShape(emptyState());
    }
  }

  function writeState(state) {
    const normalized = { ...ensureStateShape(state), updatedAt: new Date().toISOString() };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
    return normalized;
  }

  function updateState(mutator) {
    const state = readState();
    const result = mutator(state) || state;
    return writeState(result);
  }

  function uid(prefix = 'id') {
    if (crypto?.randomUUID) return `${prefix}-${crypto.randomUUID()}`;
    return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  }

  function normalize(value = '') {
    return String(value).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
  }

  async function legacyHashPassword(value) {
    const bytes = new TextEncoder().encode(String(value || ''));
    const digest = await crypto.subtle.digest('SHA-256', bytes);
    return Array.from(new Uint8Array(digest)).map((byte) => byte.toString(16).padStart(2, '0')).join('');
  }

  function newPasswordSalt() {
    const bytes = crypto.getRandomValues(new Uint8Array(16));
    return Array.from(bytes).map((byte) => byte.toString(16).padStart(2, '0')).join('');
  }

  async function hashPassword(value, salt = '') {
    if (!salt) return legacyHashPassword(value);
    const material = await crypto.subtle.importKey('raw', new TextEncoder().encode(String(value || '')), 'PBKDF2', false, ['deriveBits']);
    const saltBytes = new Uint8Array((salt.match(/.{1,2}/g) || []).map((hex) => parseInt(hex, 16)));
    const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt: saltBytes, iterations: 210000 }, material, 256);
    return Array.from(new Uint8Array(bits)).map((byte) => byte.toString(16).padStart(2, '0')).join('');
  }

  function validateEmail(value) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || '').trim());
  }

  function digits(value = '') {
    return String(value).replace(/\D/g, '');
  }

  function validateDocument(value) {
    const clean = digits(value);
    return clean.length === 11 || clean.length === 14;
  }

  function getSession() {
    try { return JSON.parse(localStorage.getItem(SESSION_KEY) || 'null'); } catch { return null; }
  }

  function setSession(session) {
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    return session;
  }

  function logout() {
    localStorage.removeItem(SESSION_KEY);
  }


  async function login(email, password) {
    const mail = normalize(email);
    const hash = await hashPassword(password);
    const state = readState();
    const merchant = state.merchants.find((item) => normalize(item.email) === mail);
    if (!merchant) throw new Error('E-mail ou senha inválidos.');
    const candidate = merchant.passwordSalt ? await hashPassword(password, merchant.passwordSalt) : hash;
    if (candidate !== merchant.passwordHash) throw new Error('E-mail ou senha inválidos.');
    if (merchant.accessEnabled === false) throw new Error('Este login foi temporariamente desativado pelo administrador.');
    if (!merchant.passwordSalt) {
      const salt = newPasswordSalt();
      merchant.passwordSalt = salt;
      merchant.passwordHash = await hashPassword(password, salt);
      merchant.updatedAt = new Date().toISOString();
      writeState(state);
    }
    return setSession({ role: 'merchant', id: merchant.id, merchantId: merchant.id, email: merchant.email, loginAt: new Date().toISOString() });
  }

  async function registerMerchant(input) {
    const state = readState();
    const email = String(input.email || '').trim();
    if (!validateEmail(email)) throw new Error('Informe um e-mail válido.');
    if (state.merchants.some((item) => normalize(item.email) === normalize(email))) throw new Error('Já existe um cadastro com este e-mail.');
    if (!validateDocument(input.document)) throw new Error('Informe um CPF ou CNPJ válido com 11 ou 14 dígitos.');
    if (String(input.password || '').length < 10) throw new Error('A senha deve ter pelo menos 10 caracteres.');
    const merchant = {
      id: uid('merchant'),
      responsibleName: String(input.responsibleName || '').trim(),
      tradeName: String(input.tradeName || '').trim(),
      legalName: String(input.legalName || '').trim(),
      document: digits(input.document),
      email,
      phone: digits(input.phone),
      whatsapp: digits(input.whatsapp || input.phone),
      unit: String(input.unit || '').trim(),
      location: String(input.location || '').trim(),
      segment: String(input.segment || '').trim(),
      description: String(input.description || '').trim(),
      logo: String(input.logo || ''),
      status: 'pending',
      reviewNote: '',
      passwordSalt: newPasswordSalt(),
      passwordHash: '',
      accessEnabled: true,
      accessRole: 'merchant',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    merchant.passwordHash = await hashPassword(input.password, merchant.passwordSalt);
    if (!merchant.responsibleName || !merchant.tradeName || !merchant.unit || !merchant.location || !merchant.segment) throw new Error('Preencha todos os campos obrigatórios.');
    updateState((current) => { current.merchants.push(merchant); return current; });
    setSession({ role: 'merchant', id: merchant.id, email: merchant.email, loginAt: new Date().toISOString() });
    return merchant;
  }

  function getMerchant(id) {
    return readState().merchants.find((item) => item.id === id) || null;
  }

  function currentMerchant() {
    const session = getSession();
    return session?.role === 'merchant' ? getMerchant(session.id) : null;
  }

  function updateMerchant(id, patch) {
    let updated = null;
    updateState((state) => {
      const index = state.merchants.findIndex((item) => item.id === id);
      if (index < 0) throw new Error('Cadastro não encontrado.');
      const allowed = ['responsibleName','tradeName','legalName','document','email','phone','whatsapp','unit','location','segment','description','logo'];
      const cleanPatch = {};
      allowed.forEach((key) => { if (key in patch) cleanPatch[key] = String(patch[key] || '').trim(); });
      if (cleanPatch.document && !validateDocument(cleanPatch.document)) throw new Error('CPF ou CNPJ inválido.');
      if (cleanPatch.email && !validateEmail(cleanPatch.email)) throw new Error('E-mail inválido.');
      if (cleanPatch.document) cleanPatch.document = digits(cleanPatch.document);
      if (cleanPatch.phone) cleanPatch.phone = digits(cleanPatch.phone);
      if (cleanPatch.whatsapp) cleanPatch.whatsapp = digits(cleanPatch.whatsapp);
      updated = { ...state.merchants[index], ...cleanPatch, status: state.merchants[index].status === 'rejected' ? 'pending' : state.merchants[index].status, updatedAt: new Date().toISOString() };
      state.merchants[index] = updated;
      return state;
    });
    return updated;
  }

  async function changePassword(id, currentPassword, newPassword) {
    if (String(newPassword || '').length < 10) throw new Error('A nova senha deve ter pelo menos 10 caracteres.');
    const state = readState();
    const merchant = state.merchants.find((item) => item.id === id);
    if (!merchant) throw new Error('Cadastro não encontrado.');
    const currentHash = await hashPassword(currentPassword, merchant.passwordSalt || '');
    if (merchant.passwordHash !== currentHash) throw new Error('Senha atual incorreta.');
    if (String(newPassword || '').length < 10) throw new Error('A nova senha deve ter pelo menos 10 caracteres.');
    const nextSalt = newPasswordSalt();
    const nextHash = await hashPassword(newPassword, nextSalt);
    updateState((current) => {
      const item = current.merchants.find((entry) => entry.id === id);
      item.passwordSalt = nextSalt;
      item.passwordHash = nextHash;
      item.updatedAt = new Date().toISOString();
      return current;
    });
  }

  function productFromInput(input, merchant, existing = null) {
    const price = Number(String(input.price || '').replace(',', '.'));
    if (!Number.isFinite(price) || price <= 0) throw new Error('Informe um preço válido.');
    const id = existing?.id || uid('local-product');
    const variantId = existing?.variants?.[0]?.id || `${id}-default`;
    const source = `lojas.html?loja=${encodeURIComponent(merchant.id)}`;
    return {
      id,
      merchantId: merchant.id,
      category: String(input.category || '').trim(),
      brand: String(input.brand || '').trim(),
      name: String(input.name || '').trim(),
      image: String(input.image || existing?.image || 'assets/hero-products-main.svg'),
      model: String(input.model || '').trim(),
      sku: String(input.sku || '').trim(),
      description: String(input.description || '').trim(),
      warranty: String(input.warranty || '').trim(),
      stock: String(input.stock || '').trim(),
      status: 'pending',
      active: input.active !== false,
      reviewNote: '',
      local: true,
      createdAt: existing?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      variants: [{
        id: variantId,
        label: String(input.model || 'Padrão').trim() || 'Padrão',
        subtitle: String(input.description || '').trim(),
        offers: [{
          store: merchant.tradeName,
          unit: merchant.unit,
          location: merchant.location,
          phone: merchant.whatsapp || merchant.phone,
          price,
          installment: String(input.installment || '').trim() || 'Consulte as condições',
          source,
          local: true,
          merchantId: merchant.id,
          stock: String(input.stock || '').trim(),
          warranty: String(input.warranty || '').trim(),
          sponsored: false
        }]
      }]
    };
  }

  function saveProduct(merchantId, input, productId = '') {
    const state = readState();
    const merchant = state.merchants.find((item) => item.id === merchantId);
    if (!merchant) throw new Error('Lojista não encontrado.');
    if (!input.name || !input.category || !input.brand) throw new Error('Preencha nome, categoria e marca.');
    const existing = productId ? state.products.find((item) => item.id === productId && item.merchantId === merchantId) : null;
    const product = productFromInput(input, merchant, existing);
    updateState((current) => {
      const index = current.products.findIndex((item) => item.id === product.id && item.merchantId === merchantId);
      if (index >= 0) current.products[index] = product;
      else current.products.push(product);
      return current;
    });
    return product;
  }

  function deleteProduct(merchantId, productId) {
    updateState((state) => {
      state.products = state.products.filter((item) => !(item.id === productId && item.merchantId === merchantId));
      return state;
    });
  }

  function merchantProducts(merchantId) {
    return readState().products.filter((item) => item.merchantId === merchantId).sort((a,b) => new Date(b.updatedAt) - new Date(a.updatedAt));
  }

  function setMerchantStatus(id, status, reviewNote = '') {
    if (!['pending','approved','rejected'].includes(status)) throw new Error('Status inválido.');
    updateState((state) => {
      const merchant = state.merchants.find((item) => item.id === id);
      if (!merchant) throw new Error('Lojista não encontrado.');
      merchant.status = status;
      merchant.reviewNote = String(reviewNote || '').trim();
      merchant.updatedAt = new Date().toISOString();
      if (status !== 'approved') state.products.forEach((product) => { if (product.merchantId === id && product.status === 'approved') product.status = 'pending'; });
      return state;
    });
  }

  function setMerchantAccess(id, enabled) {
    updateState((state) => {
      const merchant = state.merchants.find((item) => item.id === id);
      if (!merchant) throw new Error('Login não encontrado.');
      merchant.accessEnabled = enabled !== false;
      merchant.updatedAt = new Date().toISOString();
      return state;
    });
  }


  function setProductStatus(id, status, reviewNote = '') {
    if (!['pending','approved','rejected'].includes(status)) throw new Error('Status inválido.');
    updateState((state) => {
      const product = state.products.find((item) => item.id === id);
      if (!product) throw new Error('Produto não encontrado.');
      const merchant = state.merchants.find((item) => item.id === product.merchantId);
      if (status === 'approved' && merchant?.status !== 'approved') throw new Error('Aprove primeiro o cadastro do lojista.');
      product.status = status;
      product.reviewNote = String(reviewNote || '').trim();
      product.updatedAt = new Date().toISOString();
      return state;
    });
  }

  function exportBackup() {
    return JSON.stringify({ exportedAt: new Date().toISOString(), application: 'PromoInfo Mix', data: readState() }, null, 2);
  }

  function importBackup(payload) {
    const parsed = typeof payload === 'string' ? JSON.parse(payload) : payload;
    const data = parsed?.data || parsed;
    if (!data || !Array.isArray(data.merchants) || !Array.isArray(data.products)) throw new Error('Arquivo de backup inválido.');
    writeState(data);
    return readState();
  }



  function clearAllData() {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(SESSION_KEY);
  }

  function dataUrlBytes(dataUrl = '') {
    const base64 = String(dataUrl).split(',')[1] || '';
    return Math.ceil(base64.length * 0.75);
  }

  function fileToOptimizedDataUrl(file, options = {}) {
    const maxBytes = options.maxBytes || MAX_PRODUCT_BYTES;
    const maxWidth = options.maxWidth || 1200;
    const maxHeight = options.maxHeight || 900;
    const quality = options.quality || 0.82;
    if (!file?.type?.startsWith('image/')) return Promise.reject(new Error('Selecione um arquivo de imagem.'));
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = () => reject(new Error('Não foi possível ler a imagem.'));
      reader.onload = () => {
        const image = new Image();
        image.onerror = () => reject(new Error('Imagem inválida.'));
        image.onload = () => {
          const ratio = Math.min(1, maxWidth / image.width, maxHeight / image.height);
          const width = Math.max(1, Math.round(image.width * ratio));
          const height = Math.max(1, Math.round(image.height * ratio));
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const context = canvas.getContext('2d');
          context.fillStyle = '#ffffff';
          context.fillRect(0, 0, width, height);
          context.drawImage(image, 0, 0, width, height);
          let result = canvas.toDataURL('image/webp', quality);
          if (dataUrlBytes(result) > maxBytes) result = canvas.toDataURL('image/jpeg', 0.68);
          if (dataUrlBytes(result) > maxBytes) return reject(new Error(`A imagem continua muito grande. Use um arquivo menor que ${Math.round(maxBytes / 1024)} KB.`));
          resolve(result);
        };
        image.src = reader.result;
      };
      reader.readAsDataURL(file);
    });
  }

  function mergeIntoCatalog() {
    const D = window.PROMOINFO_DATA;
    if (!D || D.__localMarketplaceMerged) return;
    const brandAssets = {
      AOC: 'assets/brands/aoc.svg', Logitech: 'assets/brands/logitech.svg', Microsoft: 'assets/brands/microsoft.svg', SanDisk: 'assets/brands/sandisk.svg',
      Philips: 'assets/brands/philips.svg', Nintendo: 'assets/brands/nintendo.svg', Realme: 'assets/brands/realme.svg', Gigabyte: 'assets/brands/gigabyte.svg',
      Epson: 'assets/brands/epson.svg', Canon: 'assets/brands/canon.svg', Multilaser: 'assets/brands/multilaser.svg', Redragon: 'assets/brands/redragon.svg',
      Crucial: 'assets/brands/crucial.svg', Zotac: 'assets/brands/zotac.svg', 'Fox Gamer': 'assets/brands/fox-gamer.svg'
    };
    Object.entries(brandAssets).forEach(([name, logo]) => {
      const brand = (D.brands || []).find((item) => normalize(item.name) === normalize(name));
      if (brand) brand.logo = logo;
      else D.brands.push({ name, logo, color: '#ff5a00' });
    });
    const state = readState();
    const approvedMerchants = state.merchants.filter((item) => item.status === 'approved');
    const merchantMap = new Map(approvedMerchants.map((item) => [item.id, item]));
    const approvedProducts = state.products.filter((item) => item.status === 'approved' && item.active !== false && merchantMap.has(item.merchantId));

    approvedMerchants.forEach((merchant) => {
      const store = {
        id: merchant.id,
        name: merchant.tradeName,
        unit: merchant.unit,
        location: merchant.location,
        phone: merchant.phone,
        whatsapp: merchant.whatsapp || merchant.phone,
        image: merchant.logo || '',
        since: new Date(merchant.createdAt).toLocaleDateString('pt-BR'),
        description: merchant.description || `Loja de ${merchant.segment}.`,
        specialties: [merchant.segment].filter(Boolean),
        source: `lojas.html?loja=${encodeURIComponent(merchant.id)}`,
        local: true
      };
      if (!D.stores.some((item) => item.id === store.id)) D.stores.push(store);
      if (!D.directoryStores.some((item) => String(item.id) === String(store.id))) {
        D.directoryStores.push({ id: store.id, unit: store.unit, name: store.name, location: store.location, phone: store.phone, sourceUrl: store.source, image: store.image, local: true, status: 'Lojista cadastrado' });
      }
    });

    approvedProducts.forEach((product) => {
      const merchant = merchantMap.get(product.merchantId);
      const copy = JSON.parse(JSON.stringify(product));
      copy.variants.forEach((variant) => variant.offers.forEach((offer) => {
        offer.store = merchant.tradeName;
        offer.unit = merchant.unit;
        offer.location = merchant.location;
        offer.phone = merchant.whatsapp || merchant.phone;
        offer.source = `lojas.html?loja=${encodeURIComponent(merchant.id)}`;
      }));
      const index = D.products.findIndex((item) => item.id === copy.id);
      if (index >= 0) D.products[index] = copy;
      else D.products.push(copy);
    });

    D.__localMarketplaceMerged = true;
  }

  mergeIntoCatalog();

  window.PromoMarketplace = {
    STORAGE_KEY,
    SESSION_KEY,
    MAX_LOGO_BYTES,
    MAX_PRODUCT_BYTES,
    readState,
    writeState,
    updateState,
    getSession,
    setSession,
    logout,
    login,
    registerMerchant,
    getMerchant,
    currentMerchant,
    updateMerchant,
    changePassword,
    saveProduct,
    deleteProduct,
    merchantProducts,
    setMerchantStatus,
    setMerchantAccess,
    setProductStatus,
    exportBackup,
    importBackup,
    clearAllData,
    fileToOptimizedDataUrl,
    mergeIntoCatalog,
    validateEmail,
    validateDocument,
    digits,
    normalize,
    uid
  };
})();
