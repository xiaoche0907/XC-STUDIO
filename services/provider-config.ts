import { safeLocalStorageSetItem } from '../utils/safe-storage';

export type ProviderConfig = {
  id: string;
  name?: string;
  baseUrl?: string;
  apiKey?: string;
};

export const getProviderConfig = (): ProviderConfig => {
  const providerId = localStorage.getItem('api_provider') || 'yunwu';
  const providersRaw = localStorage.getItem('api_providers');

  if (providersRaw) {
    try {
      const providers = JSON.parse(providersRaw);
      const found = providers.find((p: any) => p.id === providerId);
      if (found) return found;
    } catch (e) {
      console.error('Parse providers error', e);
    }
  }

  if (providerId === 'yunwu') {
    return {
      id: 'yunwu',
      name: 'Yunwu',
      baseUrl: 'https://yunwu.ai',
      apiKey: localStorage.getItem('yunwu_api_key') || '',
    };
  }

  if (providerId === 'plato') {
    return {
      id: 'plato',
      name: '柏拉图',
      baseUrl: 'https://api.bltcy.ai',
      apiKey: '',
    };
  }

  if (providerId === 'gemini') {
    return {
      id: 'gemini',
      name: 'Gemini',
      baseUrl: 'https://generativelanguage.googleapis.com',
      apiKey: localStorage.getItem('gemini_api_key') || '',
    };
  }

  return { id: 'yunwu', apiKey: '' };
};

export const getApiKey = (all: boolean = false): string | string[] => {
  const win = window as any;

  if (win.aistudio && win.aistudio.getKey) {
    const key = win.aistudio.getKey();
    if (key) return all ? [key] : key;
  }

  const config = getProviderConfig();
  const rawKeys = config.apiKey || '';

  if (rawKeys) {
    const keys = rawKeys
      .split('\n')
      .map((k) => k.trim())
      .filter((k) => k && !k.startsWith('#'));

    if (keys.length > 0) {
      if (all) return keys;

      const storageKey = `api_poll_index_${config.id}`;
      let currentIndex = parseInt(localStorage.getItem(storageKey) || '0', 10);
      if (currentIndex >= keys.length) currentIndex = 0;
      const selectedKey = keys[currentIndex];
      safeLocalStorageSetItem(storageKey, ((currentIndex + 1) % keys.length).toString());
      return selectedKey;
    }
  }

  return all ? [] : '';
};
