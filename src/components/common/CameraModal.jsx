import { useRef, useState, useEffect, useCallback } from "react";
import { X, Camera as CameraIcon, Loader2 } from "lucide-react";
import toast from "react-hot-toast";

export default function CameraModal({ onClose, onCapture }) {
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const [stream, setStream] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    const startCamera = useCallback(async () => {
        try {
            const mediaStream = await navigator.mediaDevices.getUserMedia({ 
                video: { facingMode: "environment" } // Ưu tiên camera sau nếu có
            });
            setStream(mediaStream);
            if (videoRef.current) {
                videoRef.current.srcObject = mediaStream;
            }
        } catch (err) {
            console.error("Lỗi truy cập camera:", err);
            toast.error("Không thể truy cập Camera. Hãy kiểm tra quyền trên trình duyệt.");
            onClose();
        } finally {
            setIsLoading(false);
        }
    }, [onClose]);

    useEffect(() => {
        startCamera();
        return () => {
            if (stream) {
                stream.getTracks().forEach((track) => track.stop());
            }
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const capturePhoto = () => {
        if (!videoRef.current || !canvasRef.current) return;

        const video = videoRef.current;
        const canvas = canvasRef.current;
        const context = canvas.getContext("2d");

        // Set canvas dimensions to match video stream
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        // Draw image onto canvas
        context.drawImage(video, 0, 0, canvas.width, canvas.height);

        // Convert to Blob and then File
        canvas.toBlob((blob) => {
            if (!blob) {
                toast.error("Lỗi khi chụp ảnh!");
                return;
            }
            const file = new File([blob], `capture-${Date.now()}.png`, { type: "image/png" });
            
            // Dừng stream trước khi thoát
            if (stream) {
                stream.getTracks().forEach((track) => track.stop());
            }
            
            onCapture(file);
        }, "image/png");
    };

    return (
        <div className="fixed inset-0 bg-black/80 z-[100] flex flex-col items-center justify-center p-4 backdrop-blur-sm">
            <div className="relative w-full max-w-lg bg-black rounded-3xl overflow-hidden border border-gray-800 shadow-2xl flex flex-col">
                {/* Header (Top) */}
                <div className="absolute top-0 inset-x-0 z-10 flex justify-between items-center p-4 bg-gradient-to-b from-black/60 to-transparent">
                    <span className="text-white font-medium text-sm drop-shadow-md">
                        Căn chỉnh trang phục vào khung hình
                    </span>
                    <button
                        onClick={() => {
                            if (stream) stream.getTracks().forEach((track) => track.stop());
                            onClose();
                        }}
                        className="p-2 text-white bg-black/40 hover:bg-black/60 rounded-full transition-colors backdrop-blur-md"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Video Viewfinder */}
                <div className="relative w-full aspect-[3/4] bg-gray-900 flex items-center justify-center overflow-hidden">
                    {isLoading && <Loader2 className="animate-spin text-white w-8 h-8 absolute z-20" />}
                    <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        muted
                        className={`w-full h-full object-cover transition-opacity duration-300 ${isLoading ? 'opacity-0' : 'opacity-100'}`}
                    />
                    <canvas ref={canvasRef} className="hidden" />
                </div>

                {/* Controls (Bottom) */}
                <div className="bg-black p-6 pb-8 flex items-center justify-center">
                    <button
                        onClick={capturePhoto}
                        disabled={isLoading}
                        className="w-16 h-16 rounded-full bg-white border-4 border-gray-300 hover:scale-105 active:scale-95 transition-transform flex items-center justify-center flex-shrink-0 disabled:opacity-50"
                        title="Chụp"
                    >
                        <CameraIcon className="w-6 h-6 text-black" />
                    </button>
                </div>
            </div>
        </div>
    );
}
