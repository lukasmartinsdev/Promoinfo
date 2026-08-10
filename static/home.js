(() => {
  'use strict';
  const D = window.PROMOINFO_DATA;
  const U = window.PromoUI;
  document.addEventListener('DOMContentLoaded', init);
  function init(){U.renderHeader('home');U.renderFooter();renderCatalogProof();renderCategories();renderOfferSpotlight();renderBrands();renderStores();renderUnits();hydrateIcons(document)}
  function hydrateIcons(root){root.querySelectorAll('[data-icon]').forEach(n=>n.innerHTML=U.icon(n.dataset.icon))}
  function publicProducts(){return (D.products||[]).filter(p=>U.getMinPrice(p))}
  function renderCatalogProof(){const t=document.getElementById('catalogProof');if(t)t.textContent=`${publicProducts().length.toLocaleString('pt-BR')} produtos • ${(D.directoryStores?.length||D.stores?.length||0).toLocaleString('pt-BR')} lojas`}
  function renderCategories(){const target=document.getElementById('categoryGrid');const priority=['celular','computador','notebook','tablet','placa-video','processador','memoria','armazenamento','monitor','teclado','mouse','perifericos','audio','impressoras','rede','games','gabinete','placa-mae','fonte','refrigeracao','webcam','automacao','software','wearables','smart-home','seguranca','acessorios','servicos'];const cats=U.marketplaceCategories();const counts=publicProducts().reduce((a,p)=>(a[p.category]=(a[p.category]||0)+1,a),{});const ordered=[...priority.map(id=>cats.find(c=>c.id===id)).filter(Boolean),...cats.filter(c=>!priority.includes(c.id))];target.innerHTML=ordered.map(c=>{const n=counts[c.id]||0;return `<a class="pi-category-card" href="catalogo.html?categoria=${encodeURIComponent(c.id)}"><span class="pi-category-icon">${U.icon(U.iconNameForCategory(c.id))}</span><span class="pi-category-copy"><strong>${U.escapeHtml(c.homeLabel||c.label)}</strong><small>${n?`${n} ${n===1?'produto':'produtos'}`:'Disponível para anúncios'}</small></span></a>`}).join('')}

  function renderOfferSpotlight(){
    const target=document.getElementById('homeFlashOffers');
    if(!target)return;
    const ranked=[...publicProducts()]
      .sort((a,b)=>U.getOfferCount(b)-U.getOfferCount(a)||U.getMinPrice(a)-U.getMinPrice(b));
    const cycle=Math.floor(Date.now()/(24*60*60*1000));
    const offset=ranked.length ? cycle%ranked.length : 0;
    const rotated=ranked.length ? [...ranked.slice(offset),...ranked.slice(0,offset)] : [];
    const items=rotated.slice(0,Math.min(6,rotated.length));
    target.innerHTML=items.map(item=>{
      const min=U.getMinPrice(item);
      const count=U.getOfferCount(item);
      const offers=U.getAllOffers(item).sort((a,b)=>Number(a.price)-Number(b.price));
      const best=offers[0]||{};
      return `<article class="pi-flash-card"><a class="pi-flash-media" href="produto.html?id=${encodeURIComponent(item.id)}"><span class="pi-flash-badge">${count} ${count===1?'OFERTA':'OFERTAS'}</span><img src="${U.escapeHtml(U.assetForTheme(item.image))}" alt="${U.escapeHtml(item.name)}" loading="lazy"></a><div class="pi-flash-body"><div class="pi-flash-meta"><span>${U.escapeHtml(item.brand||'Tecnologia')}</span><span>${best.unit?U.escapeHtml(best.unit):'PromoInfo Mix'}</span></div><h3><a href="produto.html?id=${encodeURIComponent(item.id)}">${U.escapeHtml(item.name)}</a></h3><p>${best.store?`Menor oferta cadastrada em <strong>${U.escapeHtml(best.store)}</strong>.`:'Veja as lojas e compare as opções.'}</p><div class="pi-flash-price"><div><small>A partir de</small><strong>${U.money(min)}</strong></div><span>${best.location?U.escapeHtml(best.location):'Lojas físicas'}</span></div><a class="pi-button pi-button-primary pi-button-small" href="produto.html?id=${encodeURIComponent(item.id)}">Comparar ofertas <span data-icon="arrow"></span></a></div></article>`;
    }).join('');
    startOfferCountdown(items.length);
    initOfferCarousel(target);
    hydrateIcons(target);
  }

  function initOfferCarousel(target){
    const prev=document.querySelector('[data-offer-prev]');
    const next=document.querySelector('[data-offer-next]');
    const move=(direction)=>{
      const card=target.querySelector('.pi-flash-card');
      const distance=card ? card.getBoundingClientRect().width + 16 : 280;
      target.scrollBy({left:direction*distance*2,behavior:'smooth'});
    };
    prev?.addEventListener('click',()=>move(-1));
    next?.addEventListener('click',()=>move(1));
  }

  function startOfferCountdown(count){
    const timer=document.getElementById('homeOfferTimer');
    const meta=document.getElementById('homeOfferMeta');
    if(!timer)return;
    const cycleMs=24*60*60*1000;
    let deadline=(Math.floor(Date.now()/cycleMs)+1)*cycleMs;
    const update=()=>{
      let diff=Math.max(0,deadline-Date.now());
      if(diff<=0){window.location.reload();return;}
      const h=String(Math.floor(diff/3600000)).padStart(2,'0');
      const m=String(Math.floor((diff%3600000)/60000)).padStart(2,'0');
      const sec=String(Math.floor((diff%60000)/1000)).padStart(2,'0');
      timer.textContent=`${h}:${m}:${sec}`;
      if(meta) meta.textContent=`${count} produtos na seleção • atualiza a cada 24 horas`;
    };
    update();
    window.setInterval(update,1000);
  }

  function renderBrands(){
    const target=document.getElementById('brandsGrid');
    const wanted=['AMD','Apple','Intel','Kingston','Nintendo','NVIDIA','Xiaomi','Acer','AOC','ASUS','Canon','Corsair','Crucial','Dell','Epson','Gigabyte','HP','JBL','Lenovo','LG','Logitech','Microsoft','Motorola','MSI','Multilaser','Philips','Razer','Realme','Redragon','Samsung','SanDisk','Seagate','Sony','TP-Link','Fox Gamer'];
    const byName=new Map((D.brands||[]).map(b=>[U.normalize(b.name),b]));
    const brands=wanted.map(name=>byName.get(U.normalize(name))).filter(Boolean);
    target.innerHTML=brands.map(b=>{const c=`<img src="${U.escapeHtml(b.logo)}" alt="Logo ${U.escapeHtml(b.name)}" loading="lazy" width="160" height="60" onerror="this.hidden=true;this.nextElementSibling.hidden=false"><span hidden>${U.escapeHtml(b.name)}</span>`;return `<a class="pi-brand-card" href="catalogo.html?marca=${encodeURIComponent(b.name)}" style="--brand:${U.escapeHtml(b.color||'#071b35')}">${c}</a>`}).join('')
  }
  function stores(){return [
    ['Info Storm','Barra','Stand 134 · Térreo','assets/stores/info-storm.jpg','2134860683','Montagem e manutenção de computadores, notebooks e periféricos.',['PC Gamer','Notebooks','Periféricos']],
    ['Easy Tech','Tijuca','Stand 10 · Térreo','assets/stores/easy-tech.jpg','21964472035','Informática em geral, eletrônicos, acessórios e telefonia.',['Informática','Telefonia','Acessórios']],
    ['Espaço Games Tijuca','Tijuca','Stand 41 · Térreo','assets/stores/espaco-games.jpg','21981819745','Assistência técnica especializada em videogames e eletrônicos.',['Videogames','Assistência','Consoles']],
    ['Conect Shop','Barra','Lojas 112 e 113 · Térreo','assets/stores/conect-shop.jpg','21995335511','Acessórios para celular, tablets e produtos Apple, Xiaomi e outras marcas.',['Celulares','Apple','Xiaomi']],
    ['Mix Capas','Centro','Stand 14 · Térreo','assets/stores/mix-capas-local.jpg','21999249260','Capas, películas e acessórios para smartphones e tablets.',['Capas','Películas','Acessórios']],
    ['Home Cell Barra','Barra','Lojas 120/121 · Térreo','assets/stores/home-cell-barra-local.jpg','21999249260','Assistência técnica e acessórios para celulares e tablets.',['Assistência','Celulares','Acessórios']],
    ['Chip Soluções','Centro','Stand 22 · Térreo','assets/stores/chip-solucoes-local.jpg','21999249260','Peças e acessórios para informática com atendimento especializado.',['Informática','Peças','Acessórios']],
    ['Sorella Informática','Tijuca','Stand 17 · Térreo','assets/stores/sorella-informatica-local.jpg','21999249260','Soluções em informática, componentes e periféricos de qualidade.',['Informática','Componentes','Periféricos']]
  ]}
  function renderStores(){document.getElementById('featuredStores').innerHTML=stores().map(s=>{const [name,unit,location,image,phone,description,tags]=s;const wa=U.whatsappHref(phone,`Olá! Conheci a ${name} pela PromoInfo Mix.`);return `<article class="pi-store-card"><div class="pi-store-media"><img src="${image}" alt="${U.escapeHtml(name)}" loading="lazy"><span class="pi-store-unit">${unit}</span></div><div class="pi-store-body"><span class="pi-store-location">${location}</span><h3>${U.escapeHtml(name)}</h3><p>${U.escapeHtml(description)}</p><div class="pi-store-tags">${tags.map(t=>`<span>${t}</span>`).join('')}</div><div class="pi-store-actions"><a class="pi-store-button" href="/lojas.html?busca=${encodeURIComponent(name)}">Ver loja <span aria-hidden="true">→</span></a><a class="pi-store-whatsapp" href="${wa}" target="_blank" rel="noopener">${U.icon('whatsapp')}<span>WhatsApp</span></a></div></div></article>`}).join('')}

  function renderUnits(){
    const target=document.getElementById('homeUnits');
    if(!target||!D.units)return;
    target.innerHTML=D.units.map((unit)=>{
      const wa=U.whatsappHref('21999249260',`Olá! Gostaria de informações sobre a unidade ${unit.name} da PromoInfo.`);
      return `<article class="pi-unit-card"><div class="pi-unit-media"><img src="${U.escapeHtml(unit.image)}" alt="${U.escapeHtml(unit.name)}" loading="lazy"><span>${U.escapeHtml(unit.short||unit.name)}</span></div><div class="pi-unit-body"><h3>${U.escapeHtml(unit.name)}</h3><p>${U.escapeHtml(unit.description)}</p><div class="pi-unit-meta"><span>${U.icon('location')}${U.escapeHtml(unit.address)}</span><span>${U.icon('clock')}${U.escapeHtml(unit.hours)}</span></div><div class="pi-unit-actions"><a class="pi-unit-link" href="${U.escapeHtml(unit.maps)}" target="_blank" rel="noopener">Ver no mapa</a><a class="pi-unit-link pi-unit-link-wa" href="${wa}" target="_blank" rel="noopener">${U.icon('whatsapp')}WhatsApp</a></div></div></article>`
    }).join('')
  }
})();
