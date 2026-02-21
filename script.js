'use strict';

/* ========================================
   CART STATE
   ======================================== */
const cart = new Map(); // key: "Produkt_Größe" → { product, size, price, qty }

/* ========================================
   NAVIGATION – scroll shadow + mobile toggle
   ======================================== */
const navbar   = document.getElementById('navbar');
const navLinks = document.getElementById('navLinks');
const navToggle = document.getElementById('navToggle');

window.addEventListener('scroll', () => {
  navbar.classList.toggle('scrolled', window.scrollY > 40);
}, { passive: true });

navToggle.addEventListener('click', () => {
  const open = navLinks.classList.toggle('open');
  navToggle.setAttribute('aria-expanded', String(open));
});

// Close mobile menu on link click
navLinks.querySelectorAll('a').forEach(a =>
  a.addEventListener('click', () => {
    navLinks.classList.remove('open');
    navToggle.setAttribute('aria-expanded', 'false');
  })
);

/* ========================================
   SMOOTH SCROLL (accounts for fixed navbar height)
   ======================================== */
document.querySelectorAll('a[href^="#"]').forEach(a => {
  a.addEventListener('click', e => {
    const target = document.querySelector(a.getAttribute('href'));
    if (!target) return;
    e.preventDefault();
    const offset = navbar.offsetHeight + 12;
    window.scrollTo({ top: target.offsetTop - offset, behavior: 'smooth' });
  });
});

/* ========================================
   PRODUCT CARDS – size selector + qty stepper
   ======================================== */
document.querySelectorAll('.product-card').forEach(card => {
  const sizeBtns = card.querySelectorAll('.size-btn');
  const qtyVal   = card.querySelector('.qty-val');
  const qtyBtns  = card.querySelectorAll('.qty-btn');
  const addBtn   = card.querySelector('.btn-add');
  let qty = 1;

  // Size toggle
  sizeBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      sizeBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
    });
  });

  // Quantity stepper
  qtyBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      qty = Math.max(1, qty + parseInt(btn.dataset.dir, 10));
      qtyVal.textContent = qty;
    });
  });

  // Add to cart
  addBtn.addEventListener('click', () => {
    const product = card.dataset.product;
    const activeSize = card.querySelector('.size-btn.active');
    const size  = activeSize.dataset.size;
    const price = parseFloat(activeSize.dataset.price);
    const key   = `${product}_${size}`;

    if (cart.has(key)) {
      cart.get(key).qty += qty;
    } else {
      cart.set(key, { product, size, price, qty });
    }

    renderCart();
    toast(`${qty}× ${product} (${size}) in den Korb gelegt!`);

    // Reset qty display
    qty = 1;
    qtyVal.textContent = 1;

    // Scroll to order section
    const orderSection = document.getElementById('bestellen');
    const offset = navbar.offsetHeight + 12;
    window.scrollTo({ top: orderSection.offsetTop - offset, behavior: 'smooth' });
  });
});

/* ========================================
   CART RENDER
   ======================================== */
function renderCart() {
  const cartItems = document.getElementById('cartItems');
  const cartTotal = document.getElementById('cartTotal');
  const totalEl   = document.getElementById('totalPrice');

  if (cart.size === 0 || [...cart.values()].every(i => i.qty === 0)) {
    cartItems.innerHTML = `<p class="cart-empty">Noch keine Artikel hinzugefügt.<br>Wähle deine Pilze im Bereich <a href="#produkte">„Unsere Pilze"</a>.</p>`;
    cartTotal.hidden = true;
    return;
  }

  let html = '';
  let total = 0;
  cart.forEach((item, key) => {
    if (item.qty <= 0) return;
    const lineTotal = item.qty * item.price;
    total += lineTotal;
    html += `
      <div class="cart-line">
        <span>${item.product} <small style="color:var(--text-muted)">(${item.size})</small></span>
        <div class="cart-line-ctrl">
          <button class="qty-btn remove-btn" data-key="${key}" data-dir="-1" title="Weniger">−</button>
          <span style="min-width:1.4rem;text-align:center">${item.qty}×</span>
          <button class="qty-btn" data-key="${key}" data-dir="1" title="Mehr">+</button>
          <span style="min-width:4rem;text-align:right">${fmt(lineTotal)}</span>
        </div>
      </div>`;
  });

  cartItems.innerHTML = html;
  cartTotal.hidden = false;
  totalEl.textContent = fmt(total);

  // Wire up inline qty buttons
  cartItems.querySelectorAll('.qty-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const key = btn.dataset.key;
      const dir = parseInt(btn.dataset.dir, 10);
      if (!cart.has(key)) return;
      cart.get(key).qty = Math.max(0, cart.get(key).qty + dir);
      if (cart.get(key).qty === 0) cart.delete(key);
      renderCart();
    });
  });
}

