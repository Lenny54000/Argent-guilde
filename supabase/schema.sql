-- =========================================================
-- Vanilla SMP — Trésorerie de guilde
-- Schéma Supabase à exécuter dans SQL Editor (une seule fois)
-- =========================================================

-- 1. Profils des membres ------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  pseudo text not null unique,
  montant numeric(10,2) not null default 0 check (montant >= 0),
  is_admin boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 2. Historique des changements de montant -------------------------------
create table public.historique (
  id bigint generated always as identity primary key,
  user_id uuid not null references public.profiles(id) on delete cascade,
  ancien_montant numeric(10,2) not null,
  nouveau_montant numeric(10,2) not null,
  created_at timestamptz not null default now()
);

-- 3. Activer la sécurité au niveau des lignes (RLS) ----------------------
alter table public.profiles enable row level security;
alter table public.historique enable row level security;

-- 4. Fonction utilitaire : l'utilisateur courant est-il admin ? ----------
-- (security definer + propriétaire postgres => contourne RLS, pas de récursion)
create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select coalesce((select is_admin from public.profiles where id = auth.uid()), false);
$$;

-- 5. Policies : profiles --------------------------------------------------
create policy "Lecture publique des profils"
  on public.profiles for select
  using (true);

create policy "Un utilisateur peut créer son propre profil"
  on public.profiles for insert
  with check (auth.uid() = id);

create policy "Un utilisateur peut modifier son propre profil"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

create policy "Un admin peut modifier n'importe quel profil"
  on public.profiles for update
  using (public.is_admin())
  with check (public.is_admin());

create policy "Un admin peut supprimer un profil"
  on public.profiles for delete
  using (public.is_admin());

-- Sécurité anti élévation de privilèges : même un utilisateur connecté
-- ne peut JAMAIS modifier la colonne is_admin depuis le site, qu'il soit
-- admin ou pas. Ça ne peut se faire que depuis l'éditeur SQL Supabase.
revoke update on public.profiles from authenticated;
grant update (pseudo, montant) on public.profiles to authenticated;
grant delete on public.profiles to authenticated;

-- 6. Policies : historique -------------------------------------------------
-- Lecture publique uniquement. Les insertions se font automatiquement via
-- le trigger ci-dessous (en security definer), jamais directement par le client.
create policy "Lecture publique de l'historique"
  on public.historique for select
  using (true);

create policy "Un admin peut supprimer une ligne d'historique"
  on public.historique for delete
  using (public.is_admin());

grant delete on public.historique to authenticated;

-- 7. Création automatique du profil à l'inscription ------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, pseudo)
  values (new.id, 'Joueur_' || substr(new.id::text, 1, 6))
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 8. Historique automatique à chaque changement de montant ------------------
create or replace function public.log_montant_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.montant is distinct from old.montant then
    insert into public.historique (user_id, ancien_montant, nouveau_montant)
    values (new.id, old.montant, new.montant);
  end if;
  new.updated_at = now();
  return new;
end;
$$;

create trigger on_profile_montant_change
  before update on public.profiles
  for each row execute procedure public.log_montant_change();

-- =========================================================
-- Pour te donner les droits admin après ta première inscription
-- sur le site, lance cette requête (remplace l'email) :
--
-- update public.profiles set is_admin = true
-- where id = (select id from auth.users where email = 'ton-email@example.com');
-- =========================================================
