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
            hex_color: item.color_hex,
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

            YÊU CẦU TỐI THƯỢNG (PHẢI TUÂN THỦ):
            1. CẤU TRÚC BẮT BUỘC: Mỗi outfit PHẢI CÓ ÍT NHẤT 1 món loại "Tops" (Áo mặc trong như áo thun, sơ mi) VÀ 1 món loại "Bottoms" (Quần hoặc Váy).
            2. QUY TẮC OUTERWEAR: Áo khoác (Outerwear) là tùy chọn thêm. Tuyệt đối KHÔNG ĐƯỢC dùng "Outerwear" để thay thế cho "Tops". Một bộ đồ chỉ có Áo khoác và Quần mà không có áo thun/sơ mi bên trong là SAI quy tắc.
            3. PHỐI HỢP THÊM: Có thể mix thêm Giày (Footwear) và Phụ kiện (Accessories) để hoàn thiện bộ đồ.
            
            YÊU CẦU LOGIC KHÁC:
            - Màu sắc (hex_color) phải phối hợp hài hòa (bánh xe màu sắc, tương phản hoặc đơn sắc).
            - KHÔNG bịa ra đồ không có trong mã Tủ đồ JSON. KHÔNG lặp lại một món đồ ở cả 2 bộ nếu tủ đồ đủ rộng.
            - Viết 1 lý do (reason) cực kỳ chuyên nghiệp giải thích tại sao bộ này hợp với hoàn cảnh, thời tiết và cơ thể.
            
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

        // Vì đã set responseMimeType là application/json, text trả về mặc định là JSON sạch.
        const aiSuggestions = JSON.parse(responseText);

        // 5. Build dữ liệu trả về cho UI & Validation Check
        const finalOutfits = aiSuggestions
            .map((suggestion) => {
                const items = suggestion.itemIds
                    .map((id) => wardrobe.find((w) => w.id === id))
                    .filter(Boolean); // Lọc các ID không tồn tại

                // BƯỚC VALIDATION: Kiểm tra tính hợp lệ của outfit
                // 1. Phải có ít nhất 1 áo mặc trong (Tops)
                const hasInnerTop = items.some(i => i.categories?.type === "Tops");
                // 2. Phải có ít nhất 1 quần/váy (Bottoms)
                const hasBottom = items.some(i => i.categories?.type === "Bottoms");

                // Nếu thiếu 1 trong 2 thành phần cốt lõi, loại bỏ outfit này ngay lập tức
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
            .filter(Boolean); // Loại bỏ các outfit null do không pass bước validation

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
            QUY TẮC PHÂN LOẠI:
            - Tìm ra "id" của loại trang phục khớp nhất hoặc gần giống nhất với ảnh.
            - HẠN CHẾ TỐI ĐA việc chọn các category có tên chứa "(Khác)" hoặc "Khác" trừ khi không còn lựa chọn nào khác phù hợp hơn. Ví dụ: Nếu là Áo thun thì PHẢI chọn Áo thun, không được chọn Áo (Khác).
            - Phân tích kỹ kiểu dáng (cổ áo, tay áo, độ dài) để đưa ra quyết định chính xác nhất.

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
