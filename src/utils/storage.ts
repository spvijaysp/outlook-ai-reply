import { Settings, DEFAULT_SETTINGS, LLMProvider } from '../types'

const SETTINGS_KEY = 'ai_reply_settings'
const KEY_PREFIX = 'ai_reply_key_'

export function loadSettings(): Settings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY)
    if (raw) return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) }
  } catch {}
  return { ...DEFAULT_SETTINGS }
}

export function saveSettings(settings: Settings): void {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings))
}

export function saveApiKey(provider: LLMProvider, key: string): void {
  localStorage.setItem(`${KEY_PREFIX}${provider}`, key)
}

export function loadApiKey(provider: LLMProvider): string {
  return localStorage.getItem(`${KEY_PREFIX}${provider}`) || ''
}

export function estimateTokens(text: string): number {
  if (!text) return 0
  return Math.ceil(text.length / 4)
}
