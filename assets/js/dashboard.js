import { supabase } from './supabase-client.js';
import { initNav } from './nav.js';

const totalEl = document.querySelector('[data-total]');
const metaEl = document.querySelector('[data-meta]');
const ingotBar = document.querySelector('[data-ingot-bar]');
const membersBody = document.querySelector('[data-members-body]');
const emptyState = document.querySelector('[data-empty-state]');
const evolutionPanel = document.querySelector('[data-evolution-panel]');
const membersPanel = document.querySelector('[data-members-panel]');
const chartCanvas = document.getElementById('evolution-chart');

const fmt = (n) => new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(n);

async function loadDashboard() {
  await initNav();

  const { data: profiles, error } = await supabase
    .from('profiles')
    .select('pseudo, montant, updated_at')
    .order('montant', { ascending: false });

  if (error) {
    metaEl.textContent = 'Impossible de charger les données pour le moment.';
    return;
  }

  if (!profiles || profiles.length === 0) {
    totalEl.textContent = fmt(0);
    metaEl.textContent = 'Aucun membre pour le moment.';
    emptyState.classList.remove('is-hidden');
    evolutionPanel.classList.add('is-hidden');
    membersPanel.classList.add('is-hidden');
    return;
  }

  const total = profiles.reduce((sum, p) => sum + Number(p.montant), 0);
  totalEl.textContent = fmt(total);
  metaEl.textContent = `${profiles.length} membre${profiles.length > 1 ? 's' : ''} · mis à jour ${relativeTime(latestUpdate(profiles))}`;

  renderIngotBar(profiles, total);
  renderMembers(profiles);
  await renderEvolution();
}

function latestUpdate(profiles) {
  return profiles.reduce((latest, p) => {
    const t = new Date(p.updated_at).getTime();
    return t > latest ? t : latest;
  }, 0);
}

function relativeTime(timestamp) {
  if (!timestamp) return 'à l’instant';
  const diffMin = Math.round((Date.now() - timestamp) / 60000);
  if (diffMin < 1) return 'à l’instant';
  if (diffMin < 60) return `il y a ${diffMin} min`;
  const diffH = Math.round(diffMin / 60);
  if (diffH < 24) return `il y a ${diffH} h`;
  const diffJ = Math.round(diffH / 24);
  return `il y a ${diffJ} j`;
}

function renderIngotBar(profiles, total) {
  ingotBar.innerHTML = '';
  if (total <= 0) return;
  profiles.forEach((p, i) => {
    const share = Number(p.montant) / total;
    if (share <= 0) return;
    const seg = document.createElement('div');
    seg.className = 'ingot';
    seg.style.flexGrow = String(share);
    seg.style.background = i % 2 === 0 ? 'var(--accent-gold)' : 'var(--accent-gold-dim)';
    seg.title = `${p.pseudo} — ${fmt(p.montant)}`;
    ingotBar.appendChild(seg);
  });
}

function renderMembers(profiles) {
  membersBody.innerHTML = '';
  profiles.forEach((p) => {
    const row = document.createElement('tr');
    row.innerHTML = `<td>${escapeHtml(p.pseudo)}</td><td class="num">${fmt(p.montant)}</td>`;
    membersBody.appendChild(row);
  });
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

async function renderEvolution() {
  const { data: historique, error } = await supabase
    .from('historique')
    .select('nouveau_montant, ancien_montant, created_at')
    .order('created_at', { ascending: true });

  if (error || !historique || historique.length === 0) {
    evolutionPanel.classList.add('is-hidden');
    return;
  }
  evolutionPanel.classList.remove('is-hidden');

  const { data: profiles } = await supabase.from('profiles').select('montant');
  const currentTotal = (profiles || []).reduce((s, p) => s + Number(p.montant), 0);

  // On reconstruit le total cumulé dans le temps en "remontant" depuis le
  // total actuel à travers chaque changement enregistré dans l'historique.
  let runningTotal = currentTotal;
  const rows = [{ date: new Date(), total: currentTotal }];

  for (let i = historique.length - 1; i >= 0; i--) {
    const h = historique[i];
    runningTotal -= (Number(h.nouveau_montant) - Number(h.ancien_montant));
    rows.unshift({ date: new Date(h.created_at), total: runningTotal });
  }

  const labels = rows.map((r) => r.date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' }));
  const data = rows.map((r) => r.total);

  new Chart(chartCanvas, {
    type: 'line',
    data: {
      labels,
      datasets: [{
        label: 'Total de la guilde',
        data,
        borderColor: '#E3A33C',
        backgroundColor: 'rgba(227, 163, 60, 0.12)',
        fill: true,
        tension: 0.25,
        pointRadius: 2,
        pointBackgroundColor: '#E3A33C',
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        x: { grid: { color: '#2C333D' }, ticks: { color: '#8C94A0' } },
        y: { grid: { color: '#2C333D' }, ticks: { color: '#8C94A0', callback: (v) => fmt(v) } },
      },
    },
  });
}

loadDashboard();
