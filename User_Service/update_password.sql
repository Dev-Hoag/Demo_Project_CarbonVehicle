USE user_service_db;
UPDATE users SET password_hash='$2b$10$gJ2oF7BmYDm8r67BU5AhPu8cfeivQXYY9mk8GkRmBJYeT5N4VFqKS' WHERE id=34;
SELECT id, email, LEFT(password_hash, 40) as updated_hash FROM users WHERE id=34;
