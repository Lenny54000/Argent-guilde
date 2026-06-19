import { supabase } from './supabase-client.js';

// Met à jour la nav (liens visibles/cachés selon l'état de connexion),
// branche le bouton de déconnexion, et renvoie la session courante
// pour que chaque page puisse l'utiliser.
export async function initNav() {
  const loginLink = document.querySelector('[data-nav="login"]');
  const logoutBtn = document.querySelector('[data-nav="logout"]');
  const compteLink = document.querySelector('[data-nav="compte"]');
  const adminLink = document.querySelector('[data-nav="admin"]');

  const { data: { session } } = await supabase.auth.getSession();

  if (session) {
    loginLink?.classList.add('is-hidden');
    logoutBtn?.classList.remove('is-hidden');
    compteLink?.classList.remove('is-hidden');

    const { data: profile } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', session.user.id)
      .maybeSingle();

    if (profile?.is_admin) {
      adminLink?.classList.remove('is-hidden');
    } else {
      adminLink?.classList.add('is-hidden');
    }
  } else {
    loginLink?.classList.remove('is-hidden');
    logoutBtn?.classList.add('is-hidden');
    compteLink?.classList.add('is-hidden');
    adminLink?.classList.add('is-hidden');
  }

  logoutBtn?.addEventListener('click', async () => {
    await supabase.auth.signOut();
    window.location.href = 'index.html';
  });

  return session;
}
