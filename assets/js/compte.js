import { supabase } from './supabase-client.js';
import { initNav } from './nav.js';

const pseudoInput = document.querySelector('[data-pseudo-input]');
const montantInput = document.querySelector('[data-montant-input]');
const saveBtn = document.querySelector('[data-save-btn]');
const messageEl = document.querySelector('[data-message]');
const historiqueBody = document.querySelector('[data-historique-body]');
const historiqueEmpty = document.querySelector('[data-historique-empty]');
const quickChips = document.querySelectorAll('[data-quick-add]');

const fmt = (n) => new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(n);

let userId = null;

async function init() {
  const session = await initNav();
  if (!session) {
    window.location.href = 'login.html';
    return;
  }
  userId = session.user.id;

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('pseudo, montant')
    .eq('id', userId)
    .maybeSingle();

  if (error) {
    messageEl.textContent = 'Impossible de charger ton profil.';
    messageEl.classList.add('is-error');
    return;
  }

  if (!profile) {
    // Filet de sécurité : si le profil n'existe pas encore (cas rare), on le crée.
    const defaultPseudo = `Joueur_${userId.slice(0, 6)}`;
    const { data: created, error: insertError } = await supabase
      .from('profiles')
      .insert({ id: userId, pseudo: defaultPseudo })
      .select()
      .single();
    if (insertError) {
      messageEl.textContent = 'Impossible de créer ton profil.';
      messageEl.classList.add('is-error');
      return;
    }
    pseudoInput.value = created.pseudo;
    montantInput.value = created.montant;
  } else {
    pseudoInput.value = profile.pseudo;
    montantInput.value = profile.montant;
  }

  await loadHistorique();
}

quickChips.forEach((chip) => {
  chip.addEventListener('click', () => {
    const delta = Number(chip.dataset.quickAdd);
    const current = Number(montantInput.value) || 0;
    montantInput.value = Math.max(0, current + delta);
  });
});

saveBtn.addEventListener('click', async () => {
  const pseudo = pseudoInput.value.trim();
  const montant = Number(montantInput.value);

  messageEl.textContent = '';
  messageEl.classList.remove('is-error', 'is-success');

  if (!pseudo) {
    messageEl.textContent = 'Le pseudo ne peut pas être vide.';
    messageEl.classList.add('is-error');
    return;
  }
  if (Number.isNaN(montant) || montant < 0) {
    messageEl.textContent = 'Le montant doit être un nombre positif.';
    messageEl.classList.add('is-error');
    return;
  }

  saveBtn.disabled = true;
  const { error } = await supabase
    .from('profiles')
    .update({ pseudo, montant })
    .eq('id', userId);
  saveBtn.disabled = false;

  if (error) {
    messageEl.textContent = error.message.includes('duplicate') ? 'Ce pseudo est déjà pris.' : 'La sauvegarde a échoué.';
    messageEl.classList.add('is-error');
    return;
  }

  messageEl.textContent = 'Enregistré.';
  messageEl.classList.add('is-success');
  await loadHistorique();
});

async function loadHistorique() {
  const { data, error } = await supabase
    .from('historique')
    .select('ancien_montant, nouveau_montant, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(20);

  historiqueBody.innerHTML = '';

  if (error || !data || data.length === 0) {
    historiqueEmpty.classList.remove('is-hidden');
    return;
  }
  historiqueEmpty.classList.add('is-hidden');

  data.forEach((h) => {
    const row = document.createElement('tr');
    const delta = Number(h.nouveau_montant) - Number(h.ancien_montant);
    const sign = delta >= 0 ? '+' : '';
    const deltaClass = delta >= 0 ? 'positive' : 'negative';
    const date = new Date(h.created_at).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    row.innerHTML = `<td>${date}</td><td class="num">${fmt(h.ancien_montant)} → ${fmt(h.nouveau_montant)}</td><td class="num ${deltaClass}">${sign}${fmt(delta)}</td>`;
    historiqueBody.appendChild(row);
  });
}

init();
