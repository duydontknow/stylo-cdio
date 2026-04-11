// src/utils/aiLogic.js
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);

// ============================================================
// HELPERS & CONSTANTS
// ============================================================

/**
 * Tạo ID duy nhất cho outfit ở phía client.
 * Dùng crypto.randomUUID() nếu có, fallback sang timestamp+random.
 */
const generateOutfitId = () =>
    typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(36).slice(2)}`;

/**
 * Kiểm tra xem một item có phải là Dress/One-piece không.
 * QUAN TRỌNG: "Chân váy" (skirt) là Bottoms, không phải Dresses.
 * Chỉ check theo `type` từ database, không dùng name matching dễ false-positive.
 */
const isDressItem = (item) => {
    const type = item?.categories?.type;
    return type === "Dresses" || type === "One-piece";
};

/**
 * Kiểm tra xem một mảng items có đáp ứng cấu trúc outfit hợp lệ không.
 * Rule: (Tops + Bottoms) HOẶC (Dress/One-piece)
 */
const validateOutfitCore = (items) => {
    const hasTop = items.some((i) => i?.categories?.type === "Tops");
    const hasBottom = items.some((i) => i?.categories?.type === "Bottoms");
    const hasDress = items.some(isDressItem);
    return (hasTop && hasBottom) || hasDress;
};

/**
 * Parse JSON an toàn từ response text của Gemini.
 * Trích xuất JSON array dù AI có thêm markdown fence hay text thừa.
 */
const safeParseOutfitJSON = (rawText) => {
    // Thử parse thẳng trước
    try {
        const parsed = JSON.parse(rawText);
        if (Array.isArray(parsed)) return parsed;
    } catch (_) {
        // Tiếp tục thử regex
    }

    // Tìm JSON array trong text (phòng khi AI wrap bằng ```json ... ```)
    const match = rawText.match(/\[[\s\S]*\]/);
    if (match) {
        try {
            const parsed = JSON.parse(match[0]);
            if (Array.isArray(parsed)) return parsed;
        } catch (_) {
            // Không parse được
        }
    }

    throw new Error(`AI trả về định dạng JSON không hợp lệ. Raw: ${rawText.slice(0, 200)}`);
};

/**
 * Validate schema của 1 suggestion object từ AI.
 * Đảm bảo AI không trả về object thiếu field.
 */
const isValidSuggestionSchema = (suggestion) =>
    suggestion &&
    typeof suggestion === "object" &&
    typeof suggestion.name === "string" &&
    typeof suggestion.reason === "string" &&
    Array.isArray(suggestion.itemIds) &&
    suggestion.itemIds.length > 0;


// ============================================================
// MAIN: GỢI Ý OUTFIT BẰNG GEMINI LLM
// ============================================================

export const suggestOutfitsWithLLM = async (
    wardrobe,
    weatherTemp,
    contextInfo, // { context: string, style: string }
    profile,
) => {
    // Guard: Kiểm tra tủ đồ có đủ để tạo outfit không
    const canFormTwoPiece =
        wardrobe.some((w) => w.categories?.type === "Tops") &&
        wardrobe.some((w) => w.categories?.type === "Bottoms");
    const canFormDress = wardrobe.some(isDressItem);

    if (!canFormTwoPiece && !canFormDress) {
        console.warn("Tủ đồ không đủ để tạo outfit: cần (Tops + Bottoms) hoặc ít nhất 1 Dress.");
        return [];
    }

    try {
        const model = genAI.getGenerativeModel({
            model: "gemini-2.5-flash",
            generationConfig: {
                responseMimeType: "application/json",
            },
        });

        // 1. Lọc và tối giản dữ liệu gửi đi.
        // Trộn description vào name để AI hiểu rõ đặc điểm cụ thể của từng món đồ.
        const simplifiedWardrobe = wardrobe.map((item) => {
            const categoryName = item.categories?.name || "Chưa phân loại";
            const displayName = item.description
                ? `${categoryName} (${item.description})`
                : categoryName;

            return {
                id: item.id,
                name: displayName,
                type: item.categories?.type ?? "Unknown", // Tops | Bottoms | Dresses | Footwear | Outerwear | Accessories
                hex_color: item.color_hex,
                weather: item.weather_suitability,
            };
        });

        // 2. Chuẩn bị đặc tả hình thể
        const profileInfo =
            profile && (profile.body_shape || profile.skin_tone)
                ? `- Dáng người: ${profile.body_shape || "Không rõ"}\n- Tông da: ${profile.skin_tone || "Không rõ"}`
                : "- Chưa có hồ sơ dáng người.";

        // 3. Prompt được tối ưu hoá toàn diện
        const prompt = `
            VAI TRÒ: Trợ lý Stylist cao cấp (High-end Fashion Stylist). 
            Bối cảnh:
            - Nhiệt độ ngoài trời: ${weatherTemp}°C
            - Nhu cầu/Sự kiện: ${contextInfo.context}
            - Phong cách ưu tiên: ${contextInfo.style || "Bất kỳ"}
            ${profileInfo}
            - Tủ đồ (JSON): ${JSON.stringify(simplifiedWardrobe)}

            NHIỆM VỤ: Chọn đồ từ Tủ Đồ và phối CHÍNH XÁC 3 bộ trang phục (outfit) khác nhau.
            (Hệ thống sẽ chỉ hiển thị 2 bộ tốt nhất, nhưng cần 3 để có dự phòng nếu 1 bộ không đạt chuẩn.)

            ═══ YÊU CẦU TỐI THƯỢNG (PHẢI TUÂN THỦ TUYỆT ĐỐI) ═══

            [QUY TẮC 1 - CẤU TRÚC CỐT LÕI]:
            Mỗi outfit BẮT BUỘC phải thỏa MỘT trong hai điều kiện sau:
              ✔ OPTION A: Có ít nhất 1 món type="Tops" (áo thun, sơ mi...) VÀ 1 món type="Bottoms" (quần, chân váy...).
              ✔ OPTION B: Có ít nhất 1 món type="Dresses" hoặc type="One-piece" (váy liền thân, đầm, jumpsuit...).
            NGHIÊM CẤM: Outfit chỉ có Outerwear mà thiếu Tops/Bottoms/Dresses sẽ bị hệ thống tự động loại bỏ.

            [QUY TẮC 2 - KHÔNG TRÙNG LẶP]:
            - KHÔNG lặp lại cùng 1 món đồ trong cùng một outfit.
            - CỐ GẮNG KHÔNG lặp lại cùng 1 món đồ ở cả 3 outfit (nếu tủ đồ đủ rộng).
            - 3 outfit phải có MÀU SẮC và PHONG CÁCH rõ ràng khác nhau.
            
            [QUY TẮC 3 - PHỐI HỢP]:
            - Có thể thêm Footwear và Accessories để hoàn thiện outfit.
            - Màu sắc (hex_color) phải phối hợp hài hòa theo lý thuyết bánh xe màu.
            - Outerwear là tùy chọn thêm, KHÔNG ĐƯỢC dùng nó thay thế Tops hay Dresses.

            [QUY TẮC 4 - THỰC TẾ]:
            - CHỈ dùng itemIds có trong danh sách Tủ đồ JSON ở trên. NGHIÊM CẤM bịa ID.
            - Ưu tiên món đồ phù hợp với weather: ${weatherTemp}°C.

            ═══ OUTPUT FORMAT BẮT BUỘC ═══
            Trả về mảng JSON gồm đúng 3 phần tử theo schema:
            [
              {
                "name": "Tên concept ngắn gọn (tối đa 5 chữ)",
                "reason": "Giải thích chi tiết tại sao bộ đồ này lại phù hợp (30-60 chữ). Đề cập đến sự phối hợp màu sắc, chất liệu, tính ứng dụng trong thời tiết ${weatherTemp}°C và hoàn cảnh ${contextInfo.context}. Hãy dùng ngôn ngữ thời thượng, cuốn hút.",
                "itemIds": ["id_uuid_1", "id_uuid_2", "id_uuid_3"]
              },
              {
                "name": "...",
                "reason": "...",
                "itemIds": ["..."]
              },
              {
                "name": "...",
                "reason": "...",
                "itemIds": ["..."]
              }
            ]
        `;

        const result = await model.generateContent(prompt);
        const responseText = result.response.text();

        // Parse an toàn — không crash nếu AI trả về text lỗi
        const aiSuggestions = safeParseOutfitJSON(responseText);

        // 4. Build dữ liệu trả về cho UI & Validation toàn diện
        const finalOutfits = aiSuggestions
            .map((suggestion, idx) => {
                // 4a. Validate schema của suggestion
                if (!isValidSuggestionSchema(suggestion)) {
                    console.warn(`[Outfit #${idx + 1}] Bị loại do schema không hợp lệ:`, suggestion);
                    return null;
                }

                // 4b. Dedup IDs trong cùng 1 outfit (phòng AI trùng lặp)
                const uniqueIds = [...new Set(suggestion.itemIds)];

                // 4c. Map IDs về wardrobe items thực tế, loại rác
                const items = uniqueIds
                    .map((id) => wardrobe.find((w) => w.id === id))
                    .filter(Boolean);

                if (items.length === 0) {
                    console.warn(`[Outfit #${idx + 1}] "${suggestion.name}" bị loại do không có item hợp lệ nào.`);
                    return null;
                }

                // 4d. Validate cấu trúc cốt lõi
                if (!validateOutfitCore(items)) {
                    console.warn(
                        `[Outfit #${idx + 1}] "${suggestion.name}" bị loại do thiếu thành phần cốt lõi.`,
                        items.map((i) => `${i.categories?.name}(${i.categories?.type})`),
                    );
                    return null;
                }

                return {
                    id: generateOutfitId(),
                    name: suggestion.name,
                    reason: suggestion.reason,
                    items,
                };
            })
            .filter(Boolean)
            .slice(0, 2); // Chỉ lấy 2 outfit tốt nhất sau validation

        // Nếu AI không đủ outfit hợp lệ, bù bằng fallback random
        if (finalOutfits.length < 2) {
            const needed = 2 - finalOutfits.length;
            console.warn(`AI chỉ cho ${finalOutfits.length} outfit hợp lệ, bù thêm ${needed} outfit fallback...`);

            // Tránh trùng item với những outfit AI đã tạo
            const usedItemIds = new Set(finalOutfits.flatMap((o) => o.items.map((i) => i.id)));
            const remainingWardrobe = wardrobe.filter((w) => !usedItemIds.has(w.id));

            const fallbacks = buildFallbackOutfits(remainingWardrobe.length >= 2 ? remainingWardrobe : wardrobe)
                .slice(0, needed)
                .map((f) => ({ ...f, name: `Gợi ý Bổ sung`, reason: `Hệ thống bổ sung bộ đồ này vì AI chỉ tạo được ${finalOutfits.length} gợi ý đạt chuẩn. ` + f.reason }));

            return [...finalOutfits, ...fallbacks];
        }

        return finalOutfits;
    } catch (error) {
        console.error("Lỗi Gemini AI:", error);
        console.log("Kích hoạt chế độ Fallback Random...");
        return buildFallbackOutfits(wardrobe);
    }
};


