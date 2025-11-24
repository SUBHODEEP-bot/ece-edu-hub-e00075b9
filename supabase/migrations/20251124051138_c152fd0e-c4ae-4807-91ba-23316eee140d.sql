-- Change role for subhodeeppal077@gmail.com to student (remove admin role, add student)
DELETE FROM public.user_roles
WHERE user_id IN (SELECT id FROM auth.users WHERE email = 'subhodeeppal077@gmail.com')
  AND role = 'admin'::app_role;

INSERT INTO public.user_roles (user_id, role)
SELECT id, 'student'::app_role
FROM auth.users
WHERE email = 'subhodeeppal077@gmail.com'
ON CONFLICT (user_id, role) DO NOTHING;