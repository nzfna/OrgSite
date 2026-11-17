create table if not exists users (
  id serial primary key, email text unique not null, password_hash text not null, created_at timestamptz default now());
create table if not exists templates (
  key text primary key, name text not null, default_theme jsonb not null);
create table if not exists organizations (
  id serial primary key, owner_id int references users(id) on delete cascade,
  name text not null, slug text unique not null, template text references templates(key),
  theme jsonb not null, sections jsonb not null default '[]', updated_at timestamptz default now());
insert into templates(key,name,default_theme) values
 ('adhikara','Adhikara (bold)','{"primary":"#1d4ed8","bg":"#f5f8ff","text":"#0f172a","font":"Inter, system-ui, sans-serif","radius":16,"dark":false}'),
 ('minimal','Minimal (editorial)','{"primary":"#b45309","bg":"#fffdf8","text":"#1c1917","font":"Georgia, serif","radius":4,"dark":false}')
on conflict (key) do nothing;
