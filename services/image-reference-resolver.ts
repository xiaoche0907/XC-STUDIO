import { ProviderError } from '../utils/provider-error';
import { fetchWithResilience } from './http/api-client';
import { getProviderConfig } from './provider-config';
import { useImageHostStore } from '../stores/imageHost.store';

const isNetworkFetchError = (error: unknown): boolean => {
  const msg = ((error as any)?.message || '').toLowerCase();
  return (
    msg.includes('failed to fetch') ||
    msg.includes('network') ||
    msg.includes('cors') ||
    msg.includes('load failed') ||
    msg.includes('loadfailed') ||
    msg.includes('fetch_image_timeout') ||
    msg.includes('timeout')
  );
};

const blobToDataUrl = async (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(String(reader.result || ''));
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

const fetchReferenceViaServer = async (imageUrl: string): Promise<string | null> => {
  try {
    const response = await fetch('/api/fetch-image', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ imageUrl }),
    });

    const payload = await response.json().catch(() => null);
    if (!response.ok) {
      const err: any = new Error(payload?.error || 'fetch_image_failed');
      err.status = response.status;
      throw err;
    }

    if (typeof payload?.dataUrl === 'string' && /^data:image\//.test(payload.dataUrl)) {
      return payload.dataUrl;
    }

    return null;
  } catch (error) {
    console.warn('[reference-resolver] server-side image fetch failed:', error);
    return null;
  }
};

export const normalizeReferenceToDataUrl = async (input: string): Promise<string | null> => {
  if (!input || typeof input !== 'string') return null;
  if (/^data:image\/.+;base64,/.test(input)) return input;

  const selectedProvider = useImageHostStore.getState().selectedProvider;
  const preferHostedUrls = selectedProvider !== 'none';

  if (/^blob:/i.test(input)) {
    try {
      const res = await fetchWithResilience(
        input,
        {},
        { operation: 'generateImage.resolveBlobReference', retries: 0, timeoutMs: 20000 },
      );
      if (!res.ok) return null;
      const blob = await res.blob();
      if (!blob.type.startsWith('image/')) return null;
      return await blobToDataUrl(blob);
    } catch {
      return null;
    }
  }

  if (/^https?:\/\//i.test(input)) {
    if (preferHostedUrls && /(^https?:\/\/i\.ibb\.co\/)|(^https?:\/\/ibb\.co\/)/i.test(input)) {
      const serverDataUrl = await fetchReferenceViaServer(input);
      if (serverDataUrl) {
        return serverDataUrl;
      }
    }

    try {
      const res = await fetchWithResilience(
        input,
        {},
        { operation: 'generateImage.resolveReferenceUrl', retries: 1, timeoutMs: 30000 },
      );
      if (!res.ok) {
        if ([401, 403, 404, 408, 429, 500, 502, 503, 504].includes(res.status)) {
          const serverDataUrl = await fetchReferenceViaServer(input);
          if (serverDataUrl) return serverDataUrl;
        }
        return null;
      }

      const blob = await res.blob();
      if (!blob.type.startsWith('image/')) return null;
      return await blobToDataUrl(blob);
    } catch (error) {
      if (!isNetworkFetchError(error)) {
        return null;
      }

      const serverDataUrl = await fetchReferenceViaServer(input);
      if (serverDataUrl) {
        return serverDataUrl;
      }

      console.warn('[reference-resolver] All attempts to fetch reference image failed, continuing without it:', input);
      return null;
    }
  }

  return null;
};
