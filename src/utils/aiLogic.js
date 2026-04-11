// src/utils/aiLogic.js
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);

export const suggestOutfitsWithLLM = async (
    wardrobe,
    weatherTemp,
    contextInfo, // { context: "Đi chơi", style: "Minimalist" }
    profile,
) => {
    if (wardrobe.length < 2) {
        console.warn("Tủ đồ quá ít món, cần ít nhất 2 món để phối.");
        return [];
    }

    try {
        const model = genAI.getGenerativeModel({
            model: "gemini-2.5-flash",
            generationConfig: {
                // Ép AI luôn luôn trả về chuẩn JSON thuần tuý
                responseMimeType: "application/json",
            },
        });

        // 2. Lọc và tối giản dữ liệu gửi đi. 
        // QUAN TRỌNG: Trộn description vào name để AI Stylist hiểu rõ món đồ hơn.
        const simplifiedWardrobe = wardrobe.map((item) => {
            // Nếu có description (đã bao gồm tên loại đồ), ưu tiên dùng nó để AI hiểu tự nhiên hơn.
            const displayName = item.description || item.categories?.name;

            return {
                id: item.id,
                name: displayName,
                type: item.categories?.type, // Tops, Bottoms, Footwear, Outerwear...
                hex_color: item.color_hex,
                weather: item.weather_suitability,
            };
        });

        // 3. Chuẩn bị đặc tả hình thể
        const profileInfo =
            profile && (profile.body_shape || profile.skin_tone)
                ? `- Dáng người: ${profile.body_shape || "Không rõ"}\n- Tông da: ${profile.skin_tone || "Không rõ"}`
                : "- Chưa có hồ sơ dáng người.";

        // 4. Prompt Siêu cấp
        const prompt = `
            VAI TRÒ: Trợ lý Stylist cao cấp (High-end Fashion Stylist). 
            Bối cảnh:
            - Nhiệt độ ngoài trời: ${weatherTemp}°C
            - Nhu cầu/Sự kiện: ${contextInfo.context}
            - Phong cách ưu tiên: ${contextInfo.style || "Bất kỳ"}
            ${profileInfo}
            - Tủ đồ (JSON): ${JSON.stringify(simplifiedWardrobe)}

            NHIỆM VỤ: Hãy chọn đồ từ Tủ Đồ và phối CHÍNH XÁC 2 bộ trang phục (outfit) khác nhau.

            YÊU CẦU TỐI THƯỢNG (PHẢI TUÂN THỦ):
            1. CẤU TRÚC BẮT BUỘC: Mỗi outfit PHẢI CÓ ÍT NHẤT 1 món loại "Tops" (Áo mặc trong như áo thun, sơ mi) VÀ 1 món loại "Bottoms" (Quần hoặc Váy).
            2. QUY TẮC OUTERWEAR: Áo khoác (Outerwear) là tùy chọn thêm. Tuyệt đối KHÔNG ĐƯỢC dùng "Outerwear" để thay thế cho "Tops". Một bộ đồ chỉ có Áo khoác và Quần mà không có áo thun/sơ mi bên trong là SAI quy tắc.
            3. PHỐI HỢP THÊM: Có thể mix thêm Giày (Footwear) và Phụ kiện (Accessories) để hoàn thiện bộ đồ.
            
            YÊU CẦU LOGIC KHÁC:
            - Màu sắc (hex_color) phải phối hợp hài hòa (bánh xe màu sắc, tương phản hoặc đơn sắc).
            - KHÔNG bịa ra đồ không có trong mã Tủ đồ JSON. KHÔNG lặp lại một món đồ ở cả 2 bộ nếu tủ đồ đủ rộng.
            - Viết 1 lý do (reason) cực kỳ chuyên nghiệp giải thích tại sao bộ này hợp với hoàn cảnh, thời tiết và cơ thể. CHÚ Ý: Hãy sử dụng thông tin từ trường "name" của món đồ để miêu tả chi tiết lý do phối đồ.
            
            SCHEMA OUTPUT BẮT BUỘC (Trả về mảng JSON đúng sơ đồ sau):
            [
              {
                "name": "Tên concept ngắn gọn",
                "reason": "Lý do súc tích dưới 40 chữ",
                "itemIds": ["id1", "id2", "id3"]
              }
            ]
        `;

        const result = await model.generateContent(prompt);
        const responseText = result.response.text();
        const aiSuggestions = JSON.parse(responseText);

        // 5. Build dữ liệu trả về cho UI & Validation Check
        const finalOutfits = aiSuggestions
            .map((suggestion) => {
                const items = suggestion.itemIds
                    .map((id) => wardrobe.find((w) => w.id === id))
                    .filter(Boolean);

                // BƯỚC VALIDATION
                const hasInnerTop = items.some(i => i.categories?.type === "Tops");
                const hasBottom = items.some(i => i.categories?.type === "Bottoms");

                if (!hasInnerTop || !hasBottom) {
                    console.warn(`Outfit "${suggestion.name}" bị loại vì thiếu Tops hoặc Bottoms.`);
                    return null;
                }

                return {
                    id: Date.now() + Math.random(),
                    name: suggestion.name,
                    reason: suggestion.reason,
                    items: items,
                };
            })
            .filter(Boolean);

        return finalOutfits;
    } catch (error) {
        console.error("Lỗi Gemini AI:", error);
        console.log("Kích hoạt chế độ Fallback Random...");
        // ... (phần fallback giữ nguyên)
        const tops = wardrobe.filter((w) => w.categories?.type === "Tops");
        const bottoms = wardrobe.filter((w) => w.categories?.type === "Bottoms");
        const shoes = wardrobe.filter((w) => w.categories?.type === "Footwear");

        if (tops.length > 0 && bottoms.length > 0) {
            const randomTop = tops[Math.floor(Math.random() * tops.length)];
            const randomBottom = bottoms[Math.floor(Math.random() * bottoms.length)];
            const randomShoe = shoes.length > 0 ? shoes[Math.floor(Math.random() * shoes.length)] : null;

            return [{
                id: Date.now(),
                name: "Gợi ý Dự phòng (Safe Outfit)",
                reason: "Hệ thống AI hiện đang nghỉ ngơi, chúng tôi đã ngẫu nhiên chọn một bộ trang phục an toàn cho bạn.",
                items: [randomTop, randomBottom, randomShoe].filter(Boolean),
            }];
        }
        return [];
    }
};

