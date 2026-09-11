import { playSuccessSound, playErrorSound } from './utils/audio';

const API_URL = import.meta.env.VITE_API_URL || '/api';

export async function api(path, options = {}) {
  const isMutation = ['POST', 'PUT', 'PATCH', 'DELETE'].includes((options.method || 'GET').toUpperCase());
  const showLoading = options.showLoading ?? isMutation;
  if (showLoading) window.dispatchEvent(new CustomEvent('clinic:request-start'));
  try {
  const auth = localStorage.getItem('clinicToken') || sessionStorage.getItem('clinicToken');
  const response = await fetch(`${API_URL}${path}`, { headers: { 'Content-Type': 'application/json', ...(auth ? { Authorization: `Bearer ${auth}` } : {}), ...(options.headers || {}) }, ...options });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) { const error = new Error(body.message || 'تعذر تنفيذ الطلب.'); error.field = body.field; error.code = body.code; throw error; }
  if (isMutation) {
    window.dispatchEvent(new CustomEvent('clinic:notice', { detail: { type: 'success', message: 'تم حفظ التغييرات بنجاح.' } }));
    // Play success sound for database mutations
    playSuccessSound().catch(() => {}); // Gracefully handle autoplay policy rejections
  }
  return body;
  } catch (error) {
    window.dispatchEvent(new CustomEvent('clinic:notice', { detail: { type: 'error', message: error.message || 'تعذر تنفيذ العملية.' } }));
    // Play error sound for failed operations
    playErrorSound().catch(() => {}); // Gracefully handle autoplay policy rejections
    throw error;
  }
  finally { if (showLoading) window.dispatchEvent(new CustomEvent('clinic:request-end')); }
}
