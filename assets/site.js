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

  document.querySelectorAll('[data-showcase]').forEach(root => {
    const kind = root.dataset.showcase;
    const scenes = [...root.querySelectorAll('[data-showcase-scene]')];
    const levels = [...root.querySelectorAll('[data-showcase-level]')];
    const selection = root.querySelector('[data-showcase-selection]');
    const description = root.querySelector('[data-showcase-description]');
    let scene = 1;
    let level = 0;
    let view = 'original';
    let imageRequest = 0;
    const media = name => `/assets/media/${name}`;
    const press = (buttons, selected) => buttons.forEach(button => button.setAttribute('aria-pressed', String(button === selected)));
    const preload = url => new Promise(resolve => {
      const image = new Image();
      image.onload = () => resolve(true);
      image.onerror = () => resolve(false);
      image.src = url;
      if (image.complete) resolve(image.naturalWidth > 0);
    });

    const update = () => {
      const sceneButton = scenes[scene - 1];
      const levelButton = levels[level];
      const alt = sceneButton.dataset.sceneAlt;
      selection.textContent = level ? `${root.dataset.levelWord} ${level}` : root.dataset.originalLabel;
      description.textContent = level ? levelButton.dataset.description : root.dataset.originalNote;
      press(scenes, sceneButton);
      press(levels, levelButton);
      if (kind === 'image') {
        const source = root.querySelector('[data-original-image]');
        const result = root.querySelector('[data-result-image]');
        const stage = root.querySelector('[data-compare-stage]');
        const range = root.querySelector('[data-compare-range]');
        const loading = root.querySelector('[data-showcase-loading]');
        const sourceUrl = media(`images/photo-${scene}-original.webp`);
        const resultUrl = media(`images/photo-${scene}-${level || 'original'}.webp`);
        const request = ++imageRequest;
        stage.setAttribute('aria-busy', 'true');
        loading.hidden = false;
        Promise.all([preload(sourceUrl), preload(resultUrl)]).then(loaded => {
          if (request !== imageRequest) return;
          if (loaded.every(Boolean)) {
            source.src = sourceUrl;
            source.alt = alt;
            result.src = resultUrl;
            result.alt = level >= 6 ? `${root.dataset.resultWord} — ${root.dataset.levelWord} ${level}` : level ? `${alt} — ${root.dataset.levelWord} ${level}` : '';
            stage.dataset.original = String(level === 0);
            stage.style.setProperty('--split', level ? `${range.value}%` : '100%');
            range.hidden = level === 0;
            range.disabled = level === 0;
            root.querySelector('[data-after-label]').hidden = level === 0;
          }
          stage.removeAttribute('aria-busy');
          loading.hidden = true;
        });
      } else {
        const video = root.querySelector('[data-showcase-video]');
        const showResult = level > 0 && view === 'result';
        const suffix = showResult ? (level >= 5 ? `blocked-${root.dataset.localeSlug}` : `video-${scene}-${level}`) : `video-${scene}-original`;
        const nextSrc = media(`videos/${suffix}.mp4`);
        if (video.getAttribute('src') !== nextSrc) {
          video.pause();
          video.setAttribute('src', nextSrc);
          video.setAttribute('poster', media(`posters/${suffix}.webp`));
          video.load();
        }
        video.setAttribute('aria-label', showResult && level >= 5 ? `${root.dataset.resultWord} — ${root.dataset.levelWord} ${level}` : `${alt} — ${showResult ? `${root.dataset.levelWord} ${level}` : root.dataset.originalLabel}`);
        root.querySelector('[data-video-stage-tag]').textContent = showResult ? `${root.dataset.levelWord} ${level}` : root.dataset.originalLabel;
        const viewButtons = [...root.querySelectorAll('[data-video-view]')];
        viewButtons.find(button => button.dataset.videoView === 'result').disabled = level === 0;
        press(viewButtons, viewButtons.find(button => button.dataset.videoView === view));
      }
    };

    scenes.forEach(button => button.addEventListener('click', () => {
      scene = Number(button.dataset.showcaseScene);
      if (kind === 'image') root.querySelector('[data-compare-range]').value = '15';
      update();
    }));
    levels.forEach(button => button.addEventListener('click', () => {
      level = Number(button.dataset.showcaseLevel);
      if (kind === 'video') view = level ? 'result' : 'original';
      else root.querySelector('[data-compare-range]').value = '15';
      update();
    }));
    if (kind === 'image') {
      const range = root.querySelector('[data-compare-range]');
      const stage = root.querySelector('[data-compare-stage]');
      const setSplit = clientX => {
        const rect = stage.getBoundingClientRect();
        range.value = String(Math.max(0, Math.min(100, Math.round((clientX - rect.left) * 100 / rect.width))));
        stage.style.setProperty('--split', `${range.value}%`);
      };
      range.addEventListener('input', () => stage.style.setProperty('--split', `${range.value}%`));
      range.addEventListener('keydown', event => {
        const steps = { ArrowLeft:-1, ArrowDown:-1, ArrowRight:1, ArrowUp:1, PageDown:-10, PageUp:10 };
        let next;
        if (event.key === 'Home') next = 0;
        else if (event.key === 'End') next = 100;
        else if (event.key in steps) next = Number(range.value) + steps[event.key];
        else return;
        event.preventDefault();
        range.value = String(Math.max(0, Math.min(100, next)));
        stage.style.setProperty('--split', `${range.value}%`);
      });
      stage.addEventListener('pointerdown', event => {
        if (range.disabled || event.button !== 0) return;
        event.preventDefault();
        range.focus({ preventScroll: true });
        stage.setPointerCapture(event.pointerId);
        setSplit(event.clientX);
      });
      stage.addEventListener('pointermove', event => {
        if (stage.hasPointerCapture(event.pointerId)) setSplit(event.clientX);
      });
      stage.addEventListener('pointerup', event => {
        if (stage.hasPointerCapture(event.pointerId)) stage.releasePointerCapture(event.pointerId);
      });
      stage.addEventListener('pointercancel', event => {
        if (stage.hasPointerCapture(event.pointerId)) stage.releasePointerCapture(event.pointerId);
      });
    } else {
      root.querySelectorAll('[data-video-view]').forEach(button => button.addEventListener('click', () => {
        if (button.disabled) return;
        view = button.dataset.videoView;
        update();
      }));
    }
    update();
  });
})();
