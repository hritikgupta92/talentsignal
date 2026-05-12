-- TalentSignal Supabase schema
-- Reset-safe for the app-owned public schema objects. This wipes app data, not auth.users.

create extension if not exists pgcrypto;

drop trigger if exists on_auth_user_created on auth.users;
drop function if exists public.handle_new_auth_user();
drop function if exists public.ensure_current_user(public.user_role, text);
drop function if exists public.add_recruiter_hiring_tag(uuid, text);
drop function if exists public.remove_recruiter_hiring_tag(uuid, uuid);

drop table if exists public.follows cascade;
drop table if exists public.active_jobs cascade;
drop table if exists public.profile_activities cascade;
drop table if exists public.experiences cascade;
drop table if exists public.recruiter_hiring_tags cascade;
drop table if exists public.hiring_tags cascade;
drop table if exists public.recruiter_profiles cascade;
drop table if exists public.users cascade;

drop type if exists public.hiring_status cascade;
drop type if exists public.user_role cascade;

create type public.user_role as enum ('recruiter', 'jobseeker');
create type public.hiring_status as enum ('actively-hiring', 'selectively-hiring', 'networking');

create table public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  role public.user_role not null default 'jobseeker',
  full_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.recruiter_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete set null,
  slug text not null unique,
  name text not null,
  headline text not null,
  company text,
  location text,
  avatar_url text,
  bio text,
  hiring_status public.hiring_status not null default 'networking',
  followers_count integer not null default 0,
  response_rate integer not null default 0,
  placements_count integer not null default 0,
  is_published boolean not null default false,
  linkedin_url text,
  website_url text,
  contact_email text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.experiences (
  id uuid primary key default gen_random_uuid(),
  recruiter_profile_id uuid not null references public.recruiter_profiles(id) on delete cascade,
  company text not null,
  role text not null,
  start_date text not null,
  end_date text not null,
  is_current boolean not null default false,
  description text,
  sort_order integer not null default 0
);

create table public.hiring_tags (
  id uuid primary key default gen_random_uuid(),
  label text not null unique,
  category text not null default 'domain'
);

create table public.recruiter_hiring_tags (
  recruiter_profile_id uuid not null references public.recruiter_profiles(id) on delete cascade,
  hiring_tag_id uuid not null references public.hiring_tags(id) on delete cascade,
  primary key (recruiter_profile_id, hiring_tag_id)
);

create table public.active_jobs (
  id uuid primary key default gen_random_uuid(),
  recruiter_profile_id uuid not null references public.recruiter_profiles(id) on delete cascade,
  title text not null,
  company text not null,
  location text,
  seniority text,
  is_active boolean not null default true,
  sort_order integer not null default 0
);

create table public.profile_activities (
  id uuid primary key default gen_random_uuid(),
  recruiter_profile_id uuid not null references public.recruiter_profiles(id) on delete cascade,
  title text not null,
  description text,
  activity_date text not null,
  sort_order integer not null default 0
);

create table public.follows (
  id uuid primary key default gen_random_uuid(),
  jobseeker_id uuid not null references public.users(id) on delete cascade,
  recruiter_profile_id uuid not null references public.recruiter_profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (jobseeker_id, recruiter_profile_id)
);

alter table public.users enable row level security;
alter table public.recruiter_profiles enable row level security;
alter table public.experiences enable row level security;
alter table public.hiring_tags enable row level security;
alter table public.recruiter_hiring_tags enable row level security;
alter table public.active_jobs enable row level security;
alter table public.profile_activities enable row level security;
alter table public.follows enable row level security;

create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  selected_role public.user_role;
begin
  selected_role :=
    case
      when new.raw_user_meta_data ->> 'role' in ('recruiter', 'jobseeker')
        then (new.raw_user_meta_data ->> 'role')::public.user_role
      else 'jobseeker'::public.user_role
    end;

  insert into public.users (id, email, role, full_name)
  values (
    new.id,
    new.email,
    selected_role,
    new.raw_user_meta_data ->> 'full_name'
  )
  on conflict (id) do update
  set
    email = excluded.email,
    role = excluded.role,
    full_name = excluded.full_name,
    updated_at = now();

  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_auth_user();

create or replace function public.ensure_current_user(
  selected_role public.user_role default 'jobseeker',
  selected_full_name text default null
)
returns public.users
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid;
  current_email text;
  current_full_name text;
  result public.users;
begin
  current_user_id := auth.uid();

  if current_user_id is null then
    raise exception 'Not authenticated';
  end if;

  current_email := coalesce(auth.jwt() ->> 'email', '');
  current_full_name := coalesce(
    selected_full_name,
    auth.jwt() -> 'user_metadata' ->> 'full_name',
    split_part(current_email, '@', 1)
  );

  insert into public.users (id, email, role, full_name)
  values (
    current_user_id,
    current_email,
    selected_role,
    current_full_name
  )
  on conflict (id) do update
  set
    email = excluded.email,
    role = excluded.role,
    full_name = excluded.full_name,
    updated_at = now()
  returning * into result;

  return result;
