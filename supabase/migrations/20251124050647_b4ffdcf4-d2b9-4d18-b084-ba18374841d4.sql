-- Remove student role for the admin user so only admin remains
DELETE FROM public.user_roles
WHERE user_id = 'aea8ce35-cd96-4a69-9742-6dfc796b1228'
  AND role = 'student'::app_role;