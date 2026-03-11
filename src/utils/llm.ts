import { Settings, ReplyOption } from '../types'
import { loadApiKey } from './storage'
import { parseReplies } from './email'

export async function generateReplies(
  systemPrompt: string,
  userPrompt: string,
  settings: Settings
): Promise<ReplyOption[]> {
  const { provider } = settings

  switch (provider) {
    case 'anthropic':
      return callAnthropic(systemPrompt, userPrompt, settings)
    case 'openai':
      return callOpenAI(systemPrompt, userPrompt, settings)
    case 'google':
      return callGoogle(systemPrompt, userPrompt, settings)
    case 'ollama':
      return callOllama(systemPrompt, userPrompt, settings)
    default:
      throw new Error(`Unknown provider: ${provider}`)
  }
}

export async function testConnection(settings: Settings): Promise<boolean> {
  try {
    const results = await generateReplies('You are helpful.', 'Say OK in one word.', {
      ...settings,
      replyCount: 1,
    })
    return results.length > 0
  } catch {
    return false
  }
}

// ── Anthropic ──────────────────────────────────────────────────────────────

async function callAnthropic(system: string, user: string, settings: Settings): Promise<ReplyOption[]> {
  const apiKey = loadApiKey('anthropic')
  if (!apiKey) throw new Error('No Anthropic API key found. Please add it in Settings.')

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: settings.anthropicModel,
      max_tokens: 2048,
      system,
      messages: [{ role: 'user', content: user }],
    }),
  })

  const data = await response.json()
  if (!response.ok) throw new Error(`Anthropic error ${response.status}: ${data?.error?.message || JSON.stringify(data)}`)

  const text = data?.content?.[0]?.text || ''
  return parseReplies(text)
}

// ── OpenAI ─────────────────────────────────────────────────────────────────

async function callOpenAI(system: string, user: string, settings: Settings): Promise<ReplyOption[]> {
  const apiKey = loadApiKey('openai')
  if (!apiKey) throw new Error('No OpenAI API key found. Please add it in Settings.')

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: settings.openaiModel,
      max_tokens: 2048,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user },
      ],
    }),
  })

  const data = await response.json()
  if (!response.ok) throw new Error(`OpenAI error ${response.status}: ${data?.error?.message || JSON.stringify(data)}`)

  const text = data?.choices?.[0]?.message?.content || ''
  return parseReplies(text)
}

// ── Google Gemini ──────────────────────────────────────────────────────────

async function callGoogle(system: string, user: string, settings: Settings): Promise<ReplyOption[]> {
  const apiKey = loadApiKey('google')
  if (!apiKey) throw new Error('No Google API key found. Please add it in Settings.')

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${settings.googleModel}:generateContent?key=${apiKey}`

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      system_instruction: { parts: [{ text: system }] },
      contents: [{ parts: [{ text: user }] }],
      generationConfig: { maxOutputTokens: 2048 },
    }),
  })

  const data = await response.json()
  if (!response.ok) throw new Error(`Google error ${response.status}: ${data?.error?.message || JSON.stringify(data)}`)

  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || ''
  return parseReplies(text)
}

// ── Ollama (local) ─────────────────────────────────────────────────────────

async function callOllama(system: string, user: string, settings: Settings): Promise<ReplyOption[]> {
  const endpoint = settings.ollamaEndpoint.replace(/\/$/, '')

  const response = await fetch(`${endpoint}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: settings.ollamaModel,
      stream: false,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user },
      ],
    }),
  })

  const data = await response.json()
  if (!response.ok) throw new Error(`Ollama error ${response.status}: ${JSON.stringify(data)}`)

  const text = data?.message?.content || ''
  return parseReplies(text)
}
