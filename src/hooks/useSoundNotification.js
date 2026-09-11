import { useCallback, useEffect } from 'react';
import { playSuccessSound, playErrorSound, initializeAudio } from '../utils/audio';

/**
 * React Hook for Manual Sound Notifications
 * Provides functions to play success/error sounds and initializes audio on mount
 *
 * Usage:
 * const { playSuccess, playError } = useSoundNotification();
 *
 * // In your component after successful operation:
 * playSuccess();
 */
export function useSoundNotification() {
  // Initialize audio context on first user interaction
  useEffect(() => {
    const handleFirstInteraction = () => {
      initializeAudio();
      // Only need to initialize once
      document.removeEventListener('click', handleFirstInteraction);
      document.removeEventListener('keydown', handleFirstInteraction);
    };

    // Warm up audio context on first user interaction
    document.addEventListener('click', handleFirstInteraction, { once: true });
    document.addEventListener('keydown', handleFirstInteraction, { once: true });

    return () => {
      document.removeEventListener('click', handleFirstInteraction);
      document.removeEventListener('keydown', handleFirstInteraction);
    };
  }, []);

  const playSuccess = useCallback(() => {
    playSuccessSound().catch(() => {
      // Silently handle autoplay policy rejections
    });
  }, []);

  const playError = useCallback(() => {
    playErrorSound().catch(() => {
      // Silently handle autoplay policy rejections
    });
  }, []);

  return {
    playSuccess,
    playError
  };
}

export default useSoundNotification;
