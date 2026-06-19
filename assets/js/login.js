import { supabase } from './supabase-client.js';

const form = document.querySelector('[data-auth-form]');
const emailInput = document.querySelector('[data-email]');
const passwordInput = document.querySelector('[data-password]');
const submitBtn = document.querySelector('[data-submit]');
const toggleBtn = document.querySelector('[data-toggle-mode]');
const messageEl = document.querySelector('[data-message]');
const titleEl = document.querySelector('[data-form-title]');

let mode = 'login'; // 'login' | 'signup'

function applyMode() {
  if (mode === 'login') {
    titleEl.textContent = 'Se connecter';
    submitBtn.textContent = 'Se connecter';
    toggleBtn.textContent = 'Pas encore de compte ? Crée-en un';
    passwordInput.autocomplete = 'current-password';
  } else {
    titleEl.textContent = 'Créer un compte';
    submitBtn.textContent = 'Créer mon compte';
    toggleBtn.textContent = 'Déjà un compte ? Connecte-toi';
    passwordInput.autocomplete = 'new-password';
  }
  messageEl.textContent = '';
  messageEl.classList.remove('is-error', 'is-success');
}

toggleBtn.addEventListener('click', () => {
  mode = mode === 'login' ? 'signup' : 'login';
  applyMode();
});

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  submitBtn.disabled = true;
  messageEl.textContent = '';
  messageEl.classList.remove('is-error', 'is-success');

  const email = emailInput.value.trim();
  const password = passwordInput.value;

  const { data, error } = mode === 'login'
    ? await supabase.auth.signInWithPassword({ email, password })
    : await supabase.auth.signUp({ email, password });

  submitBtn.disabled = false;

  if (error) {
    messageEl.textContent = traduireErreur(error.message);
    messageEl.classList.add('is-error');
    return;
  }

  if (mode === 'signup' && !data.session) {
    messageEl.textContent = 'Compte créé. Vérifie ta boîte mail pour confirmer ton adresse, puis connecte-toi.';
    messageEl.classList.add('is-success');
    return;
  }

  window.location.href = 'compte.html';
});

function traduireErreur(msg) {
  if (msg.includes('Invalid login credentials')) return 'Email ou mot de passe incorrect.';
  if (msg.includes('User already registered')) return 'Un compte existe déjà avec cet email.';
  if (msg.includes('Password should be at least')) return 'Le mot de passe doit contenir au moins 6 caractères.';
  return msg;
}

(async () => {
  const { data: { session } } = await supabase.auth.getSession();
  if (session) window.location.href = 'compte.html';
})();

applyMode();