end;
$$;

grant execute on function public.ensure_current_user(public.user_role, text) to authenticated;

create or replace function public.add_recruiter_hiring_tag(
  selected_profile_id uuid,
  selected_label text
)
returns public.hiring_tags
language plpgsql
security definer
set search_path = public
as $$
declare
  normalized_label text;
  tag_row public.hiring_tags;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  if not exists (
    select 1
    from public.recruiter_profiles rp
    where rp.id = selected_profile_id
      and rp.user_id = auth.uid()
  ) then
    raise exception 'You do not own this recruiter profile';
  end if;

  normalized_label := trim(regexp_replace(selected_label, '\s+', ' ', 'g'));

  if normalized_label = '' then
    raise exception 'Tag label is required';
  end if;

  insert into public.hiring_tags (label, category)
  values (normalized_label, 'domain')
  on conflict (label) do update
  set label = excluded.label
  returning * into tag_row;

  insert into public.recruiter_hiring_tags (recruiter_profile_id, hiring_tag_id)
  values (selected_profile_id, tag_row.id)
  on conflict do nothing;

  return tag_row;
end;
$$;

create or replace function public.remove_recruiter_hiring_tag(
  selected_profile_id uuid,
  selected_tag_id uuid
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  if not exists (
    select 1
    from public.recruiter_profiles rp
    where rp.id = selected_profile_id
      and rp.user_id = auth.uid()
  ) then
    raise exception 'You do not own this recruiter profile';
  end if;

  delete from public.recruiter_hiring_tags
  where recruiter_profile_id = selected_profile_id
    and hiring_tag_id = selected_tag_id;
end;
$$;

grant execute on function public.add_recruiter_hiring_tag(uuid, text) to authenticated;
grant execute on function public.remove_recruiter_hiring_tag(uuid, uuid) to authenticated;

insert into public.users (id, email, role, full_name)
select
  au.id,
  au.email,
  case
    when au.raw_user_meta_data ->> 'role' in ('recruiter', 'jobseeker')
      then (au.raw_user_meta_data ->> 'role')::public.user_role
    else 'jobseeker'::public.user_role
  end,
  au.raw_user_meta_data ->> 'full_name'
from auth.users au
on conflict (id) do update
set
  email = excluded.email,
  role = excluded.role,
  full_name = excluded.full_name,
  updated_at = now();

create policy "Users can read own record" on public.users
  for select using (auth.uid() = id);

create policy "Users can insert own record" on public.users
  for insert with check (auth.uid() = id);

create policy "Users can update own record" on public.users
  for update using (auth.uid() = id) with check (auth.uid() = id);

create policy "Published recruiter profiles are public" on public.recruiter_profiles
  for select using (is_published = true or auth.uid() = user_id);

create policy "Recruiters can insert own profile" on public.recruiter_profiles
  for insert with check (auth.uid() = user_id);

create policy "Recruiters can update own profile" on public.recruiter_profiles
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Experiences readable with public profile" on public.experiences
  for select using (
    exists (
      select 1 from public.recruiter_profiles rp
      where rp.id = recruiter_profile_id
        and (rp.is_published = true or rp.user_id = auth.uid())
    )
  );

create policy "Recruiters manage own experiences" on public.experiences
  for all using (
    exists (
      select 1 from public.recruiter_profiles rp
      where rp.id = recruiter_profile_id and rp.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.recruiter_profiles rp
      where rp.id = recruiter_profile_id and rp.user_id = auth.uid()
    )
  );

create policy "Hiring tags are public" on public.hiring_tags
  for select using (true);

create policy "Authenticated users can create hiring tags" on public.hiring_tags
  for insert to authenticated with check (true);

create policy "Recruiter tag links readable with public profile" on public.recruiter_hiring_tags
  for select using (
    exists (
      select 1 from public.recruiter_profiles rp
      where rp.id = recruiter_profile_id
        and (rp.is_published = true or rp.user_id = auth.uid())
    )
  );

create policy "Recruiters manage own tag links" on public.recruiter_hiring_tags
  for all using (
    exists (
      select 1 from public.recruiter_profiles rp
      where rp.id = recruiter_profile_id and rp.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.recruiter_profiles rp
      where rp.id = recruiter_profile_id and rp.user_id = auth.uid()
    )
  );

create policy "Recruiters insert own tag links" on public.recruiter_hiring_tags
  for insert with check (
    exists (
      select 1 from public.recruiter_profiles rp
      where rp.id = recruiter_profile_id and rp.user_id = auth.uid()
    )
  );

create policy "Recruiters delete own tag links" on public.recruiter_hiring_tags
  for delete using (
    exists (
      select 1 from public.recruiter_profiles rp
      where rp.id = recruiter_profile_id and rp.user_id = auth.uid()
    )
  );

create policy "Active jobs readable with public profile" on public.active_jobs
  for select using (
    exists (
      select 1 from public.recruiter_profiles rp
      where rp.id = recruiter_profile_id
        and (
          rp.user_id = auth.uid()
          or (rp.is_published = true and is_active = true)
        )
    )
  );

create policy "Recruiters insert own active jobs" on public.active_jobs
  for insert with check (
    exists (
      select 1 from public.recruiter_profiles rp
      where rp.id = recruiter_profile_id and rp.user_id = auth.uid()
    )
  );

create policy "Recruiters update own active jobs" on public.active_jobs
  for update using (
    exists (
      select 1 from public.recruiter_profiles rp
      where rp.id = recruiter_profile_id and rp.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.recruiter_profiles rp
      where rp.id = recruiter_profile_id and rp.user_id = auth.uid()
    )
  );

create policy "Recruiters delete own active jobs" on public.active_jobs
  for delete using (
    exists (
      select 1 from public.recruiter_profiles rp
      where rp.id = recruiter_profile_id and rp.user_id = auth.uid()
    )
  );

create policy "Activities readable with public profile" on public.profile_activities
  for select using (
    exists (
      select 1 from public.recruiter_profiles rp
      where rp.id = recruiter_profile_id
        and (rp.is_published = true or rp.user_id = auth.uid())
    )
  );

create policy "Jobseekers can follow recruiters" on public.follows
  for insert with check (auth.uid() = jobseeker_id);

create policy "Users can read own follows" on public.follows
  for select using (auth.uid() = jobseeker_id);

create policy "Users can unfollow recruiters" on public.follows
  for delete using (auth.uid() = jobseeker_id);

insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do update set public = excluded.public;

drop policy if exists "Avatar images are public" on storage.objects;
drop policy if exists "Authenticated users upload avatars" on storage.objects;
drop policy if exists "Authenticated users update avatars" on storage.objects;
drop policy if exists "Authenticated users delete avatars" on storage.objects;

create policy "Avatar images are public" on storage.objects
  for select using (bucket_id = 'avatars');

create policy "Authenticated users upload avatars" on storage.objects
  for insert to authenticated with check (bucket_id = 'avatars');

create policy "Authenticated users update avatars" on storage.objects
  for update to authenticated using (bucket_id = 'avatars') with check (bucket_id = 'avatars');

create policy "Authenticated users delete avatars" on storage.objects
  for delete to authenticated using (bucket_id = 'avatars');

insert into public.hiring_tags (label, category) values
  ('AI / ML', 'domain'),
  ('Frontend', 'domain'),
  ('Platform', 'domain'),
  ('Product Design', 'domain'),
  ('GTM', 'domain'),
  ('Senior+', 'seniority'),
  ('Remote', 'location'),
  ('Full-time', 'employment')
on conflict (label) do update set category = excluded.category;

insert into public.recruiter_profiles (
  slug,
  name,
  headline,
  company,
  location,
  avatar_url,
  bio,
  hiring_status,
  followers_count,
  response_rate,
  placements_count,
  is_published,
  linkedin_url,
  website_url,
  contact_email
) values
  (
    'maya-chen',
    'Maya Chen',
    'Principal technical recruiter for AI product teams',
    'Northstar Labs',
    'San Francisco, CA',
    'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=320&q=80',
    'I partner with founders building applied AI products and help senior engineers find teams with clear technical taste, strong managers, and sane interview loops.',
    'actively-hiring',
    8420,
    92,
    138,
    true,
    '#',
    '#',
    'maya@northstar.example'
  ),
  (
    'jon-bell',
    'Jon Bell',
    'Design and product recruiter for early-stage teams',
    'Signal Foundry',
    'New York, NY',
    'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=320&q=80',
    'I help product designers, design engineers, and founding PMs evaluate company quality before they spend energy on a process.',
    'selectively-hiring',
    5130,
    86,
    91,
    true,
    '#',
    '#',
    null
  ),
  (
    'amara-okafor',
    'Amara Okafor',
    'Infrastructure recruiter for remote-first engineering orgs',
    'VectorWorks',
    'Austin, TX',
    'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?auto=format&fit=crop&w=320&q=80',
    'I focus on platform, security, SRE, and engineering leadership searches for teams that care about durable engineering practices.',
    'actively-hiring',
    3720,
    89,
    104,
    true,
    '#',
    null,
    'amara@vector.example'
  )
on conflict (slug) do update
set
  name = excluded.name,
  headline = excluded.headline,
  company = excluded.company,
  location = excluded.location,
  avatar_url = excluded.avatar_url,
  bio = excluded.bio,
  hiring_status = excluded.hiring_status,
  followers_count = excluded.followers_count,
  response_rate = excluded.response_rate,
  placements_count = excluded.placements_count,
  is_published = excluded.is_published,
  linkedin_url = excluded.linkedin_url,
  website_url = excluded.website_url,
  contact_email = excluded.contact_email,
  updated_at = now();

insert into public.recruiter_hiring_tags (recruiter_profile_id, hiring_tag_id)
select rp.id, ht.id
from public.recruiter_profiles rp
join public.hiring_tags ht on ht.label in ('AI / ML', 'Frontend', 'Senior+', 'Remote')
where rp.slug = 'maya-chen'
on conflict do nothing;

insert into public.recruiter_hiring_tags (recruiter_profile_id, hiring_tag_id)
select rp.id, ht.id
from public.recruiter_profiles rp
join public.hiring_tags ht on ht.label in ('Product Design', 'GTM', 'Senior+', 'Full-time')
where rp.slug = 'jon-bell'
on conflict do nothing;

insert into public.recruiter_hiring_tags (recruiter_profile_id, hiring_tag_id)
select rp.id, ht.id
from public.recruiter_profiles rp
join public.hiring_tags ht on ht.label in ('Platform', 'Senior+', 'Remote', 'Full-time')
where rp.slug = 'amara-okafor'
on conflict do nothing;

insert into public.experiences (recruiter_profile_id, company, role, start_date, end_date, description, sort_order)
select rp.id, item.company, item.role, item.start_date, item.end_date, item.description, item.sort_order
from public.recruiter_profiles rp
join (
  values
    ('maya-chen', 'Northstar Labs', 'Principal Recruiter', '2022', 'Present', 'Owns engineering and product recruiting across applied AI, developer tools, and data infrastructure.', 1),
    ('maya-chen', 'Stripe', 'Senior Technical Recruiter', '2018', '2022', 'Built hiring pipelines for product engineering teams across payments, risk, and growth.', 2),
    ('jon-bell', 'Signal Foundry', 'Talent Partner', '2020', 'Present', 'Leads recruiting for portfolio companies from seed to Series B.', 1),
    ('jon-bell', 'Wellfound', 'Marketplace Lead', '2016', '2020', 'Helped launch curated matching programs for startup talent.', 2),
    ('amara-okafor', 'VectorWorks', 'Recruiting Lead', '2021', 'Present', 'Runs distributed recruiting pods across platform and security roles.', 1),
    ('amara-okafor', 'GitHub', 'Technical Recruiter', '2017', '2021', 'Supported infrastructure and enterprise engineering hiring.', 2)
) as item(slug, company, role, start_date, end_date, description, sort_order)
on rp.slug = item.slug;

insert into public.active_jobs (recruiter_profile_id, title, company, location, seniority, sort_order)
select rp.id, item.title, item.company, item.location, item.seniority, item.sort_order
from public.recruiter_profiles rp
join (
  values
    ('maya-chen', 'Staff Frontend Engineer, AI Studio', 'Northstar Labs', 'Remote US', 'Staff', 1),
    ('maya-chen', 'ML Product Engineer', 'Northstar Labs', 'San Francisco', 'Senior', 2),
    ('jon-bell', 'Founding Product Designer', 'Cedar OS', 'NYC Hybrid', 'Lead', 1),
    ('amara-okafor', 'Engineering Manager, Platform', 'VectorWorks', 'Remote', 'Manager', 1),
    ('amara-okafor', 'Senior SRE', 'VectorWorks', 'Remote Americas', 'Senior', 2)
) as item(slug, title, company, location, seniority, sort_order)
on rp.slug = item.slug;

insert into public.profile_activities (recruiter_profile_id, title, description, activity_date, sort_order)
select rp.id, item.title, item.description, item.activity_date, item.sort_order
from public.recruiter_profiles rp
join (
  values
    ('maya-chen', 'Published interview prep guide', 'A concise loop breakdown for applied AI product roles.', 'This week', 1),
    ('maya-chen', 'Closed 4 senior searches', 'Recent placements across frontend platform and ML engineering.', 'Apr 2026', 2),
    ('jon-bell', 'Hosted portfolio review night', 'Met with 28 senior product designers looking at climate and fintech startups.', 'Yesterday', 1),
    ('amara-okafor', 'Updated hiring market notes', 'Remote platform compensation and interview expectations for Q2.', 'May 2026', 1)
) as item(slug, title, description, activity_date, sort_order)
on rp.slug = item.slug;
