// src/services/clothes.js
import { supabase } from "./supabase";
import { processBackgroundRemoval } from "../utils/removeBg";

// Lấy danh sách danh mục (để đưa vào dropdown chọn loại áo)
export const getCategories = async () => {
    const { data, error } = await supabase
        .from("categories")
        .select("*")
        .order("name");
    if (error) throw error;
    return data;
};

// Lấy danh sách quần áo của một user
export const getUserClothes = async (userId) => {
    const { data, error } = await supabase
        .from("clothes")
        .select(
            `
      *,
      categories (name, type)
    `,
        )
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

    if (error) throw error;
    return data;
};

// Hàm tải ảnh lên Storage và lưu thông tin vào Database
export const addCloth = async (file, clothData) => {
    try {
        // Thực hiện xóa phông trước khi upload (nếu có API Key)
        const { file: processedFile, error: bgError } = await processBackgroundRemoval(file);

        if (bgError) {
            console.warn("Background removal failed, uploading original file.", bgError);
        }

        // 1. Tạo tên file ngẫu nhiên để không bị trùng
        const fileExt = processedFile.name.split(".").pop() || "png";
        const fileName = `${clothData.user_id}-${Math.random()}.${fileExt}`;

        // 2. Upload file ảnh lên bucket 'clothes'
        const { error: uploadError } = await supabase.storage
            .from("clothes")
            .upload(fileName, processedFile);

        if (uploadError) throw uploadError;

        // 3. Lấy đường dẫn (URL) public của ảnh vừa upload
        const { data: publicUrlData } = supabase.storage
            .from("clothes")
            .getPublicUrl(fileName);

        const imageUrl = publicUrlData.publicUrl;

        // 4. Lưu thông tin trang phục (kèm URL ảnh) vào bảng clothes
        const { data, error: dbError } = await supabase
            .from("clothes")
            .insert([
                {
                    user_id: clothData.user_id,
                    category_id: clothData.category_id,
                    image_url: imageUrl,
                    color_hex: clothData.color_hex,
                    weather_suitability: clothData.weather_suitability,
                },
            ])
            .select();

        if (dbError) throw dbError;
        return data[0];
    } catch (error) {
        console.error("Lỗi khi thêm trang phục:", error);
        throw error;
    }
};

// Cập nhật trạng thái trang phục (VD: Từ Sạch -> Đang giặt)
export const updateClothStatus = async (id, newStatus) => {
    const { data, error } = await supabase
        .from("clothes")
        .update({ status: newStatus })
        .eq("id", id)
        .select();

    if (error) throw error;
    return data[0];
};

// Xóa trang phục khỏi CSDL
export const deleteCloth = async (id) => {
    // Lệnh này sẽ xóa record trong database
    const { error } = await supabase.from("clothes").delete().eq("id", id);

    if (error) throw error;
    return true;
};

// Cập nhật thông tin chi tiết quần áo (Edit)
export const updateClothDetails = async (id, updates) => {
    const { error } = await supabase
        .from("clothes")
        .update(updates)
        .eq("id", id);

    if (error) throw error;
    return true;
};
