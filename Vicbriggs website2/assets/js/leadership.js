/* Stage 1: presentation only. Stage 2 will implement /api/leadership. */
(() => {
  'use strict';
  const groups = {
    board: { grid: document.getElementById('board-grid'), empty: document.getElementById('board-empty') },
    management: { grid: document.getElementById('management-grid'), empty: document.getElementById('management-empty') }
  };

  function makeProfile(profile) {
    const card = document.createElement('article');
    card.className = 'leader-card';
    const photoUrl = typeof profile.photo_url === 'string' ? profile.photo_url : '';
    if (photoUrl && /^https:\/\//i.test(photoUrl)) {
      const img = document.createElement('img');
      img.className = 'leader-photo';
      img.src = photoUrl;
      img.alt = `Portrait of ${profile.name || 'leadership team member'}`;
      img.loading = 'lazy';
      card.appendChild(img);
    } else {
      const placeholder = document.createElement('div');
      placeholder.className = 'leader-photo-placeholder';
      placeholder.setAttribute('aria-hidden', 'true');
      placeholder.textContent = '♙';
      card.appendChild(placeholder);
    }
    const info = document.createElement('div');
    info.className = 'leader-info';
    const name = document.createElement('h3');
    name.className = 'leader-name';
    name.textContent = profile.name || 'Team member';
    const role = document.createElement('p');
    role.className = 'leader-role';
    role.textContent = profile.designation || '';
    info.append(name, role);
    if (profile.biography) {
      const bio = document.createElement('p');
      bio.className = 'leader-bio';
      bio.textContent = profile.biography;
      info.appendChild(bio);
    }
    card.appendChild(info);
    return card;
  }

  function render(items) {
    for (const [group, nodes] of Object.entries(groups)) {
      if (!nodes.grid || !nodes.empty) continue;
      const matching = items.filter(p => p && p.group === group);
      matching.sort((a,b) => (Number(a.display_order) || 0) - (Number(b.display_order) || 0));
      nodes.grid.replaceChildren(...matching.map(makeProfile));
      nodes.empty.hidden = matching.length > 0;
    }
  }

  async function load() {
    try {
      const response = await fetch('/api/leadership', { headers: { Accept: 'application/json' } });
      if (!response.ok) throw new Error(`Leadership API not available (${response.status})`);
      const payload = await response.json();
      if (!Array.isArray(payload.items)) throw new Error('Unexpected leadership response');
      render(payload.items);
    } catch (error) {
      // Expected until Stage 2 creates the public API.
      console.info('Leadership profiles are not yet connected:', error.message);
      render([]);
    }
  }
  load();
})();
