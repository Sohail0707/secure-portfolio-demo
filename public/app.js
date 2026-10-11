(() => {
  const PROJECTS = [
    { id: 1, title: 'Northwind Coffee', kind: 'Brand identity' },
    { id: 2, title: 'Atlas Fitness', kind: 'Mobile app' },
    { id: 3, title: 'Harbor & Pine', kind: 'Website redesign' },
    { id: 4, title: 'Confidential project', kind: 'Fintech' },
    { id: 5, title: 'Confidential project', kind: 'Healthcare' },
    { id: 6, title: 'Confidential project', kind: 'Automotive' },
  ];
  const PROTECTED = new Set([4, 5, 6]);
  const LABELS = { approved: 'Approved client', revoked: 'Access revoked', none: 'Public visitor' };

  const $ = (sel) => document.querySelector(sel);
  const imageUrl = (id) => `/api/image?id=${id}`;
  const kb = (bytes) => `${(bytes / 1024).toFixed(1)} KB`;
  let access = 'none';

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }

  // One-off notice after a magic link or reset redirect, then tidy the URL.
  function showNotice() {
    const params = new URLSearchParams(location.search);
    const status = params.get('status');
    const messages = {
      approved: ['Access granted. Projects 4 to 6 are now delivered in full, with a watermark.', 'good'],
      revoked: ['This link has been revoked. Protected projects stay as server-blurred previews.', 'bad'],
      invalid: ['That access link is not valid.', 'bad'],
      reset: ['Cookie cleared. You are viewing as a public visitor.', 'neutral'],
    };
    if (messages[status]) {
      const el = $('#notice');
      el.textContent = messages[status][0];
      el.dataset.tone = messages[status][1];
      el.hidden = false;
    }
    if (status) history.replaceState(null, '', location.pathname + location.hash);
  }

  async function loadStatus() {
    try {
      const res = await fetch('/api/status', { cache: 'no-store', credentials: 'same-origin' });
      const data = await res.json();
      access = data.access;
    } catch {
      access = 'none';
    }
    const pill = $('#status-pill');
    pill.dataset.access = access;
    $('#status-text').textContent = `Viewing as: ${LABELS[access] || LABELS.none}`;
  }

  const lockIcon = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><rect x="4" y="10" width="16" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/></svg>';

  function renderGrid() {
    const grid = $('#grid');
    grid.innerHTML = PROJECTS.map((p) => {
      const locked = PROTECTED.has(p.id) && access !== 'approved';
      const badge = !PROTECTED.has(p.id) ? 'Public' : locked ? 'Locked' : 'Unlocked';
      const overlay = locked
        ? `<div class="lock">${lockIcon}<p>${access === 'revoked' ? 'Your access was revoked' : 'Protected project'}</p>
             <button type="button" class="btn btn-light" data-request>Request portfolio access</button></div>`
        : '';
      return `<figure class="project">
          <div class="frame">
            <img src="${imageUrl(p.id)}" alt="${escapeHtml(locked ? `${p.title}, blurred preview` : `${p.title}, ${p.kind}`)}" loading="lazy" decoding="async">
            ${overlay}
          </div>
          <figcaption><strong>${escapeHtml(p.title)}</strong><span>${escapeHtml(p.kind)} · ${badge}</span></figcaption>
        </figure>`;
    }).join('');
  }

  function setupComparison() {
    const cssImg = $('#css-img');
    const cssBtn = $('#css-toggle');
    cssBtn.addEventListener('click', () => {
      const revealed = cssImg.classList.toggle('css-blurred') === false;
      cssBtn.textContent = revealed ? 'Put the blur back' : 'Remove the blur';
      cssBtn.setAttribute('aria-pressed', String(revealed));
      $('#css-verdict').classList.toggle('show', revealed);
    });

    const serverImg = $('#server-img');
    const serverBtn = $('#server-toggle');
    const frame = serverImg.parentElement;
    serverBtn.addEventListener('click', () => {
      const revealed = serverImg.classList.contains('server-scaled');
      // "Remove the blur" here means: strip every bit of CSS and show the file as-is.
      if (revealed) {
        serverImg.removeAttribute('class');
        serverImg.removeAttribute('style');
        serverImg.style.cssText = 'width:auto;height:auto;max-width:none;';
        const label = document.createElement('span');
        label.className = 'size-label';
        label.textContent = `Actual file, no CSS: ${serverImg.naturalWidth} × ${serverImg.naturalHeight} px`;
        frame.appendChild(label);
      } else {
        serverImg.style.cssText = '';
        serverImg.className = 'server-scaled';
        frame.querySelector('.size-label')?.remove();
      }
      serverBtn.textContent = revealed ? 'Scale it back up' : 'Remove the blur';
      serverBtn.setAttribute('aria-pressed', String(revealed));
      const verdict = $('#server-verdict');
      if (access !== 'approved') verdict.classList.toggle('show', revealed);
    });
  }

  function comparisonNoteForApproved() {
    if (access !== 'approved') return;
    const verdict = $('#server-verdict');
    verdict.textContent = 'You are an approved client, so the server sent the full watermarked image. Use "Reset to public visitor" to see the locked view.';
    verdict.classList.add('note');
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

  function setupTests() {
    $('#test-original').addEventListener('click', async () => {
      const out = $('#result-original');
      const url = '/private-images/project-5.jpg';
      out.textContent = 'Requesting…';
      try {
        const res = await fetch(url, { cache: 'no-store' });
        const blocked = !res.ok;
        out.innerHTML = `<code>GET ${url}</code> → <span class="${blocked ? 'ok' : 'no'}">${res.status} ${escapeHtml(res.statusText || (blocked ? 'Not Found' : 'OK'))}</span>. ${blocked ? 'The originals are not on the public web server at all.' : 'Unexpected: the original is reachable.'}`;
      } catch (err) {
        out.textContent = `Request failed: ${err.message}`;
      }
    });

    $('#test-received').addEventListener('click', async () => {
      const out = $('#result-received');
      out.textContent = 'Fetching /api/image?id=5…';
      try {
        const res = await fetch(imageUrl(5), { cache: 'no-store', credentials: 'same-origin' });
        const blob = await res.blob();
        const objectUrl = URL.createObjectURL(blob);
        const img = new Image();
        img.src = objectUrl;
        await img.decode();
        const full = res.headers.get('X-Image-Variant') === 'watermarked';
        const received = `${kb(blob.size)}, ${img.naturalWidth} × ${img.naturalHeight} px`;
        const approvedDims = (res.headers.get('X-Approved-Dimensions') || '').replace('x', ' × ');
        const approvedLine = full
          ? 'This is the approved version (you have access).'
          : `${approvedDims ? `${approvedDims} px` : 'Up to 1600 px wide'}, watermarked. Only sent with an approved link.`;
        out.innerHTML = `<div class="received">
            ${full ? '' : `<img src="${objectUrl}" alt="The exact bytes received, shown at real size" width="${img.naturalWidth}" height="${img.naturalHeight}">`}
            <dl>
              <dt>Browser received</dt><dd>${received}${full ? ' (watermarked)' : ''}</dd>
              <dt>Approved version</dt><dd>${approvedLine}</dd>
            </dl>
          </div>`;
      } catch (err) {
        out.textContent = `Request failed: ${err.message}`;
      }
    });
  }

  showNotice();
  setupComparison();
  setupModal();
  setupTests();
  loadStatus().then(() => {
    renderGrid();
    comparisonNoteForApproved();
  });
})();
