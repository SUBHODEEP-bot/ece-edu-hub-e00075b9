-- Ensure admin@ece.edu has admin role on current user id
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::app_role
FROM auth.users
WHERE email = 'admin@ece.edu'
ON CONFLICT (user_id, role) DO UPDATE SET role = EXCLUDED.role;