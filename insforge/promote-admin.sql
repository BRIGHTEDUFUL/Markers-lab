-- Promote an existing user to ADMIN (after they register via the app).
-- 1. Register once at /register with your production admin email + strong password.
-- 2. Replace the email below, then run:
--    npx @insforge/cli db query "$(cat insforge/promote-admin.sql)"
--    or paste this in the InsForge SQL editor.
--
-- Example admin email (change before running):
UPDATE public.profiles
SET role = 'ADMIN'
WHERE email = 'admin@yourdomain.com';

-- Verify:
-- SELECT id, email, role FROM public.profiles WHERE email = 'admin@yourdomain.com';
