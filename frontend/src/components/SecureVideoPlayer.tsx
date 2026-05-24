import { useRef, useEffect, type FC } from 'react';
import { useVideoProtection } from '../hooks/useVideoProtection';
import { Maximize } from 'lucide-react';
import DynamicWatermark from './DynamicWatermark';

interface SecureVideoPlayerProps {
  videoUrl: string;
}

const SecureVideoPlayer: FC<SecureVideoPlayerProps> = ({ videoUrl }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const { isProtected } = useVideoProtection();

  // --- 🔒 كود منع الـ F12 وكليك يمين واختصارات التفتيش ---
  useEffect(() => {
    const handleContextMenu = (e: MouseEvent) => e.preventDefault();
    
    const handleKeyDown = (e: KeyboardEvent) => {
      // قفل زرار F12
      if (e.key === 'F12') {
        e.preventDefault();
      }
      
      // قفل اختصارات أدوات المطورين (Ctrl + Shift + I / J / C)
      if (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'J' || e.key === 'C')) {
        e.preventDefault();
      }
      
      // قفل اختصار سورس كود الصفحة وحفظها (Ctrl + U / S)
      if (e.ctrlKey && (e.key === 'u' || e.key === 's')) {
        e.preventDefault();
      }
    };

    // تشغيل الحماية في المشغل
    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('keydown', handleKeyDown);

    // تنظيف الحماية عند الخروج من الصفحة
    return () => {
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);
  // ----------------------------------------------------

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (document.fullscreenElement) {
      document.exitFullscreen().catch((err) => console.error('Failed to exit fullscreen:', err));
    } else {
      containerRef.current.requestFullscreen().catch((err) => console.error('Failed to enter fullscreen:', err));
    }
  };

  useEffect(() => {
    if (isProtected) {
      if (videoRef.current) {
        videoRef.current.pause();
      }
    }
  }, [isProtected]);

  const isYoutube = /(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))((\w|-){11})/.test(videoUrl);
  const ytMatch = videoUrl.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))((\w|-){11})/);

  const renderVideo = () => {
    if (isYoutube && ytMatch) {
      return (
        <div className="relative w-full h-full">
          <iframe
            ref={iframeRef}
            className={`w-full h-full object-cover ${isProtected ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
            // تم منع زر الـ fullscreen الافتراضي لليوتيوب (fs=0) لنعتمد على الحاوية الكبيرة
            src={`https://www.youtube.com/embed/${ytMatch[1]}?modestbranding=1&rel=0&disablekb=1&fs=0&iv_load_policy=3&showinfo=0&controls=1`}
            title="Secure YouTube Player"
            frameBorder="0"
            // ✅ sandbox كامل وصحيح: allow-popups + allow-forms ضرورية لـ YouTube
            sandbox="allow-scripts allow-same-origin allow-presentation allow-popups allow-forms allow-popups-to-escape-sandbox"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      );
    }

    const isLocal = !videoUrl.startsWith('http');
    const baseUrl = import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace('/api', '') : 'https://backend-production-a4c41.up.railway.app';
    const videoSrc = isLocal ? `${baseUrl}${videoUrl.startsWith('/') ? '' : '/'}${videoUrl}` : videoUrl;

    return (
      <video
        ref={videoRef}
        src={videoSrc}
        controls={!isProtected}
        controlsList="nodownload nofullscreen noremoteplayback"
        disablePictureInPicture
        className={`w-full h-full object-contain ${isProtected ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
        onContextMenu={(e) => e.preventDefault()}
        onDragStart={(e) => e.preventDefault()}
      />
    );
  };

  return (
    <div 
      ref={containerRef}
      className="relative w-full aspect-video bg-slate-950 rounded-2xl overflow-hidden shadow-glow-purple group select-none flex flex-col"
      onContextMenu={(e) => e.preventDefault()}
    >
      
      {/* Video Content */}
      <div className={`absolute inset-0 w-full h-full ${isProtected ? 'blur-xl opacity-0' : 'opacity-100'}`}>
        {renderVideo()}
      </div>

      {/* Dynamic Security Watermark */}
      {!isProtected && (
        <div className="absolute inset-0 pointer-events-none z-40">
          <DynamicWatermark />
        </div>
      )}

      {/* Custom Fullscreen Button */}
      {!isProtected && (
        <button 
          onClick={toggleFullscreen}
          // رفعنا الـ z-index لـ 50 وظبطنا الـ bottom عشان يظهر فوق الفيديو تماماً
          className="absolute bottom-4 right-4 z-50 p-2 bg-black/60 hover:bg-black/90 text-white rounded-lg backdrop-blur-sm transition-all opacity-0 group-hover:opacity-100 shadow-lg"
          title="ملء الشاشة"
        >
          <Maximize className="w-5 h-5" />
        </button>
      )}
    </div>
  );
};

export default SecureVideoPlayer;