// Hàm tiện ích chuyển đổi File thành định dạng base64
export const fileToGenerativePart = async (file) => {
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => {
            const base64Data = reader.result.split(",")[1];
            resolve({
                inlineData: { data: base64Data, mimeType: file.type },
            });
        };
        reader.readAsDataURL(file);
    });
};

// Hàm phân tích hình ảnh trang phục bằng Gemini Vision API
export const analyzeClothingImage = async (imagePart, categoriesList) => {
    try {
        const model = genAI.getGenerativeModel({
            model: "gemini-2.5-flash",
            generationConfig: { responseMimeType: "application/json" },
        });

        const PREDEFINED_COLORS = [
            { name: "Đen", hex: "#000000" }, { name: "Trắng", hex: "#ffffff" },
            { name: "Xám", hex: "#9ca3af" }, { name: "Be/Kem", hex: "#fef3c7" },
            { name: "Nâu", hex: "#8b4513" }, { name: "Xanh Navy", hex: "#1e3a8a" },
            { name: "Xanh Dương", hex: "#3b82f6" }, { name: "Đỏ", hex: "#ef4444" },
            { name: "Xanh lá", hex: "#22c55e" }, { name: "Hồng", hex: "#ec4899" },
            { name: "Vàng", hex: "#eab308" },
        ];

        const simplifiedCategories = categoriesList.map((c) => ({
            id: c.id, name: c.name, type: c.type,
        }));

        const prompt = `
            BẠN LÀ MỘT CHUYÊN GIA THỜI TRANG VÀ NHẬN DIỆN HÌNH ẢNH.
            Nhiệm vụ của bạn là phân tích hình ảnh quần áo được cung cấp và trích xuất thông tin.

            YÊU CẦU:
            1. PHÂN LOẠI TRANG PHỤC: Nhận diện loại trang phục trong ảnh. Đối chiếu với danh sách sau:
            ${JSON.stringify(simplifiedCategories)}
            QUY TẮC: Tìm ra "id" khớp nhất. Hạn chế chọn các danh mục "(Khác)".

            2. NHẬN DIỆN MÀU SẮC CHỦ ĐẠO: Lấy mã "hex" gần giống nhất từ danh sách:
            ${JSON.stringify(PREDEFINED_COLORS)}

            3. MIÊU TẢ CHI TIẾT (QUAN TRỌNG): Hãy viết 1 câu NGẮN GỌN (khoảng 3-6 chữ) bao gồm cả tên loại đồ và đặc điểm họa tiết/kiểu dáng chính (Ví dụ: "Áo thun trắng cổ tim", "Quần jean rách gối", "Áo sơ mi họa tiết hoa", "Áo khoác da biker"). Cố gắng viết tự nhiên như cách người dùng gọi tên món đồ.

            BẮT BUỘC TRẢ VỀ JSON THUẦN TÚY THEO FORMAT:
            {
              "category_id": "...",
              "color_hex": "...",
              "description": "..."
            }
        `;

        const result = await model.generateContent([prompt, imagePart]);
        const responseText = result.response.text();
        return JSON.parse(responseText);
    } catch (error) {
        console.error("Lỗi AI phân tích hình ảnh:", error);
        throw error;
    }
};