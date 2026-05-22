import { useEffect, useCallback } from 'react';

export const useVideoProtection = () => {
  const handleContextMenu = useCallback((e: MouseEvent) => {
    e.preventDefault();
  }, []);

  useEffect(() => {
    // Override getDisplayMedia to silently block in-browser screen sharing
    const originalGetDisplayMedia = navigator.mediaDevices?.getDisplayMedia;
    
    // Fix TS2774: Check if it's explicitly a function before overriding
    if (navigator.mediaDevices && typeof originalGetDisplayMedia === 'function') {
      navigator.mediaDevices.getDisplayMedia = async function () {
        return Promise.reject(new Error('Screen sharing is disabled for security reasons.'));
      };
    }

    // Block right click to prevent easy downloading
    document.addEventListener('contextmenu', handleContextMenu);

    return () => {
      // Restore original function on cleanup
      if (navigator.mediaDevices && typeof originalGetDisplayMedia === 'function') {
        navigator.mediaDevices.getDisplayMedia = originalGetDisplayMedia;
      }
      
      // Cleanup listeners
      document.removeEventListener('contextmenu', handleContextMenu);
    };
  }, [handleContextMenu]);

  // Return false always to completely disable the black screen feature.
  // The site will now rely entirely on the DynamicWatermark component.
  return { isProtected: false, warningMsg: '' };
};
