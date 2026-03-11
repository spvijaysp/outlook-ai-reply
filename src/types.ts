export type LLMProvider = 'anthropic' | 'openai' | 'google' | 'ollama'

export interface Settings {
  provider: LLMProvider
  anthropicModel: string
  openaiModel: string
  googleModel: string
  ollamaModel: string
  ollamaEndpoint: string
  personaRole: string
  personaInstructions: string
  replyCount: number
  tokenLimit: number
}

export interface AttachmentInfo {
  id: string
  name: string
  extension: string
  sizeBytes: number
  isSupported: boolean
  isIncluded: boolean
  extractedText?: string
  estimatedTokens: number
}

export interface EmailContext {
  subject: string
  senderName: string
  senderEmail: string
  body: string
  threadSummary: string
  attachments: AttachmentInfo[]
  estimatedTokens: number
}

export interface ReplyOption {
  tone: string
  emoji: string
  body: string
}

export const DEFAULT_SETTINGS: Settings = {
  provider: 'openai',
  anthropicModel: 'claude-sonnet-4-6',
  openaiModel: 'gpt-4o',
  googleModel: 'gemini-1.5-pro',
  ollamaModel: 'llama3',
  ollamaEndpoint: 'http://localhost:11434',
  personaRole: '',
  personaInstructions: '',
  replyCount: 3,
  tokenLimit: 3000,
}

export const PROVIDER_MODELS: Record<LLMProvider, string[]> = {
  anthropic: ['claude-sonnet-4-6', 'claude-opus-4-6', 'claude-haiku-4-5-20251001'],
  openai: ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo'],
  google: ['gemini-1.5-pro', 'gemini-1.5-flash', 'gemini-2.0-flash'],
  ollama: ['llama3', 'mistral', 'phi3'],
}

export const PROVIDER_LABELS: Record<LLMProvider, string> = {
  anthropic: 'Anthropic',
  openai: 'OpenAI',
  google: 'Google',
  ollama: 'Ollama',
}

export const PROVIDER_ICONS: Record<LLMProvider, string> = {
  anthropic: '🔮',
  openai: '🟢',
  google: '🔵',
  ollama: '🦙',
}
