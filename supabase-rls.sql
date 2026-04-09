-- Hướng dẫn Thiết lập Row Level Security (RLS) cho hệ thống STYLO

-- KÍCH HOẠT RLS CHO TẤT CẢ CÁC BẢNG (BẮT BUỘC)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE clothes ENABLE ROW LEVEL SECURITY;
ALTER TABLE outfits ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;


-- -------------------------------------------------------------
-- 1. BẢNG PROFILES (Người dùng)
-- -------------------------------------------------------------
-- Bất kỳ ai đăng nhập cũng có thể xem profile của mình
CREATE POLICY "Người dùng có thể xem profile của chính mình" 
ON profiles FOR SELECT 
USING (auth.uid() = id);

-- Chỉ người dùng đó mới có thể cập nhật profile của mình
CREATE POLICY "Người dùng có thể sửa profile của chính mình" 
ON profiles FOR UPDATE 
USING (auth.uid() = id);


-- -------------------------------------------------------------
-- 2. BẢNG CLOTHES (Quần áo trong tủ)
-- -------------------------------------------------------------
-- Ai cũng có thể xem quần áo của "chính mình"
CREATE POLICY "Xem đồ cá nhân" 
ON clothes FOR SELECT 
USING (auth.uid() = user_id);

-- Ai cũng có thể thêm đồ cho "chính mình"
CREATE POLICY "Thêm đồ cá nhân" 
ON clothes FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Chỉ chủ đồ mới có thể sửa đồ
CREATE POLICY "Sửa đồ cá nhân" 
ON clothes FOR UPDATE 
USING (auth.uid() = user_id) 
WITH CHECK (auth.uid() = user_id);

-- Chỉ chủ đồ mới có thể xoá đồ
CREATE POLICY "Xoá đồ cá nhân" 
ON clothes FOR DELETE 
USING (auth.uid() = user_id);


-- -------------------------------------------------------------
-- 3. BẢNG OUTFITS (Phối đồ)
-- -------------------------------------------------------------
-- Tương tự bảng clothes, quản trị quyền sở hữu thông qua user_id
CREATE POLICY "Xem outfit cá nhân" ON outfits FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Thêm outfit cá nhân" ON outfits FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Sửa outfit cá nhân" ON outfits FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Xóa outfit cá nhân" ON outfits FOR DELETE USING (auth.uid() = user_id);


-- -------------------------------------------------------------
-- 4. BẢNG CATEGORIES (Danh mục)
-- -------------------------------------------------------------
-- Ai cũng có thể XEM danh mục
CREATE POLICY "Bất kỳ ai cũng có thể xem danh mục" 
ON categories FOR SELECT 
TO authenticated, anon
USING (true);

-- (Quyền Thêm, Sửa, Xoá danh mục đã được Backend/Bypass RLS lo thông qua RPC)
