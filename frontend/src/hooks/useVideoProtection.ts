import { useEffect, useState, useCallback } from 'react';

export const useVideoProtection = () => {
  const [isProtected, setIsProtected] = useState(false);
  const [warningMsg, setWarningMsg] = useState('');

  // Protect on PrintScreen or DevTools shortcuts
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    // Print screen
    if (e.key === 'PrintScreen') {
      triggerProtection('التسجيل محظور حفاظاً على حقوق المحتوى');
      navigator.clipboard.writeText(''); // Clear clipboard just in case
    }
    // Mac Screen Capture Shortcuts (Meta+Shift+3/4/5) and Windows Snipping Tool (Meta+Shift+S)
    if (e.metaKey && e.shiftKey && (e.key === '3' || e.key === '4' || e.key === '5' || e.key.toLowerCase() === 's')) {
      triggerProtection('التسجيل محظور حفاظاً على حقوق المحتوى');
    }
    // Devtools (F12, Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+U)
    if (
      e.key === 'F12' ||
      (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'J')) ||
      (e.ctrlKey && e.key === 'U')
    ) {
      e.preventDefault();
      triggerProtection('التسجيل محظور حفاظاً على حقوق المحتوى');
    }
  }, []);

  const handleContextMenu = useCallback((e: MouseEvent) => {
    e.preventDefault();
  }, []);

  const triggerProtection = (msg: string) => {
    setIsProtected(true);
    setWarningMsg(msg);
    
    // Auto remove after 4 seconds to allow normal watching after warning
    setTimeout(() => {
      setIsProtected(false);
      setWarningMsg('');
    }, 4000);
  };

  useEffect(() => {
    // Override getDisplayMedia to detect in-browser screen sharing
    const originalGetDisplayMedia = navigator.mediaDevices?.getDisplayMedia;
    if (navigator.mediaDevices && typeof originalGetDisplayMedia === 'function') {
      navigator.mediaDevices.getDisplayMedia = async function () {
        triggerProtection('التسجيل محظور حفاظاً على حقوق المحتوى');
        return Promise.reject(new Error('Screen sharing is disabled for security reasons.'));
      };
    }

    // Attach listeners
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('contextmenu', handleContextMenu);

    return () => {
      if (navigator.mediaDevices && typeof originalGetDisplayMedia === 'function') {
        navigator.mediaDevices.getDisplayMedia = originalGetDisplayMedia;
      }
      // Cleanup
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('contextmenu', handleContextMenu);
    };
  }, [handleKeyDown, handleContextMenu]);

  return { isProtected, warningMsg };
};
