/**
 * Audio Notification System
 * Provides pleasant sound effects for successful database operations
 * Uses Web Audio API for instant playback without external asset dependencies
 */

// Global AudioContext instance (lazy initialization)
let audioContext = null;

/**
 * Initialize AudioContext (lazy)
 * Handles browser autoplay policy restrictions gracefully
 */
function getAudioContext() {
  if (!audioContext) {
    try {
      audioContext = new (window.AudioContext || window.webkitAudioContext)();
    } catch (error) {
      console.warn('AudioContext initialization failed:', error);
      return null;
    }
  }
  return audioContext;
}

/**
 * Resume AudioContext if suspended (required for autoplay policy)
 */
async function ensureAudioContextRunning() {
  const ctx = getAudioContext();
  if (!ctx) return false;

  if (ctx.state === 'suspended') {
    try {
      await ctx.resume();
    } catch (error) {
      console.warn('Failed to resume AudioContext:', error);
      return false;
    }
  }
  return ctx.state === 'running';
}

/**
 * Check if audio notifications are enabled in user settings
 */
function isAudioEnabled() {
  try {
    const settings = localStorage.getItem('clinic_notification_settings');
    if (!settings) return true; // Default to enabled

    const parsed = JSON.parse(settings);
    return parsed.audioAlerts !== false;
  } catch (error) {
    return true; // Default to enabled on error
  }
}

/**
 * Create an oscillator node with envelope
 */
function createTone(ctx, frequency, startTime, duration, volume = 0.15) {
  const oscillator = ctx.createOscillator();
  const gainNode = ctx.createGain();

  oscillator.type = 'sine';
  oscillator.frequency.value = frequency;

  // ADSR Envelope for smooth, pleasant sound
  const attackTime = 0.01;
  const decayTime = 0.05;
  const sustainLevel = volume * 0.7;
  const releaseTime = 0.08;

  gainNode.gain.setValueAtTime(0, startTime);
  gainNode.gain.linearRampToValueAtTime(volume, startTime + attackTime);
  gainNode.gain.linearRampToValueAtTime(sustainLevel, startTime + attackTime + decayTime);
  gainNode.gain.setValueAtTime(sustainLevel, startTime + duration - releaseTime);
  gainNode.gain.linearRampToValueAtTime(0, startTime + duration);

  oscillator.connect(gainNode);
  gainNode.connect(ctx.destination);

  oscillator.start(startTime);
  oscillator.stop(startTime + duration);

  return { oscillator, gainNode };
}

/**
 * Play a pleasant success chime (D5 -> A5 harmonic)
 * Frequencies: 587.33 Hz (D5) -> 880 Hz (A5)
 * Creates a crisp, uplifting notification sound
 */
export async function playSuccessSound() {
  // Check user preference first
  if (!isAudioEnabled()) {
    return;
  }

  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    // Ensure AudioContext is running (handle autoplay policy)
    const isRunning = await ensureAudioContextRunning();
    if (!isRunning) return;

    const now = ctx.currentTime;
    const volume = 0.12; // Gentle, non-intrusive volume

    // First chord: D5 (587.33 Hz)
    createTone(ctx, 587.33, now, 0.15, volume);

    // Second chord: A5 (880 Hz) - perfect fifth interval
    createTone(ctx, 880, now + 0.08, 0.18, volume * 0.9);

    // Subtle harmonic overtone for richness
    createTone(ctx, 1174.66, now + 0.08, 0.12, volume * 0.3);

  } catch (error) {
    // Silently fail - don't disrupt user experience with audio errors
    console.warn('Audio playback failed:', error);
  }
}

/**
 * Play error sound (optional - lower, dissonant tone)
 */
export async function playErrorSound() {
  if (!isAudioEnabled()) return;

  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const isRunning = await ensureAudioContextRunning();
    if (!isRunning) return;

    const now = ctx.currentTime;
    const volume = 0.10;

    // Lower, shorter tone for errors (C4 -> G3)
    createTone(ctx, 261.63, now, 0.12, volume);
    createTone(ctx, 196.00, now + 0.06, 0.15, volume * 0.8);

  } catch (error) {
    console.warn('Error sound playback failed:', error);
  }
}

/**
 * Initialize audio on user interaction (optional warm-up)
 * Call this on first user click/tap to prepare AudioContext
 */
export function initializeAudio() {
  try {
    const ctx = getAudioContext();
    if (ctx && ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }
  } catch (error) {
    // Silent fail
  }
}

export default {
  playSuccessSound,
  playErrorSound,
  initializeAudio,
  isAudioEnabled
};
