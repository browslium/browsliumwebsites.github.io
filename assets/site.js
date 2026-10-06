(() => {
  const slug = { en:'en', es:'es', ru:'ru', yi:'yi', he:'he', 'pt-BR':'pt-br', fr:'fr' };
  const notice = {
    en:['Browslium is available in English.','View in English','Continue here'],
    es:['Browslium está disponible en Español.','Ver en Español','Continuar aquí'],
    ru:['Browslium доступен на русском языке.','Перейти на русский','Остаться здесь'],
    yi:['Browslium איז אויך דאָ אויף ייִדיש.','זען אויף ייִדיש','בלײַבן דאָ'],
    he:['Browslium זמין בעברית.','מעבר לעברית','להישאר כאן'],
    'pt-BR':['O Browslium está disponível em português.','Ver em português','Continuar aqui'],
    fr:['Browslium est disponible en français.','Voir en français','Rester ici']
  };
  const current = document.body.dataset.locale || 'en';
  const page = document.body.dataset.page || '';
  const choiceKey = 'browslium_language_manual';
  const promptedKey = 'browslium_language_prompted';
  const safeGet = key => { try { return localStorage.getItem(key); } catch { return null; } };
  const safeSet = (key,value) => { try { localStorage.setItem(key,value); } catch {} };
  const languageOf = value => {
    const x = String(value || '').toLowerCase();
    if (x === 'pt' || x.startsWith('pt-')) return 'pt-BR';
    if (x === 'he' || x.startsWith('he-') || x === 'iw' || x.startsWith('iw-')) return 'he';
    if (x === 'yi' || x.startsWith('yi-') || x === 'ji' || x.startsWith('ji-')) return 'yi';
    const prefix = x.split('-')[0];
    return ['en','es','ru','fr'].includes(prefix) ? prefix : null;
  };
  document.querySelectorAll('[data-language-choice]').forEach(link => {
    const target = link.dataset.languageChoice;
    if (page) link.href = `/${slug[target]}/${page}/`;
    link.addEventListener('click', () => safeSet(choiceKey,target));
  });

  const suggestion = document.querySelector('[data-language-suggestion]');
  const manual = safeGet(choiceKey);
  const detected = manual && slug[manual] ? manual : ((navigator.languages || [navigator.language]).map(languageOf).find(Boolean) || 'en');
  const showSuggestion = !manual && !safeGet(promptedKey) && (document.body.dataset.gateway === 'true' || current === 'en') && detected !== 'en' && detected !== current;
  if (suggestion && showSuggestion) {
    const [message,view,stay] = notice[detected];
    suggestion.querySelector('[data-suggestion-message]').textContent = message;
    const link = suggestion.querySelector('[data-suggestion-link]');
    link.textContent = view;
    link.href = `/${slug[detected]}/${page ? `${page}/` : ''}`;
    link.lang = detected;
    link.dir = ['he','yi'].includes(detected) ? 'rtl' : 'ltr';
    link.addEventListener('click', () => { safeSet(choiceKey,detected); safeSet(promptedKey,'1'); });
    const dismiss = suggestion.querySelector('[data-suggestion-dismiss]');
    dismiss.textContent = stay;
    dismiss.addEventListener('click', () => { suggestion.hidden = true; safeSet(promptedKey,'1'); });
    suggestion.hidden = false;
  }

  if (document.body.dataset.gateway === 'true' && manual && slug[manual]) {
    const preferred = document.querySelector(`[data-language-choice="${manual}"]`);
    if (preferred) {
      preferred.classList.add('is-recommended');
      preferred.parentElement.prepend(preferred);
      const message = document.querySelector('[data-preferred-message]');
      if (message) {
        message.textContent = `Your saved language: ${preferred.childNodes[0].textContent.trim()}`;
        message.hidden = false;
      }
    }
  }
  const menuButton = document.querySelector('.menu-toggle');
  const mobileNav = document.querySelector('#mobile-nav');
  menuButton?.addEventListener('click', () => {
    const open = menuButton.getAttribute('aria-expanded') !== 'true';
    menuButton.setAttribute('aria-expanded',String(open));
    mobileNav.hidden = !open;
  });
  mobileNav?.querySelectorAll('a').forEach(link => link.addEventListener('click', () => {
    mobileNav.hidden = true;
    menuButton?.setAttribute('aria-expanded','false');
  }));
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape') {
      document.querySelectorAll('details.language-menu[open]').forEach(x => x.open = false);
      if (mobileNav && !mobileNav.hidden) { mobileNav.hidden = true; menuButton?.setAttribute('aria-expanded','false'); menuButton?.focus(); }
    }
  });
  document.addEventListener('click', event => {
    document.querySelectorAll('details.language-menu[open]').forEach(x => { if (!x.contains(event.target)) x.open = false; });
  });

  const demoCard = document.querySelector('.is-filtered');
  document.querySelectorAll('[data-demo-effect]').forEach(button => button.addEventListener('click', () => {
    document.querySelectorAll('[data-demo-effect]').forEach(x => x.setAttribute('aria-pressed',String(x===button)));
    if (demoCard) demoCard.dataset.effect = button.dataset.demoEffect;
  }));
  const tabs = [...document.querySelectorAll('[data-level-tab]')];
  const chooseTab = tab => {
    tabs.forEach(x => {
      const active = x===tab;
      x.setAttribute('aria-selected',String(active));
      x.tabIndex = active ? 0 : -1;
      const panel = document.querySelector(`[data-level-panel="${x.dataset.levelTab}"]`);
      if (panel) panel.hidden = !active;
    });
  };
  tabs.forEach((tab,index) => {
    tab.addEventListener('click', () => chooseTab(tab));
    tab.addEventListener('keydown', event => {
      let delta = event.key==='ArrowRight'?1:event.key==='ArrowLeft'?-1:0;
      if (!delta) return;
      if (document.documentElement.dir==='rtl') delta *= -1;
      event.preventDefault();
      const next = tabs[(index+delta+tabs.length)%tabs.length];
      chooseTab(next); next.focus();
    });
  });
  document.querySelectorAll('.level-choice').forEach(button => button.addEventListener('click', () => {
    const panel = button.closest('.level-panel');
    if (!panel) return;
    panel.querySelectorAll('.level-choice').forEach(x => x.setAttribute('aria-pressed',String(x===button)));
    panel.querySelector('[data-level-number]').textContent = `${document.querySelector('.levels-section')?.dataset.levelWord || ''} ${button.dataset.level}`;
    panel.querySelector('[data-level-detail]').textContent = button.querySelector('span:last-child').textContent;
    const n = Number(button.dataset.level);
    panel.querySelector('.preview-art').dataset.policyEffect = button.dataset.kind==='image' ? (n>=6?'block':n>=4?'distort':'mask') : (n>=5?'block':n>=3?'distort':'mask');
  }));
})();
