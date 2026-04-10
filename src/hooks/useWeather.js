import { useState, useEffect } from "react";

// 🔥 Mapping mã WMO sang mô tả tiếng Việt và Icon (nếu cần)
const getWMOWeather = (code) => {
    const table = {
        0: "Trời quang",
        1: "Cơ bản là quang",
        2: "Mây rải rác",
        3: "Nhiều mây",
        45: "Sương mù",
        48: "Sương giá",
        51: "Mưa phùn nhẹ",
        53: "Mưa phùn vừa",
        55: "Mưa phùn đặc",
        61: "Mưa nhẹ",
        63: "Mưa vừa",
        65: "Mưa to",
        71: "Tuyết nhẹ",
        73: "Tuyết vừa",
        75: "Tuyết mạnh",
        80: "Mưa rào nhẹ",
        81: "Mưa rào vừa",
        82: "Mưa rào mạnh",
        95: "Dông sét nhẹ",
        96: "Dông sét lớn",
        99: "Dông sét mạnh",
    };
    return table[code] || "Không rõ";
};

// 🔥 Gợi ý trang phục theo nhiệt độ & điều kiện
const getWeatherAdvice = (temp, code) => {
    // Ưu tiên theo điều kiện trước
    if ([61, 63, 65, 80, 81, 82].includes(code)) return "Trời có mưa, bạn nên mang theo ô hoặc áo mưa.";
    if ([95, 96, 99].includes(code)) return "Trời có dông sét, hãy hạn chế ra ngoài nếu không cần thiết.";

    // Logic theo nhiệt độ
    if (temp >= 35) return "Trời rất nóng, nên mặc đồ mỏng, thoáng, tránh màu tối.";
    if (temp >= 28) return "Thời tiết nóng, ưu tiên quần áo nhẹ và thoáng mát.";
    if (temp >= 22) return "Thời tiết dễ chịu, có thể phối nhiều kiểu trang phục.";
    if (temp >= 15) return "Trời hơi lạnh, nên mang áo khoác nhẹ.";
    return "Trời lạnh, nên mặc ấm và giữ nhiệt tốt.";
};

export const useWeather = () => {
    const [weather, setWeather] = useState({
        temp: null,
        feelsLike: null,
        condition: "Đang tải...",
        location: "Đang xác định...",
        advice: "",
        code: 0
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // 🔥 Reverse geocoding lấy location đẹp hơn (OSM Nominatim)
    const getLocationName = async (lat, lon) => {
        try {
            const res = await fetch(
                `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`
            );
            const data = await res.json();
            return (
                data.address.city ||
                data.address.town ||
                data.address.village ||
                data.address.state ||
                "Vị trí của bạn"
            );
        } catch {
            return "Vị trí của bạn";
        }
    };

    const fetchWeather = async (lat, lon) => {
        try {
            // Sử dụng Open-Meteo (Không cần API Key)
            const res = await fetch(
                `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&timezone=auto`
            );

            if (!res.ok) throw new Error("Không thể kết nối API thời tiết");

            const data = await res.json();
            const current = data.current_weather;
            
            const locationName = await getLocationName(lat, lon);
            const temp = Math.round(current.temperature);
            const condition = getWMOWeather(current.weathercode);
            const advice = getWeatherAdvice(temp, current.weathercode);

            setWeather({
                temp,
                feelsLike: temp, // Open-Meteo basic free doesn't give feels_like in current_weather
                condition,
                location: locationName,
                advice,
                code: current.weathercode
            });
        } catch (err) {
            console.error("Weather error:", err);
            setError("Lỗi lấy thông tin thời tiết");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (pos) => {
                    fetchWeather(pos.coords.latitude, pos.coords.longitude);
                },
                async () => {
                    // Fallback IP location if GPS denied
                    try {
                        const res = await fetch("https://ipapi.co/json/");
                        const data = await res.json();
                        fetchWeather(data.latitude, data.longitude);
                    } catch {
                        setError("Không xác định được vị trí");
                        setLoading(false);
                    }
                }
            );
        } else {
            setError("Trình duyệt không hỗ trợ GPS");
            setLoading(false);
        }
    }, []);

    return { weather, loading, error };
};