// ============================================================
// FALLBACK: Khi AI lỗi, tạo outfit ngẫu nhiên hợp lệ
// ============================================================

/**
 * Bốc ngẫu nhiên 1 phần tử từ mảng.
 */
const pickRandom = (arr) => arr[Math.floor(Math.random() * arr.length)];

/**
 * Build tối đa 2 outfit ngẫu nhiên hợp lệ khi AI không hoạt động.
 * Ưu tiên sự đa dạng (1 Two-piece + 1 Dress nếu có đủ đồ).
 */
const buildFallbackOutfits = (wardrobe) => {
    const tops = wardrobe.filter((w) => w.categories?.type === "Tops");
    const bottoms = wardrobe.filter((w) => w.categories?.type === "Bottoms");
    const dresses = wardrobe.filter(isDressItem);
    const shoes = wardrobe.filter((w) => w.categories?.type === "Footwear");
    const accessories = wardrobe.filter((w) => w.categories?.type === "Accessories");

    const canTwoPiece = tops.length > 0 && bottoms.length > 0;
    const canDress = dresses.length > 0;

    if (!canTwoPiece && !canDress) return [];

    const outfits = [];

    const buildOutfit = (useDress) => {
        let coreItems = [];
        if (useDress) {
            coreItems = [pickRandom(dresses)];
        } else {
            coreItems = [pickRandom(tops), pickRandom(bottoms)];
        }

        const extras = [
            shoes.length > 0 ? pickRandom(shoes) : null,
            accessories.length > 0 ? pickRandom(accessories) : null,
        ].filter(Boolean);

        return {
            id: generateOutfitId(),
            name: "Gợi ý Dự phòng",
            reason: "Hệ thống AI tạm thời không khả dụng. Đây là bộ trang phục ngẫu nhiên an toàn dành cho bạn.",
            items: [...coreItems, ...extras],
        };
    };

    // Outfit 1: ưu tiên Two-piece
    if (canTwoPiece) {
        outfits.push(buildOutfit(false));
    } else {
        outfits.push(buildOutfit(true));
    }

    // Outfit 2: nếu có thể, tạo outfit với phong cách khác (Dress nếu có, hoặc Two-piece lần 2)
    if (outfits.length < 2) {
        if (canDress) outfits.push(buildOutfit(true));
        else if (canTwoPiece) outfits.push(buildOutfit(false));
    } else if (outfits.length === 1) {
        if (canDress && !(!canTwoPiece)) outfits.push(buildOutfit(true));
        else if (canTwoPiece && tops.length > 1) outfits.push(buildOutfit(false));
    }

    return outfits;
};


