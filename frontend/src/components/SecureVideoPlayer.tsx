import { useRef, useEffect, type FC } from 'react';
import { useVideoProtection } from '../hooks/useVideoProtection';
import { ShieldAlert } from 'lucide-react';
import { useAppSelector } from '../hooks/redux';
import DynamicWatermark from './DynamicWatermark';

interface SecureVideoPlayerProps {
  videoUrl: string;
}

const SecureVideoPlayer: FC<SecureVideoPlayerProps> = ({ videoUrl }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const { isProtected, warningMsg } = useVideoProtection();
  const { user } = useAppSelector((state) => state.auth);

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
            src={`https://www.youtube.com/embed/${ytMatch[1]}?modestbranding=1&rel=0&disablekb=1`}
            title="Secure YouTube Player"
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            sandbox="allow-scripts allow-same-origin allow-presentation"
            allowFullScreen
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
      className="relative w-full aspect-video bg-slate-950 rounded-2xl overflow-hidden shadow-glow-purple group select-none"
      onContextMenu={(e) => e.preventDefault()}
    >
      
      {/* Video Content */}
      <div className={`absolute inset-0 ${isProtected ? 'blur-xl opacity-0' : 'opacity-100'}`}>
        {renderVideo()}
      </div>

      {/* Dynamic Security Watermark */}
      {!isProtected && <DynamicWatermark />}

      {/* Protection Overlay */}
      {isProtected && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black">
          <ShieldAlert className="w-20 h-20 text-rose-500 mb-6 animate-pulse" />
          <h2 className="text-2xl md:text-3xl font-bold text-rose-500 mb-3 text-center">
            تنبيه أمني
          </h2>
          <p className="text-slate-300 text-sm md:text-lg text-center max-w-md px-6 leading-relaxed">
            {warningMsg || 'تم إيقاف العرض لحماية المحتوى من النسخ أو التسجيل. يرجى إيقاف أي أدوات تسجيل شاشة للمتابعة.'}
          </p>
        </div>
      )}
    </div>
  );
};

export default SecureVideoPlayer;
