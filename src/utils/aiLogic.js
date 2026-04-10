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
                // Ép AI luôn luôn trả về chuẩn JSON thuần tuý (không kèm Markdown ```json)
                responseMimeType: "application/json",
            },
        });

        // 2. Lọc và tối giản dữ liệu gửi đi để tiết kiệm Token
        const simplifiedWardrobe = wardrobe.map((item) => ({
            id: item.id,
            name: item.categories?.name,
            type: item.categories?.type, // Tops, Bottoms, Footwear, Outerwear...
            hex_color: item.color_hex, // AI có thể phân tích sắc thái màu qua mã HEX
            weather: item.weather_suitability,
        }));

        // 3. Chuẩn bị đặc tả hình thể
        const profileInfo =
            profile && (profile.body_shape || profile.skin_tone)
                ? `- Dáng người: ${profile.body_shape || "Không rõ"}\n- Tông da: ${profile.skin_tone || "Không rõ"}`
                : "- Chưa có hồ sơ dáng người.";

        // 4. Prompt Siêu cấp chuẩn Senior (Tối ưu cho JSON MimeType)
        const prompt = `
            VAI TRÒ: Trợ lý Stylist cao cấp (High-end Fashion Stylist). 
            Bối cảnh:
            - Nhiệt độ ngoài trời: ${weatherTemp}°C
            - Nhu cầu/Sự kiện: ${contextInfo.context}
            - Phong cách ưu tiên: ${contextInfo.style || "Bất kỳ"}
            ${profileInfo}
            - Tủ đồ (JSON): ${JSON.stringify(simplifiedWardrobe)}

            NHIỆM VỤ: Hãy chọn đồ từ Tủ Đồ và phối CHÍNH XÁC 2 bộ trang phục (outfit) khác nhau.

            YÊU CẦU LOGIC:
            1. Mỗi outfit PHẢI CÓ đủ phần thân trên (Tops) và thân dưới (Bottoms). Có thể thêm áo khoác (Outerwear) và giày (Footwear) nếu thời tiết/phong cách phù hợp.
            2. Màu sắc (hex_color) phải matching với nhau (ví dụ: bánh xe màu sắc, đơn sắc, tương phản) và tôn được Tông da. Dáng áo/quần phải che được khuyết điểm Dáng người.
            3. KHÔNG bịa ra đồ không có trong mã Tủ đồ JSON. KHÔNG lặp lại một món đồ ở cả 2 bộ nếu tủ đồ đủ rộng.
            4. Viết 1 lý do (reason) cực kỳ súc tích giải thích tại sao bộ này hợp với hoàn cảnh, thời tiết và cơ thể.
            
            SCHEMA OUTPUT BẮT BUỘC (Trả về mảng JSON đúng sơ đồ sau):
            [
              {
                "name": "Tên concept ngắn gọn (VD: Thanh lịch mùa thu)",
                "reason": "Lý do súc tích dưới 40 chữ",
                "itemIds": ["id1", "id2", "id3"]
              }
            ]
        `;

        const result = await model.generateContent(prompt);
        const responseText = result.response.text();

        // Vì đã set responseMimeType là application/json, text trả về mặc định là JSON sạch.
        const aiSuggestions = JSON.parse(responseText);

        // 5. Build dữ liệu trả về cho UI
        const finalOutfits = aiSuggestions
            .map((suggestion) => {
                const items = suggestion.itemIds
                    .map((id) => wardrobe.find((w) => w.id === id))
                    .filter(Boolean); // Lọc id sai lệch

                return {
                    id: Date.now() + Math.random(),
                    name: suggestion.name,
                    reason: suggestion.reason,
                    items: items,
                };
            })
            .filter((o) => o.items.length >= 2);

        return finalOutfits;
    } catch (error) {
        console.error("Lỗi Gemini AI:", error);
        console.log("Kích hoạt chế độ Fallback Random...");

        const tops = wardrobe.filter((w) => w.categories?.type === "Tops");
        const bottoms = wardrobe.filter(
            (w) => w.categories?.type === "Bottoms",
        );
        const shoes = wardrobe.filter((w) => w.categories?.type === "Footwear");

        if (tops.length > 0 && bottoms.length > 0) {
            // Lấy ramdom 1 cái áo và 1 cái quần thay vì lấy cái đầu tiên
            const randomTop = tops[Math.floor(Math.random() * tops.length)];
            const randomBottom =
                bottoms[Math.floor(Math.random() * bottoms.length)];
            const randomShoe =
                shoes.length > 0
                    ? shoes[Math.floor(Math.random() * shoes.length)]
                    : null;

            return [
                {
                    id: Date.now(),
                    name: "Gợi ý Dự phòng (Safe Outfit)",
                    reason: "Hệ thống AI hiện đang nghỉ ngơi, chúng tôi đã ngẫu nhiên chọn một bộ trang phục an toàn cho bạn.",
                    items: [randomTop, randomBottom, randomShoe].filter(
                        Boolean,
                    ),
                },
            ];
        }

        return [];
    }
};

