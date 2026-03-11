import { EmailContext, AttachmentInfo } from '../types'
import { estimateTokens } from './storage'

const SUPPORTED_EXTENSIONS = ['.txt', '.csv', '.pdf', '.docx']

export async function buildEmailContext(tokenLimit: number): Promise<EmailContext> {
  return new Promise((resolve, reject) => {
    try {
      const item = Office.context.mailbox.item as Office.MessageRead

      const ctx: EmailContext = {
        subject: item.subject || '(No Subject)',
        senderName: item.from?.displayName || '',
        senderEmail: item.from?.emailAddress || '',
        body: '',
        threadSummary: '',
        attachments: [],
        estimatedTokens: 0,
      }

      // Get body
      item.body.getAsync(Office.CoercionType.Text, (result) => {
        if (result.status === Office.AsyncResultStatus.Succeeded) {
          let body = result.value || ''
          // Truncate if too long
          const maxChars = (tokenLimit - 500) * 4
          if (body.length > maxChars) {
            body = body.substring(0, maxChars) + '\n...[truncated]'
          }
          ctx.body = body
        }

        // Get attachments
        const attachments = item.attachments || []
        ctx.attachments = attachments.map((att): AttachmentInfo => {
          const ext = getExtension(att.name)
          return {
            id: att.id,
            name: att.name,
            extension: ext,
            sizeBytes: att.size,
            isSupported: SUPPORTED_EXTENSIONS.includes(ext.toLowerCase()),
            isIncluded: false,
            estimatedTokens: 0,
          }
        })

        ctx.estimatedTokens = calculateTotalTokens(ctx)
        resolve(ctx)
      })
    } catch (err) {
      reject(err)
    }
  })
}

export function calculateTotalTokens(ctx: EmailContext): number {
  let total = 0
  total += estimateTokens(ctx.subject)
  total += estimateTokens(ctx.senderName)
  total += estimateTokens(ctx.body)
  total += estimateTokens(ctx.threadSummary)
  for (const att of ctx.attachments) {
    if (att.isIncluded && att.extractedText) {
      total += estimateTokens(att.extractedText)
    }
  }
  return total
}

function getExtension(filename: string): string {
  const idx = filename.lastIndexOf('.')
  return idx >= 0 ? filename.substring(idx) : ''
}

export function buildSystemPrompt(settings: { personaRole: string; personaInstructions: string; replyCount: number }): string {
  let prompt = 'You are an expert email assistant helping compose professional replies.\n'

  if (settings.personaRole) {
    prompt += `The user's role: ${settings.personaRole}\n`
  }

  if (settings.personaInstructions) {
    prompt += `\nCustom instructions:\n${settings.personaInstructions}\n`
  }

  prompt += `
CRITICAL OUTPUT FORMAT — follow exactly:
Generate exactly ${settings.replyCount} reply options.

REPLY_1_TONE: [tone label e.g. Concise]
REPLY_1: [full email reply body]
REPLY_2_TONE: [tone label e.g. Detailed]
REPLY_2: [full email reply body]
REPLY_3_TONE: [tone label e.g. Warm]
REPLY_3: [full email reply body]

Rules:
- Each reply must be complete and ready to send
- Do not include subject lines
- Do not include commentary outside the format above
- Write FROM the recipient's perspective, replying TO the sender
- Do NOT write as the sender`

  return prompt
}

export function buildUserPrompt(ctx: EmailContext): string {
  let prompt = 'You are helping the EMAIL RECIPIENT write a reply.\n'
  prompt += 'This email was RECEIVED by the user.\n'
  prompt += `It was sent BY: ${ctx.senderName} <${ctx.senderEmail}>\n`
  prompt += 'Write replies FROM the recipient\'s perspective.\n'
  prompt += 'Do NOT write as the sender. Read the full thread carefully.\n\n'
  prompt += `Subject: ${ctx.subject}\n\n`
  prompt += '--- EMAIL RECEIVED ---\n'
  prompt += ctx.body

  if (ctx.threadSummary) {
    prompt += '\n\n--- EARLIER THREAD (summarised) ---\n'
    prompt += ctx.threadSummary
  }

  for (const att of ctx.attachments) {
    if (att.isIncluded && att.extractedText) {
      prompt += `\n\n--- ATTACHMENT: ${att.name} ---\n`
      const text = att.extractedText.length > 2000
        ? att.extractedText.substring(0, 2000) + '\n...[truncated]'
        : att.extractedText
      prompt += text
    }
  }

  return prompt
}

const TONE_EMOJIS: Record<string, string> = {
  concise: '⚡',
  brief: '⚡',
  detailed: '📋',
  comprehensive: '📋',
  warm: '🤝',
  friendly: '🤝',
  formal: '💼',
  professional: '💼',
}

export function parseReplies(raw: string): Array<{ tone: string; emoji: string; body: string }> {
  const replies: Array<{ tone: string; emoji: string; body: string }> = []
  const lines = raw.split('\n')

  let currentTone = ''
  let currentBody: string[] = []
  let inBody = false

  for (const line of lines) {
    const toneMatch = line.match(/^REPLY_\d+_TONE:\s*(.+)$/)
    const bodyMatch = line.match(/^REPLY_\d+:\s*(.*)$/)

    if (toneMatch) {
      if (currentTone && currentBody.length > 0) {
        replies.push(makeReply(currentTone, currentBody.join('\n').trim()))
      }
      currentTone = toneMatch[1].trim()
      currentBody = []
      inBody = false
    } else if (bodyMatch) {
      currentBody = [bodyMatch[1]]
      inBody = true
    } else if (inBody) {
      currentBody.push(line)
    }
  }

  if (currentTone && currentBody.length > 0) {
    replies.push(makeReply(currentTone, currentBody.join('\n').trim()))
  }

  // Fallback
  if (replies.length === 0 && raw.trim()) {
    replies.push({ tone: 'Reply', emoji: '✉️', body: raw.trim() })
  }

  return replies
}

function makeReply(tone: string, body: string) {
  const key = tone.toLowerCase()
  const emoji = Object.entries(TONE_EMOJIS).find(([k]) => key.includes(k))?.[1] || '✉️'
  return { tone, emoji, body }
}
