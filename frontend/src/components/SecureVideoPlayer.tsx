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
  const { isProtected } = useVideoProtection(); // Always false now

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (document.fullscreenElement) {
      document.exitFullscreen().catch((err) => console.log(err));
    } else {
      containerRef.current.requestFullscreen().catch((err) => console.log(err));
    }
  };

  useEffect(() => {
    if (isProtected) {
      if (videoRef.current) {
        videoRef.current.pause();
      }
      // Iframe (YouTube) cannot be paused directly easily without YT API, 
      // but hiding it prevents watching it.
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
            // Secure params: modestbranding, no related videos (rel=0), disable keyboard (disablekb=1), no fullscreen (fs=0), hide annotations (iv_load_policy=3)
            src={`https://www.youtube.com/embed/${ytMatch[1]}?modestbranding=1&rel=0&disablekb=1&fs=0&iv_load_policy=3&showinfo=0&controls=1`}
            title="Secure YouTube Player"
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            sandbox="allow-scripts allow-same-origin allow-presentation"
          />
        </div>
      );
    }

    const isLocal = !videoUrl.startsWith('http');
    const videoSrc = isLocal ? `http://localhost:5000${videoUrl.startsWith('/') ? '' : '/'}${videoUrl}` : videoUrl;

    return (
      <video
        ref={videoRef}
        src={videoSrc}
        controls={!isProtected} // Hide controls when protected
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
      {!isProtected && <DynamicWatermark />}

      {/* Custom Fullscreen Button */}
      {!isProtected && (
        <button 
          onClick={toggleFullscreen}
          className="absolute bottom-16 right-4 z-50 p-2 bg-black/50 hover:bg-black/80 text-white rounded-lg backdrop-blur-sm transition-all opacity-0 group-hover:opacity-100"
          title="ملء الشاشة"
        >
          <Maximize className="w-5 h-5" />
        </button>
      )}
    </div>
  );
};

export default SecureVideoPlayer;
