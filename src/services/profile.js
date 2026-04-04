// src/services/profile.js
import { supabase } from "./supabase";

export const getProfile = async (userId) => {
    const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();

    if (error && error.code !== "PGRST116") {
        // PGRST116 là lỗi không tìm thấy dòng nào, ta bỏ qua
        console.error(error);
    }
    return data;
};

export const upsertProfile = async (userId, profileData) => {
    const { data, error } = await supabase
        .from("profiles")
        .upsert({
            id: userId,
            ...profileData,
            updated_at: new Date(),
        })
        .select()
        .single();

    if (error) throw error;
    return data;
};
