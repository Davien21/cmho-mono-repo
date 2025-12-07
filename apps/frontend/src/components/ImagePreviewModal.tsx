import { useState, useEffect, useRef } from "react";
import { X, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface ImagePreviewModalProps {
  image: {
    url: string;
    name: string;
  } | null;
  onClose: () => void;
}

export function ImagePreviewModal({ image, onClose }: ImagePreviewModalProps) {
  const [isImageLoading, setIsImageLoading] = useState(false);
  const previewImageRef = useRef<HTMLImageElement>(null);
  const [viewportHeight, setViewportHeight] = useState<string>("100svh");

  // Handle Escape key to close preview
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && image) {
        onClose();
      }
    };

    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [image, onClose]);

  // Reset loading state when preview image changes
  useEffect(() => {
    if (image) {
      setIsImageLoading(true);
      // Check if image is already cached/loaded after a brief delay
      const timer = setTimeout(() => {
        if (previewImageRef.current?.complete) {
          setIsImageLoading(false);
        }
      }, 10);
      return () => clearTimeout(timer);
    }
  }, [image]);

  // Prevent body scroll when overlay is open and set viewport height
  useEffect(() => {
    if (image) {
      // Save current overflow style
      const originalOverflow = document.body.style.overflow;
      // Disable body scroll
      document.body.style.overflow = "hidden";

      // Set viewport height to actual window height for iOS
      const setHeight = () => {
        const vh = window.innerHeight;
        setViewportHeight(`${vh}px`);
      };
      setHeight();
      window.addEventListener("resize", setHeight);

      // Restore on cleanup
      return () => {
        document.body.style.overflow = originalOverflow;
        window.removeEventListener("resize", setHeight);
      };
    }
  }, [image]);

  if (!image) return null;

  return (
    <div
      className="fixed z-[100] flex items-center justify-center overflow-hidden"
      onClick={onClose}
      style={{
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: "100vw",
        height: viewportHeight,
        minHeight: "-webkit-fill-available",
      }}
    >
      {/* Glassmorphic Backdrop */}
      <div
        className="absolute w-full h-full bg-black/60 backdrop-blur-md"
        style={{
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          width: "100%",
          height: "100%",
        }}
      />

      {/* Preview Content */}
      <div className="relative z-10 w-full h-full flex items-center justify-center p-4 overflow-auto">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute z-20 p-2 rounded-full bg-white/10 backdrop-blur-md border border-white/20 hover:bg-white/20 transition-all text-white"
          style={{ top: "1rem", right: "1rem" }}
          title="Close (Esc)"
        >
          <X className="h-6 w-6" />
        </button>

        {/* Image Container */}
        <div
          className="relative max-w-[90vw] max-h-[90vh] flex items-center justify-center"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="relative">
            {/* Loading Spinner */}
            {isImageLoading && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="p-4 rounded-full bg-white/10 backdrop-blur-md border border-white/20">
                  <Loader2 className="h-8 w-8 text-white animate-spin" />
                </div>
              </div>
            )}

            {/* Image - Hidden until loaded */}
            <img
              ref={previewImageRef}
              src={image.url}
              alt={image.name}
              className={cn(
                "max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl transition-opacity duration-300",
                isImageLoading ? "opacity-0" : "opacity-100"
              )}
              onLoadStart={() => setIsImageLoading(true)}
              onLoad={() => setIsImageLoading(false)}
              onError={() => setIsImageLoading(false)}
            />
            {/* Image Info - Only show when image is loaded */}
            {!isImageLoading && (
              <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent rounded-b-lg">
                <p className="text-white text-sm font-medium truncate">
                  {image.name}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

