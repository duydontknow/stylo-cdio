# 👕 STYLO - Trợ lý Thời trang AI (AI Wardrobe Stylist)

Ứng dụng quản lý tủ đồ và gợi ý phối trang phục thông minh dựa trên thời tiết và GenAI (Google Gemini).

## 🚀 Hướng dẫn cài đặt và chạy dự án (Local Setup)

Yêu cầu môi trường: Đã cài đặt **Node.js** (phiên bản 18+).

**Bước 1: Clone dự án về máy**
\`\`\`
git clone https://github.com/duydontknow/stylo-cdio.git  |
cd stylo-cdio
\`\`\`

**Bước 2: Cài đặt các thư viện phụ thuộc (Dependencies)**
\`\`\`
npm install
\`\`\`

**Bước 3: Thiết lập Biến môi trường (Environment Variables)**
1. Copy file `.env.example` và đổi tên bản sao thành `.env`.
2. Mở file `.env` và điền các khóa API (API Keys):
   - `VITE_SUPABASE_URL` & `VITE_SUPABASE_ANON_KEY`: Lấy từ Supabase.
   - `VITE_GEMINI_API_KEY`: Lấy từ Google AI Studio.
   - `VITE_WEATHER_API_KEY`: Lấy từ OpenWeatherMap.

**Bước 4: Khởi chạy ứng dụng**
\`\`\`
npm run dev
\`\`\`
Mở trình duyệt và truy cập vào đường dẫn: `http://localhost:5173`