// ============================================================
// PHÂN TÍCH HÌNH ẢNH BẰNG GEMINI VISION
// ============================================================

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
    { name: "Cam", hex: "#f97316" },
    { name: "Tím", hex: "#a855f7" },
];

/**
 * Chuyển đổi File thành định dạng InlineData cho Gemini Vision.
 */
export const fileToGenerativePart = async (file) => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
            const base64Data = reader.result.split(",")[1];
            resolve({
                inlineData: { data: base64Data, mimeType: file.type },
            });
        };
        reader.onerror = () => reject(new Error("Không thể đọc file ảnh."));
        reader.readAsDataURL(file);
    });
};

/**
 * Phân tích hình ảnh trang phục bằng Gemini Vision API.
 * Trả về { category_id, color_hex, description }
 */
export const analyzeClothingImage = async (imagePart, categoriesList) => {
    try {
        const model = genAI.getGenerativeModel({
            model: "gemini-2.5-flash",
            generationConfig: { responseMimeType: "application/json" },
        });

        const simplifiedCategories = categoriesList.map((c) => ({
            id: c.id,
            name: c.name,
            type: c.type,
        }));

        const prompt = `
            BẠN LÀ MỘT CHUYÊN GIA THỜI TRANG VÀ NHẬN DIỆN HÌNH ẢNH.
            Nhiệm vụ của bạn là phân tích hình ảnh quần áo được cung cấp và trích xuất thông tin.

            YÊU CẦU:
            1. PHÂN LOẠI TRANG PHỤC: Nhận diện loại trang phục trong ảnh. Đối chiếu với danh sách sau:
            ${JSON.stringify(simplifiedCategories)}
            QUY TẮC: Tìm ra "id" khớp nhất. Chú ý phân biệt: "Chân váy" là Bottoms, "Đầm/Váy liền" là Dresses.
            Hạn chế chọn danh mục "(Khác)" trừ khi món đồ quá đặc biệt không thuộc nhóm nào.

            2. NHẬN DIỆN MÀU SẮC CHỦ ĐẠO: Lấy mã "hex" gần giống nhất từ danh sách màu sau:
            ${JSON.stringify(PREDEFINED_COLORS)}
            Chỉ trả về mã hex (VD: "#000000"), không trả về tên màu.

            3. MIÊU TẢ CHI TIẾT (QUAN TRỌNG):
            Phân tích kỹ lưỡng các đặc điểm của món đồ để tạo ra một bản mô tả chuyên nghiệp (khoảng 20-40 chữ). 
            Cấu trúc mô tả nên bao gồm:
            - Loại đồ & Form dáng: (VD: Áo Blazer dáng Oversize, Quần Jean Baggy ống rộng, Đầm body-con ôm sát...).
            - Chi tiết thiết kế: (VD: Cổ vest bẻ rộng, rách gối phá cách, tay lỡ, cúc đôi kim loại...).
            - Chất liệu & Cảm giác: (VD: Vải Tweed dày dặn, Cotton mềm mịn, Da bóng sang trọng, Len sợi thô...).
            - Họa tiết & Điểm nhấn: (VD: Họa tiết Houndstooth, trơn tối giản, sọc kẻ thanh lịch, thêu logo ngực...).
            Viết như một Stylist đang giới thiệu sản phẩm trong một bộ sưu tập thời trang cao cấp.

            BẮT BUỘC TRẢ VỀ JSON THUẦN TÚY (không có markdown fence) THEO FORMAT:
            {
              "category_id": "uuid-của-danh-mục",
              "color_hex": "#xxxxxx",
              "description": "Mô tả ngắn gọn"
            }
        `;

        const result = await model.generateContent([prompt, imagePart]);
        const responseText = result.response.text();

        // Parse an toàn cho vision response
        try {
            return JSON.parse(responseText);
        } catch (_) {
            // Thử tìm JSON object nếu AI wrap bằng markdown
            const match = responseText.match(/\{[\s\S]*\}/);
            if (match) return JSON.parse(match[0]);
            throw new Error("AI trả về response không phải JSON hợp lệ.");
        }
    } catch (error) {
        console.error("Lỗi AI phân tích hình ảnh:", error);
        throw error;
    }
};