export async function processBackgroundRemoval(file) {
    const apiKey = import.meta.env.VITE_REMOVE_BG_API_KEY;

    // Nếu không cấu hình Key, trả về file gốc
    if (!apiKey) {
        console.log("No Remove.bg API key found. Skipping background removal.");
        return { file: file, isRemoved: false };
    }

    try {
        const formData = new FormData();
        formData.append("image_file", file);
        formData.append("size", "auto");

        const response = await fetch("https://api.remove.bg/v1.0/removebg", {
            method: "POST",
            headers: {
                "X-Api-Key": apiKey,
            },
            body: formData,
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error("Lỗi từ Remove.bg:", errorText);
            throw new Error(`Remove.bg failed: ${response.statusText}`);
        }

        // Lấy dữ liệu ảnh dưới dạng Blob
        const blob = await response.blob();
        
        // Chuyển lại Blob thành File, ép kiểu png (vì xoá phông xong nó ra dạng transparent image)
        const newFileName = file.name.replace(/\.[^/.]+$/, "") + "-no-bg.png";
        const noBgFile = new File([blob], newFileName, { type: "image/png" });

        return { file: noBgFile, isRemoved: true };
    } catch (error) {
        console.error("Xảy ra lỗi khi xoá khung nền:", error);
        // Trả về file gốc nếu thất bại để ứng dụng vẫn chạy tiếp thay vì chặn đứng upload
        return { file: file, isRemoved: false, error: error.message };
    }
}