function fmt(n) {
  return n.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €';
}

/* ========================================
   UPCOMING PICKUP DATES
   ======================================== */
function buildUpcomingDates() {
  const result = [];
  const cursor = new Date();
  cursor.setHours(0, 0, 0, 0);

  while (result.length < 6) {
    const dow = cursor.getDay(); // 0=Sun,4=Thu,6=Sat
    if (dow === 4) result.push({ date: new Date(cursor), label: 'Donnerstag', time: '16:00–19:00 Uhr', value: `Do ${fmtDate(cursor)}` });
    if (dow === 6) result.push({ date: new Date(cursor), label: 'Samstag',    time: '09:00–13:00 Uhr', value: `Sa ${fmtDate(cursor)}` });
    cursor.setDate(cursor.getDate() + 1);
  }
  return result;
}

function fmtDate(d) {
  return d.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

const upcoming = buildUpcomingDates();

// Render upcoming list
const upcomingList = document.getElementById('upcomingList');
upcoming.forEach(({ label, date, time }) => {
  const div = document.createElement('div');
  div.className = 'upcoming-item';
  div.innerHTML = `<div class="ui-day">${label}, ${fmtDate(date)}</div><div class="ui-time">${time}</div>`;
  upcomingList.appendChild(div);
});

// Populate order date select
const oDate = document.getElementById('oDate');
upcoming.forEach(({ label, date, time, value }) => {
  const opt = document.createElement('option');
  opt.value = value;
  opt.textContent = `${label}, ${fmtDate(date)} · ${time}`;
  oDate.appendChild(opt);
});

/* ========================================
   ORDER FORM
   ======================================== */
document.getElementById('orderForm').addEventListener('submit', e => {
  e.preventDefault();
  const form = e.target;

  const items = [...cart.values()].filter(i => i.qty > 0);
  if (items.length === 0) {
    toast('Bitte füge erst Artikel zum Warenkorb hinzu!');
    return;
  }

  // Basic validation
  const required = ['oName', 'oEmail', 'oDate'];
  let valid = true;
  required.forEach(id => {
    const el = document.getElementById(id);
    el.classList.remove('error');
    if (!el.value.trim()) { el.classList.add('error'); valid = false; }
  });
  if (!valid) { toast('Bitte alle Pflichtfelder ausfüllen.'); return; }

  // Simulate successful send
  toast('✓ Bestellung erfolgreich gesendet! Bestätigung folgt per E-Mail.');
  form.reset();
  cart.clear();
  renderCart();
});

/* ========================================
   CONTACT FORM
   ======================================== */
document.getElementById('contactForm').addEventListener('submit', e => {
  e.preventDefault();
  const required = ['cName', 'cEmail', 'cMsg'];
  let valid = true;
  required.forEach(id => {
    const el = document.getElementById(id);
    el.classList.remove('error');
    if (!el.value.trim()) { el.classList.add('error'); valid = false; }
  });
  if (!valid) { toast('Bitte alle Pflichtfelder ausfüllen.'); return; }

  toast('✓ Nachricht gesendet! Wir melden uns bald.');
  e.target.reset();
});

/* ========================================
   TOAST
   ======================================== */
let toastTimer;
function toast(msg) {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), 3500);
}

/* ========================================
   SCROLL REVEAL ANIMATION
   ======================================== */
const revealObserver = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.1 });

document.querySelectorAll(
  '.product-card, .schedule-card, .info-card, .contact-item, .upcoming-box, .order-form'
).forEach(el => {
  el.classList.add('reveal');
  revealObserver.observe(el);
});
