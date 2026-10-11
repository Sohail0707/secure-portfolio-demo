(() => {
  const PROJECTS = [
    { id: 1, title: 'Northwind Coffee', kind: 'Brand identity' },
    { id: 2, title: 'Atlas Fitness', kind: 'Mobile app' },
    { id: 3, title: 'Harbor & Pine', kind: 'Website redesign' },
    { id: 4, title: 'Private banking dashboard', kind: 'Fintech' },
    { id: 5, title: 'Patient portal', kind: 'Healthcare' },
    { id: 6, title: 'Vehicle launch campaign', kind: 'Automotive' },
  ];
  const PROTECTED = new Set([4, 5, 6]);

  const $ = (sel) => document.querySelector(sel);
  const lockIcon = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><rect x="4" y="10" width="16" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/></svg>';

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }

  async function getAccess() {
    try {
      const res = await fetch('/api/status', { cache: 'no-store', credentials: 'same-origin' });
      return (await res.json()).access;
    } catch {
      return 'none';
    }
  }

  function renderGrid(approved) {
    $('#grid').innerHTML = PROJECTS.map((p) => {
      const locked = PROTECTED.has(p.id) && !approved;
      return `<article class="project${locked ? ' is-locked' : ''}">
          <div class="frame">
            <img src="/api/image?id=${p.id}" alt="${escapeHtml(locked ? `${p.title}, locked preview` : p.title)}" loading="lazy" decoding="async">
            ${locked ? `<div class="lock">${lockIcon}<button type="button" class="btn btn-light" data-request>Request Portfolio Access</button></div>` : ''}
          </div>
          <div class="meta"><h2>${escapeHtml(p.title)}</h2><span>${escapeHtml(p.kind)}</span></div>
        </article>`;
    }).join('');
  }

  function setupModal() {
    const modal = $('#request-modal');
    const form = $('#request-form');
    const done = $('#request-done');
    document.addEventListener('click', (e) => {
      if (e.target.closest('[data-request]')) {
        form.reset();
        form.hidden = false;
        done.hidden = true;
        modal.showModal();
      }
      if (e.target.closest('[data-close]')) modal.close();
    });
    modal.addEventListener('click', (e) => { if (e.target === modal) modal.close(); });
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      form.hidden = true;
      done.hidden = false;
      done.querySelector('button').focus();
    });
  }

  // Magic links and /reset redirect here with ?status=…; keep the address bar clean.
  if (new URLSearchParams(location.search).has('status')) {
    history.replaceState(null, '', location.pathname + location.hash);
  }

  setupModal();
  getAccess().then((access) => {
    const approved = access === 'approved';
    $('#access-banner').hidden = !approved;
    $('.test-hint').hidden = approved; // nothing is locked for approved clients
    renderGrid(approved);
  });
})();
