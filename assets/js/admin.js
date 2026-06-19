import { supabase } from './supabase-client.js';
import { initNav } from './nav.js';

const tbody = document.querySelector('[data-admin-body]');
const messageEl = document.querySelector('[data-message]');
const fmt = (n) => new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(n);

async function init() {
  const session = await initNav();
  if (!session) {
    window.location.href = 'login.html';
    return;
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', session.user.id)
    .maybeSingle();

  if (!profile?.is_admin) {
    window.location.href = 'index.html';
    return;
  }

  await loadMembers();
}

async function loadMembers() {
  const { data: profiles, error } = await supabase
    .from('profiles')
    .select('id, pseudo, montant, is_admin')
    .order('pseudo', { ascending: true });

  tbody.innerHTML = '';

  if (error) {
    messageEl.textContent = 'Impossible de charger les membres.';
    messageEl.classList.add('is-error');
    return;
  }

  profiles.forEach((p) => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td><input type="text" value="${escapeAttr(p.pseudo)}" data-field="pseudo" /></td>
      <td><input type="number" min="0" step="0.01" value="${p.montant}" data-field="montant" /></td>
      <td>${p.is_admin ? '<span class="badge">Admin</span>' : ''}</td>
      <td class="actions">
        <button class="btn btn-small" data-action="save">Enregistrer</button>
        <button class="btn btn-small btn-danger" data-action="delete">Retirer</button>
      </td>
    `;
    row.querySelector('[data-action="save"]').addEventListener('click', () => saveRow(p.id, row));
    row.querySelector('[data-action="delete"]').addEventListener('click', () => deleteRow(p.id, p.pseudo, row));
    tbody.appendChild(row);
  });
}

async function saveRow(id, row) {
  const pseudo = row.querySelector('[data-field="pseudo"]').value.trim();
  const montant = Number(row.querySelector('[data-field="montant"]').value);

  const { error } = await supabase.from('profiles').update({ pseudo, montant }).eq('id', id);

  messageEl.textContent = error ? 'La mise à jour a échoué.' : `${pseudo} mis à jour.`;
  messageEl.classList.toggle('is-error', !!error);
  messageEl.classList.toggle('is-success', !error);
}

async function deleteRow(id, pseudo, row) {
  if (!window.confirm(`Retirer ${pseudo} de la trésorerie ? Cette action est définitive.`)) return;

  const { error } = await supabase.from('profiles').delete().eq('id', id);
  if (error) {
    messageEl.textContent = 'La suppression a échoué.';
    messageEl.classList.add('is-error');
    return;
  }
  row.remove();
}

function escapeAttr(str) {
  return String(str).replace(/"/g, '&quot;');
}

init();
