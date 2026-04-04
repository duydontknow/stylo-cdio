// src/services/outfits.js
import { supabase } from "./supabase";

// Lấy danh sách các bộ trang phục của người dùng (kèm theo hình ảnh quần áo bên trong)
export const getUserOutfits = async (userId) => {
    const { data, error } = await supabase
        .from("outfits")
        .select(
            `
      *,
      outfit_items (
        clothes (
          id, image_url, categories (name, type)
        )
      )
    `,
        )
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

    if (error) throw error;
    return data;
};

// Lưu một bộ trang phục mới
export const createOutfit = async (
    userId,
    name,
    season,
    clothIds,
    isAi = false,
) => {
    try {
        // 1. Tạo Outfit gốc
        const { data: outfit, error: outfitError } = await supabase
            .from("outfits")
            .insert([{ user_id: userId, name, season, is_ai_generated: isAi }])
            .select()
            .single();

        if (outfitError) throw outfitError;

        // 2. Liên kết các quần áo vào Outfit này
        const outfitItemsData = clothIds.map((clothId) => ({
            outfit_id: outfit.id,
            cloth_id: clothId,
        }));

        const { error: itemsError } = await supabase
            .from("outfit_items")
            .insert(outfitItemsData);

        if (itemsError) throw itemsError;

        return outfit;
    } catch (error) {
        console.error("Lỗi khi tạo outfit:", error);
        throw error;
    }
};

// Xoá một bộ trang phục đã lưu
export const deleteOutfit = async (outfitId) => {
    const { error } = await supabase
        .from("outfits")
        .delete()
        .eq("id", outfitId);

    if (error) throw error;
    return true;
};

// Cập nhật bộ trang phục (Edit)
export const updateOutfit = async (
    outfitId,
    name,
    weatherSuitability,
    newClothIds,
) => {
    // 1. Cập nhật thông tin chung của bộ đồ
    const { error: outfitError } = await supabase
        .from("outfits")
        .update({ name, weather_suitability: weatherSuitability })
        .eq("id", outfitId);

    if (outfitError) throw outfitError;

    // 2. Xóa các món đồ cũ
    await supabase.from("outfit_items").delete().eq("outfit_id", outfitId);

    // 3. Thêm các món đồ mới vào
    const itemsToInsert = newClothIds.map((clothId) => ({
        outfit_id: outfitId,
        cloth_id: clothId,
    }));

    const { error: itemsError } = await supabase
        .from("outfit_items")
        .insert(itemsToInsert);

    if (itemsError) throw itemsError;

    return true;
};
