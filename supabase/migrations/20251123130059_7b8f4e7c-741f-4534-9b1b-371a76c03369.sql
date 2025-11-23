-- Create enum for user roles
create type public.app_role as enum ('admin', 'student');

-- Create profiles table
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  name text not null,
  college_email text not null unique,
  mobile_number text not null,
  is_active boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create user_roles table
create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  role app_role not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique (user_id, role)
);

-- Create question papers table
create table public.question_papers (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  subject text not null,
  year text not null,
  semester text not null,
  file_url text not null,
  file_name text not null,
  uploaded_by uuid references auth.users(id) on delete set null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create notes table
create table public.notes (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  subject text not null,
  semester text not null,
  description text,
  file_url text not null,
  file_name text not null,
  uploaded_by uuid references auth.users(id) on delete set null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create syllabus table
create table public.syllabus (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  semester text not null,
  academic_year text not null,
  description text,
  file_url text not null,
  file_name text not null,
  uploaded_by uuid references auth.users(id) on delete set null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create events table
create table public.events (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null,
  event_date date not null,
  event_time time,
  location text,
  organizer text not null,
  image_url text,
  is_active boolean default true,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create security definer function to check roles
create or replace function public.has_role(_user_id uuid, _role app_role)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.user_roles
    where user_id = _user_id
      and role = _role
  )
$$;

-- Create function to handle new user registration
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, name, college_email, mobile_number)
  values (
    new.id,
    new.raw_user_meta_data->>'name',
    new.email,
    new.raw_user_meta_data->>'mobile_number'
  );
  
  -- Assign student role by default
  insert into public.user_roles (user_id, role)
  values (new.id, 'student');
  
  return new;
end;
$$;

-- Trigger for new user creation
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Enable RLS
alter table public.profiles enable row level security;
alter table public.user_roles enable row level security;
alter table public.question_papers enable row level security;
alter table public.notes enable row level security;
alter table public.syllabus enable row level security;
alter table public.events enable row level security;

-- RLS Policies for profiles
create policy "Users can view their own profile"
  on public.profiles for select
  to authenticated
  using (auth.uid() = id);

create policy "Users can update their own profile"
  on public.profiles for update
  to authenticated
  using (auth.uid() = id);

create policy "Admins can view all profiles"
  on public.profiles for select
  to authenticated
  using (public.has_role(auth.uid(), 'admin'));

create policy "Admins can update all profiles"
  on public.profiles for update
  to authenticated
  using (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for user_roles
create policy "Users can view their own roles"
  on public.user_roles for select
  to authenticated
  using (auth.uid() = user_id);

create policy "Admins can view all roles"
  on public.user_roles for select
  to authenticated
  using (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for question_papers
create policy "Anyone can view question papers"
  on public.question_papers for select
  to authenticated
  using (true);

create policy "Admins can insert question papers"
  on public.question_papers for insert
  to authenticated
  with check (public.has_role(auth.uid(), 'admin'));

create policy "Admins can update question papers"
  on public.question_papers for update
  to authenticated
  using (public.has_role(auth.uid(), 'admin'));

create policy "Admins can delete question papers"
  on public.question_papers for delete
  to authenticated
  using (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for notes
create policy "Anyone can view notes"
  on public.notes for select
  to authenticated
  using (true);

create policy "Admins can insert notes"
  on public.notes for insert
  to authenticated
  with check (public.has_role(auth.uid(), 'admin'));

create policy "Admins can update notes"
  on public.notes for update
  to authenticated
  using (public.has_role(auth.uid(), 'admin'));

create policy "Admins can delete notes"
  on public.notes for delete
  to authenticated
  using (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for syllabus
create policy "Anyone can view syllabus"
  on public.syllabus for select
  to authenticated
  using (true);

create policy "Admins can insert syllabus"
  on public.syllabus for insert
  to authenticated
  with check (public.has_role(auth.uid(), 'admin'));

create policy "Admins can update syllabus"
  on public.syllabus for update
  to authenticated
  using (public.has_role(auth.uid(), 'admin'));

create policy "Admins can delete syllabus"
  on public.syllabus for delete
  to authenticated
  using (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for events
create policy "Anyone can view active events"
  on public.events for select
  to authenticated
  using (is_active = true or public.has_role(auth.uid(), 'admin'));

create policy "Admins can insert events"
  on public.events for insert
  to authenticated
  with check (public.has_role(auth.uid(), 'admin'));

create policy "Admins can update events"
  on public.events for update
  to authenticated
  using (public.has_role(auth.uid(), 'admin'));

create policy "Admins can delete events"
  on public.events for delete
  to authenticated
  using (public.has_role(auth.uid(), 'admin'));

-- Create storage bucket for documents
insert into storage.buckets (id, name, public)
values ('documents', 'documents', true);

-- Storage policies
create policy "Authenticated users can view documents"
  on storage.objects for select
  to authenticated
  using (bucket_id = 'documents');

create policy "Admins can upload documents"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'documents' and public.has_role(auth.uid(), 'admin'));

create policy "Admins can update documents"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'documents' and public.has_role(auth.uid(), 'admin'));

create policy "Admins can delete documents"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'documents' and public.has_role(auth.uid(), 'admin'));