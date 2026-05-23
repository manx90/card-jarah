-- حقول الملف الشخصي للمستخدم (name, phone)
ALTER TABLE users ADD COLUMN IF NOT EXISTS name VARCHAR(120);
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone VARCHAR(24);

UPDATE users SET name = 'mansiyah'
WHERE role = 'admin' AND (name IS NULL OR TRIM(name) = '');
