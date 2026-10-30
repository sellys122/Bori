/* 작은 바탕화면 보리: 산책, 잡아 옮기기, 간식 먹기 */
(() => {
  const pet = document.createElement('button');
  pet.type = 'button';
  pet.id = 'bori-pet';
  pet.className = 'desktop-pet walking';
  pet.setAttribute('aria-label', '작은 보리 — 드래그해서 이동, 우클릭 또는 Enter로 간식 메뉴 열기');
  pet.setAttribute('aria-haspopup', 'menu');
  pet.setAttribute('aria-expanded', 'false');

  const image = document.createElement('img');
  image.src = 'assets/hamster-3.webp';
  image.alt = '';
  image.draggable = false;
  const snack = document.createElement('span');
  snack.className = 'pet-seed';
  snack.setAttribute('aria-hidden', 'true');
  const bubble = document.createElement('span');
  bubble.className = 'pet-bubble';
  bubble.textContent = '우클릭하면 간식을 줄 수 있어요';
  pet.append(image, snack, bubble);

  const menu = document.createElement('div');
  menu.id = 'pet-menu';
  menu.className = 'pet-menu';
  menu.setAttribute('role', 'menu');
  menu.setAttribute('aria-label', '작은 보리 메뉴');
  menu.hidden = true;
  const feed = document.createElement('button');
  feed.type = 'button';
  feed.setAttribute('role', 'menuitem');
  feed.textContent = '해바라기씨 주기';
  const pause = document.createElement('button');
  pause.type = 'button';
  pause.setAttribute('role', 'menuitem');
  pause.textContent = '잠깐 쉬기';
  menu.append(feed, pause);
  const status = document.createElement('span');
  status.className = 'pet-sr-status';
  status.setAttribute('role', 'status');
  document.body.append(pet, menu, status);

  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const state = {
    x: Math.max(8, innerWidth * 0.65),
    y: Math.max(8, innerHeight - 160),
    vx: 30,
    held: false,
    eating: false,
    paused: reducedMotion.matches,
    menuOpen: false,
  };
  let lastTime = 0;
  let eatTimer;
  let bubbleTimer;
  let longPressTimer;
  let drag = null;
  let suppressClick = false;
  let nextTurn = performance.now() + 5500;
  let restUntil = 0;

  function bounds() {
    return {
      x: Math.max(0, innerWidth - pet.offsetWidth - 8),
      y: Math.max(0, innerHeight - pet.offsetHeight - 42),
    };
  }

  function paint() {
    const edge = bounds();
    state.x = Math.max(0, Math.min(edge.x, state.x));
    state.y = Math.max(0, Math.min(edge.y, state.y));
    bubble.style.left = state.x < 85 ? '0' : 'auto';
    bubble.style.right = state.x < 85 ? 'auto' : '0';
    bubble.style.bottom = state.y < 85 ? 'auto' : 'calc(100% + 7px)';
    bubble.style.top = state.y < 85 ? 'calc(100% + 7px)' : 'auto';
    pet.style.left = state.x + 'px';
    pet.style.top = state.y + 'px';
    pet.style.setProperty('--pet-facing', state.vx < 0 ? '-1' : '1');
  }

  function say(message, duration = 3500) {
    clearTimeout(bubbleTimer);
    bubble.textContent = message;
    bubble.hidden = false;
    status.textContent = message;
    bubbleTimer = setTimeout(() => { bubble.hidden = true; }, duration);
  }

  function closeMenu(restoreFocus = false) {
    menu.hidden = true;
    state.menuOpen = false;
    pet.setAttribute('aria-expanded', 'false');
    if (restoreFocus) pet.focus({ preventScroll: true });
  }

  function showMenu(x, y) {
    if (state.eating) return;
    state.menuOpen = true;
    menu.hidden = false;
    pet.setAttribute('aria-expanded', 'true');
    menu.style.left = Math.max(4, Math.min(innerWidth - menu.offsetWidth - 4, x)) + 'px';
    menu.style.top = Math.max(4, Math.min(innerHeight - menu.offsetHeight - 4, y)) + 'px';
    pause.textContent = state.paused ? '다시 산책하기' : '잠깐 쉬기';
    feed.focus({ preventScroll: true });
  }

  feed.addEventListener('click', () => {
    closeMenu(true);
    clearTimeout(eatTimer);
    state.eating = true;
    pet.classList.add('eating');
    pet.classList.remove('walking');
    image.src = 'assets/hamster-1.webp';
    say('냠냠… 해바라기씨 맛있다!', 5000);
    eatTimer = setTimeout(() => {
      state.eating = false;
      pet.classList.remove('eating');
      image.src = 'assets/hamster-3.webp';
      say('잘 먹었어요!', 2200);
    }, 4800);
  });

  pause.addEventListener('click', () => {
    state.paused = !state.paused;
    closeMenu(true);
    say(state.paused ? '여기서 잠깐 쉬어 갈게요' : '다시 산책할래요');
  });

  pet.addEventListener('contextmenu', event => {
    event.preventDefault();
    clearTimeout(longPressTimer);
    showMenu(event.clientX, event.clientY);
  });

  pet.addEventListener('pointerdown', event => {
    if (event.button !== 0) return;
    closeMenu();
    state.held = true;
    suppressClick = false;
    pet.classList.add('held');
    pet.classList.remove('walking');
    drag = {
      id: event.pointerId,
      dx: event.clientX - state.x,
      dy: event.clientY - state.y,
      startX: event.clientX,
      startY: event.clientY,
    };
    pet.setPointerCapture(event.pointerId);
    if (event.pointerType === 'touch') {
      longPressTimer = setTimeout(() => {
        suppressClick = true;
        showMenu(state.x, state.y);
      }, 550);
    }
  });

  pet.addEventListener('pointermove', event => {
    if (!drag || event.pointerId !== drag.id) return;
    if (Math.hypot(event.clientX - drag.startX, event.clientY - drag.startY) > 5) {
      suppressClick = true;
      clearTimeout(longPressTimer);
    }
    state.x = event.clientX - drag.dx;
    state.y = event.clientY - drag.dy;
    paint();
  });

  function drop(event) {
    if (!drag || event.pointerId !== drag.id) return;
    clearTimeout(longPressTimer);
    if (pet.hasPointerCapture(drag.id)) pet.releasePointerCapture(drag.id);
    state.held = false;
    pet.classList.remove('held');
    drag = null;
    paint();
  }
  pet.addEventListener('pointerup', drop);
  pet.addEventListener('pointercancel', event => {
    suppressClick = true;
    drop(event);
  });
  pet.addEventListener('click', () => {
    if (suppressClick) { suppressClick = false; return; }
    showMenu(state.x, state.y);
  });
  pet.addEventListener('keydown', event => {
    if (event.key === 'ContextMenu' || (event.shiftKey && event.key === 'F10')) {
      event.preventDefault();
      showMenu(state.x, state.y);
    }
  });

  menu.addEventListener('keydown', event => {
    if (event.key === 'Escape') { event.preventDefault(); closeMenu(true); }
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      (document.activeElement === feed ? pause : feed).focus();
    }
    if (event.key === 'Tab') closeMenu();
  });
  document.addEventListener('pointerdown', event => {
    if (!pet.contains(event.target) && !menu.contains(event.target)) closeMenu();
  });
  document.addEventListener('visibilitychange', () => { lastTime = 0; });
  window.addEventListener('resize', () => { closeMenu(); paint(); });

  function wander(time) {
    const dt = lastTime ? Math.min((time - lastTime) / 1000, 0.04) : 0;
    lastTime = time;
    const walking = !state.held && !state.eating && !state.paused && !state.menuOpen;
    pet.classList.toggle('walking', walking && time >= restUntil);
    if (walking) {
      if (time >= nextTurn) {
        state.vx *= -1;
        restUntil = time + 1100;
        nextTurn = time + 6000 + Math.random() * 5000;
      }
      if (time >= restUntil) {
        const edge = bounds();
        state.x += state.vx * dt;
        if (state.x <= 0) { state.x = 0; state.vx = Math.abs(state.vx); }
        if (state.x >= edge.x) { state.x = edge.x; state.vx = -Math.abs(state.vx); }
        paint();
      }
    }
    requestAnimationFrame(wander);
  }

  // 간식 이미지를 미리 읽어, 먹기 시작할 때 깜박이지 않게 합니다.
  const preload = new Image();
  preload.src = 'assets/hamster-1.webp';
  paint();
  say('우클릭하면 간식을 줄 수 있어요', 6000);
  requestAnimationFrame(wander);
})();

