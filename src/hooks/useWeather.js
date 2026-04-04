import { useState, useEffect } from "react";

export const useWeather = () => {
    const [weather, setWeather] = useState({
        temp: null,
        condition: "",
        location: "",
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const API_KEY = import.meta.env.VITE_WEATHER_API_KEY;

    // 🔥 Lấy tên location chuẩn bằng reverse geocoding (Nominatim)
    const getLocationName = async (lat, lon) => {
        try {
            const res = await fetch(
                `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`,
            );
            const data = await res.json();

            // Ưu tiên city > town > village
            return (
                data.address.city ||
                data.address.town ||
                data.address.village ||
                data.address.state ||
                "Không rõ"
            );
        } catch {
            return "Không rõ";
        }
    };

    const fetchWeather = async (lat, lon) => {
        try {
            const res = await fetch(
                `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&lang=vi&appid=${API_KEY}`,
            );

            if (!res.ok) throw new Error("Lỗi lấy thời tiết");

            const data = await res.json();

            //lấy location chuẩn
            const locationName = await getLocationName(lat, lon);

            setWeather({
                temp: Math.round(data.main.temp),
                condition: data.weather[0].description,
                location: locationName,
            });
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        // Có GPS
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (pos) => {
                    fetchWeather(pos.coords.latitude, pos.coords.longitude);
                },
                async () => {
                    //Bị từ chối → fallback IP
                    try {
                        const res = await fetch("https://ipapi.co/json/");
                        const data = await res.json();

                        fetchWeather(data.latitude, data.longitude);
                    } catch {
                        setError("Không lấy được vị trí");
                        setLoading(false);
                    }
                },
            );
        } else {
            setError("Trình duyệt không hỗ trợ GPS");
            setLoading(false);
        }
    }, []);

    return { weather, loading, error };
};