// Hàm tiện ích chuyển đổi File thành định dạng base64 cho Gemini API
export const fileToGenerativePart = async (file) => {
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => {
            const base64Data = reader.result.split(",")[1];
            resolve({
                inlineData: {
                    data: base64Data,
                    mimeType: file.type,
                },
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
            generationConfig: {
                responseMimeType: "application/json",
            },
        });

        // Bảng màu chuẩn theo yêu cầu
        const PREDEFINED_COLORS = [
            { name: "Đen", hex: "#000000" },
            { name: "Trắng", hex: "#ffffff" },
            { name: "Xám", hex: "#9ca3af" },
            { name: "Be/Kem", hex: "#fef3c7" },
            { name: "Nâu", hex: "#8b4513" },
            { name: "Xanh Navy", hex: "#1e3a8a" },
            { name: "Xanh Dương", hex: "#3b82f6" },
            { name: "Đỏ", hex: "#ef4444" },
            { name: "Xanh lá", hex: "#22c55e" },
            { name: "Hồng", hex: "#ec4899" },
            { name: "Vàng", hex: "#eab308" },
        ];

        // Tối giản hoá danh sách category để tăng độ chính xác của AI
        const simplifiedCategories = categoriesList.map((c) => ({
            id: c.id,
            name: c.name,
            type: c.type,
        }));

        const prompt = `
            BẠN LÀ MỘT CHUYÊN GIA THỜI TRANG VÀ NHẬN DIỆN HÌNH ẢNH.
            Nhiệm vụ của bạn là phân tích hình ảnh quần áo được cung cấp và trích xuất thông tin.

            YÊU CẦU:
            1. PHÂN LOẠI TRANG PHỤC: Nhận diện loại trang phục trong ảnh. Đối chiếu với danh sách các loại trang phục (Categories) sau đây:
            ${JSON.stringify(simplifiedCategories)}
            Hãy tìm ra "id" của loại trang phục khớp nhất hoặc gần giống nhất với ảnh.

            2. NHẬN DIỆN MÀU SẮC CHỦ ĐẠO: Phân tích màu sắc chính của trang phục. Đối chiếu với danh sách bảng màu sau:
            ${JSON.stringify(PREDEFINED_COLORS)}
            Hãy lấy mã "hex" của màu sắc gần giống nhất theo mắt người.

            BẮT BUỘC TRẢ VỀ KẾT QUẢ DƯỚI DẠNG JSON THUẦN TÚY THEO FORMAT SAU:
            {
              "category_id": "...",
              "color_hex": "..."
            }
            
            Lưu ý: Chỉ trả về đoạn JSON, tuyệt đối không giải thích thêm hay bọc bằng markdown (như \`\`\`json).
        `;

        const result = await model.generateContent([prompt, imagePart]);
        const responseText = result.response.text();
        return JSON.parse(responseText);
    } catch (error) {
        console.error("Lỗi AI phân tích hình ảnh:", error);
        throw error;
    }
};
