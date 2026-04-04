// src/utils/aiLogic.js
import { GoogleGenerativeAI } from "@google/generative-ai";

// Khởi tạo Gemini AI với API Key từ file .env
const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);

export const suggestOutfitsWithLLM = async (
    wardrobe,
    weatherTemp,
    context,
    profile, // Đã nhận dữ liệu profile từ UI
) => {
    // 1. Kiểm tra an toàn: Nếu tủ đồ ít hơn 2 món thì không gọi AI cho tốn kém
    if (wardrobe.length < 2) {
        console.warn("Tủ đồ quá ít món, cần ít nhất 2 món để phối.");
        return [];
    }

    try {
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

        // 2. Chuẩn bị dữ liệu tủ đồ
        const simplifiedWardrobe = wardrobe.map((item) => ({
            id: item.id,
            name: item.categories?.name,
            type: item.categories?.type,
            color: item.color_hex,
            weather: item.weather_suitability,
        }));

        // 3. Xử lý chuỗi thông tin cơ thể để đưa vào Prompt
        const profileInfo =
            profile && (profile.body_shape || profile.skin_tone)
                ? `- Dáng người: ${profile.body_shape || "Không rõ"}\n- Tông da: ${profile.skin_tone || "Không rõ"}`
                : "- Khách hàng chưa cập nhật dáng người và tông da.";

        // 4. Prompt Siêu cấp chuẩn Senior
        const prompt = `ĐÓNG VAI: 
            Bạn là một Cố vấn Phong cách cá nhân cao cấp, phong cách nói chuyện súc tích, đi thẳng vào vấn đề.

            BỐI CẢNH:
            - Nhiệt độ: ${weatherTemp}°C.
            - Sự kiện: ${context}.
            ${profileInfo}
            - Tủ đồ (JSON): 
            ${JSON.stringify(simplifiedWardrobe)}

            NHIỆM VỤ:
            Tạo 2 bộ trang phục (mỗi bộ 1 'Tops' và 1 'Bottoms', có thể thêm 'Footwear').

            QUY TẮC BẮT BUỘC (TUÂN THỦ 100%):
            1. KHÔNG BỊA ĐẶT: Chỉ được phép miêu tả màu sắc dựa vào trường 'color' trong JSON. Đồ màu đen tuyệt đối không được nói là màu trắng.
            2. SIÊU NGẮN GỌN: Phần lý do (reason) BẮT BUỘC viết dưới 3 câu (tối đa 40 chữ). 
            3. THỰC TẾ: Nêu đúng 1 lý do hợp thời tiết và 1 lý do tôn dáng/tôn da (nếu có profile).

            ĐỊNH DẠNG ĐẦU RA BẮT BUỘC (Chỉ trả về JSON, không Markdown):
            [
            {
                "name": "[Tên concept, vd: Minimalism Công Sở]",
                "reason": "[Viết tối đa 3 câu. Vd: Áo cotton đen thoáng mát hợp 28 độ. Form chữ nhật kết hợp sơ vin giúp tôn dáng gọn gàng.]",
                "itemIds": ["id1", "id2"]
            }
            ]`;

        // 5. Gửi câu hỏi cho AI và chờ kết quả
        const result = await model.generateContent(prompt);
        const responseText = result.response.text();

        // 6. Làm sạch JSON và Parse (Kết hợp replace và cắt chuỗi an toàn tuyệt đối)
        const cleanJson = responseText
            .replace(/```json/g, "")
            .replace(/```/g, "")
            .trim();
        const jsonStart = cleanJson.indexOf("[");
        const jsonEnd = cleanJson.lastIndexOf("]") + 1;

        if (jsonStart === -1 || jsonEnd === 0) {
            throw new Error("AI trả về sai định dạng JSON.");
        }

        const finalJsonString = cleanJson.substring(jsonStart, jsonEnd);
        const aiSuggestions = JSON.parse(finalJsonString);

        // 7. Khớp ID AI trả về với dữ liệu thật
        const finalOutfits = aiSuggestions
            .map((suggestion) => {
                const items = suggestion.itemIds
                    .map((id) => wardrobe.find((w) => w.id === id))
                    .filter(Boolean); // Lọc bỏ id rác

                return {
                    id: Date.now() + Math.random(),
                    name: suggestion.name,
                    reason: suggestion.reason,
                    items: items,
                };
            })
            .filter((o) => o.items.length >= 2); // Đảm bảo bộ đồ phải có ít nhất 2 món

        return finalOutfits;
    } catch (error) {
        // 8. CƠ CHẾ DỰ PHÒNG (FALLBACK) - Bắt mọi loại lỗi: Hết Quota, Mạng lag, AI trả lời ngu,...
        console.error("Lỗi Gemini AI:", error);
        console.log("Kích hoạt chế độ Fallback (Dữ liệu dự phòng)...");

        // Lấy đại áo và quần từ tủ đồ
        const tops = wardrobe.filter((w) => w.categories?.type === "Tops");
        const bottoms = wardrobe.filter(
            (w) => w.categories?.type === "Bottoms",
        );
        const shoes = wardrobe.filter((w) => w.categories?.type === "Footwear");

        if (tops.length > 0 && bottoms.length > 0) {
            return [
                {
                    id: Date.now(),
                    name: "Gợi ý Dự phòng (Safe Outfit)",
                    reason: "Hệ thống AI hiện đang quá tải. Chúng tôi đề xuất bộ trang phục cơ bản này dựa trên những món đồ có sẵn trong tủ của bạn.",
                    items: [
                        tops[0],
                        bottoms[0],
                        shoes.length > 0 ? shoes[0] : null,
                    ].filter(Boolean),
                },
            ];
        }

        return []; // Hết đường thì mới chịu trả về rỗng
    }
};
