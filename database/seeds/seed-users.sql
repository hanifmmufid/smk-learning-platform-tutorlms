-- SMK Learning Platform - Demo Users Seed
-- Password untuk semua user: admin123, teacher123, student123

-- Clear existing users (optional, hati-hati di production)
-- TRUNCATE TABLE users CASCADE;

-- Insert Admin User
INSERT INTO users (id, email, password, name, role, "createdAt", "updatedAt")
VALUES
  ('admin_001', 'admin@smk.com', '$2b$10$FiubiwMKBMXhn51yftAGfuSPRuCGVB1NlFjLtS/yDC6/dg73sfdX.', 'Administrator', 'ADMIN', NOW(), NOW())
ON CONFLICT (email) DO NOTHING;

-- Insert Teacher Users
INSERT INTO users (id, email, password, name, role, "createdAt", "updatedAt")
VALUES
  ('teacher_001', 'teacher@smk.com', '$2b$10$dDHEGRm7.sJKXaAu8YR5E.lv8QZM838bOh8DqkKUwfpgJmHcBGJdK', 'Budi Santoso', 'TEACHER', NOW(), NOW()),
  ('teacher_002', 'teacher2@smk.com', '$2b$10$dDHEGRm7.sJKXaAu8YR5E.lv8QZM838bOh8DqkKUwfpgJmHcBGJdK', 'Siti Rahayu', 'TEACHER', NOW(), NOW()),
  ('teacher_003', 'teacher3@smk.com', '$2b$10$dDHEGRm7.sJKXaAu8YR5E.lv8QZM838bOh8DqkKUwfpgJmHcBGJdK', 'Ahmad Wijaya', 'TEACHER', NOW(), NOW())
ON CONFLICT (email) DO NOTHING;

-- Insert Student Users
INSERT INTO users (id, email, password, name, role, "createdAt", "updatedAt")
VALUES
  ('student_001', 'student@smk.com', '$2b$10$k7bu71JOUXFAM25LY2uM/e9Psu45kn3bmLfUTQOPoNm3/PTBgtsYK', 'Andi Pratama', 'STUDENT', NOW(), NOW()),
  ('student_002', 'student2@smk.com', '$2b$10$k7bu71JOUXFAM25LY2uM/e9Psu45kn3bmLfUTQOPoNm3/PTBgtsYK', 'Dewi Lestari', 'STUDENT', NOW(), NOW()),
  ('student_003', 'student3@smk.com', '$2b$10$k7bu71JOUXFAM25LY2uM/e9Psu45kn3bmLfUTQOPoNm3/PTBgtsYK', 'Rizki Ramadhan', 'STUDENT', NOW(), NOW()),
  ('student_004', 'student4@smk.com', '$2b$10$k7bu71JOUXFAM25LY2uM/e9Psu45kn3bmLfUTQOPoNm3/PTBgtsYK', 'Putri Amelia', 'STUDENT', NOW(), NOW()),
  ('student_005', 'student5@smk.com', '$2b$10$k7bu71JOUXFAM25LY2uM/e9Psu45kn3bmLfUTQOPoNm3/PTBgtsYK', 'Dimas Prasetyo', 'STUDENT', NOW(), NOW())
ON CONFLICT (email) DO NOTHING;

-- Print success message
SELECT 'Demo users created successfully!' as message;
SELECT COUNT(*) as total_users FROM users;
