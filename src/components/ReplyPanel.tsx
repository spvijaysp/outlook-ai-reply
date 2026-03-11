import React, { useState, useEffect, useCallback } from 'react'
import {
  Button,
  Text,
  Spinner,
  MessageBar,
  MessageBarBody,
  tokens,
  Badge,
} from '@fluentui/react-components'
import {
  ArrowClockwise20Regular,
  Settings20Regular,
  Send20Regular,
  Edit20Regular,
} from '@fluentui/react-icons'
import { Settings, ReplyOption, EmailContext } from '../types'
import { ContextBar } from './ContextBar'
import { ReplyCard } from './ReplyCard'
import { TokenDialog } from './TokenDialog'
import { SettingsPanel } from './SettingsPanel'
import { loadSettings } from '../utils/storage'
import { buildEmailContext, calculateTotalTokens, buildSystemPrompt, buildUserPrompt } from '../utils/email'
import { generateReplies } from '../utils/llm'
import { PROVIDER_LABELS } from '../types'

export const ReplyPanel: React.FC = () => {
  const [settings, setSettings] = useState<Settings>(loadSettings)
  const [view, setView] = useState<'replies' | 'settings'>('replies')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [context, setContext] = useState<EmailContext | null>(null)
  const [replies, setReplies] = useState<ReplyOption[]>([])
  const [selectedIdx, setSelectedIdx] = useState(0)

  // Token exceeded dialog
  const [tokenDialog, setTokenDialog] = useState<{
    open: boolean
    attachmentId: string
    attachmentName: string
    requiredTokens: number
  }>({ open: false, attachmentId: '', attachmentName: '', requiredTokens: 0 })

  // Load email context on mount
  useEffect(() => {
    loadContext()
  }, [])

  const loadContext = async () => {
    try {
      const ctx = await buildEmailContext(settings.tokenLimit)
      setContext(ctx)
    } catch (err: any) {
      setError('Could not read email: ' + err.message)
    }
  }

  // Generate replies
  const generate = useCallback(async (ctx?: EmailContext) => {
    const activeCtx = ctx || context
    if (!activeCtx) return

    setLoading(true)
    setError(null)
    setReplies([])

    try {
      const system = buildSystemPrompt(settings)
      const user = buildUserPrompt(activeCtx)
      const results = await generateReplies(system, user, settings)
      setReplies(results)
      setSelectedIdx(0)
    } catch (err: any) {
      setError(err.message || 'Failed to generate replies')
    } finally {
      setLoading(false)
    }
  }, [context, settings])

  // Auto-generate when context is ready
  useEffect(() => {
    if (context && replies.length === 0 && !loading) {
      generate(context)
    }
  }, [context])

  // Include attachment
  const handleIncludeAttachment = (id: string) => {
    if (!context) return
    const att = context.attachments.find(a => a.id === id)
    if (!att) return

    // Estimate tokens if included (rough: 1 token per 4 chars, assume ~500 words avg)
    const estimatedNew = att.estimatedTokens || 400
    const newTotal = context.estimatedTokens + estimatedNew

    if (newTotal > settings.tokenLimit) {
      setTokenDialog({
        open: true,
        attachmentId: id,
        attachmentName: att.name,
        requiredTokens: newTotal,
      })
    } else {
      doIncludeAttachment(id)
    }
  }

  const doIncludeAttachment = (id: string) => {
    if (!context) return
    const updated = {
      ...context,
      attachments: context.attachments.map(a =>
        a.id === id ? { ...a, isIncluded: true } : a
      ),
    }
    updated.estimatedTokens = calculateTotalTokens(updated)
    setContext(updated)
    generate(updated)
  }

  const handleTokenDialogDiscard = () => {
    setTokenDialog(prev => ({ ...prev, open: false }))
  }

  const handleTokenDialogIncrease = () => {
    const newLimit = tokenDialog.requiredTokens + 200
    const newSettings = { ...settings, tokenLimit: newLimit }
    setSettings(newSettings)
    setTokenDialog(prev => ({ ...prev, open: false }))
    doIncludeAttachment(tokenDialog.attachmentId)
  }

  // Use reply
  const handleUseReply = (edit: boolean) => {
    if (!replies[selectedIdx]) return
    const body = replies[selectedIdx].body
      .replace(/\\n\\n/g, '\n\n')
      .replace(/\\n/g, '\n')

    Office.context.mailbox.item?.displayReplyAllForm({
      htmlBody: `<p>${body.replace(/\n/g, '<br/>')}</p>`,
    })
  }

  if (view === 'settings') {
    return (
      <SettingsPanel
        settings={settings}
        onSave={(s) => { setSettings(s); setView('replies') }}
        onBack={() => setView('replies')}
      />
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>

      {/* Header */}
      <div style={{
        padding: '10px 14px',
        borderBottom: `1px solid ${tokens.colorNeutralStroke1}`,
        background: tokens.colorNeutralBackground2,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Text size={400} weight="semibold">✦ AI Reply</Text>
          <Badge appearance="tint" color="brand" size="small">
            {PROVIDER_LABELS[settings.provider]}
          </Badge>
        </div>
        <div style={{ display: 'flex', gap: 4 }}>
          <Button
            appearance="subtle"
            icon={<ArrowClockwise20Regular />}
            onClick={() => generate()}
            disabled={loading || !context}
            size="small"
            title="Regenerate"
          />
          <Button
            appearance="subtle"
            icon={<Settings20Regular />}
            onClick={() => setView('settings')}
            size="small"
            title="Settings"
          />
        </div>
      </div>

      {/* Context bar */}
      {context && (
        <ContextBar
          context={context}
          tokenLimit={settings.tokenLimit}
          onIncludeAttachment={handleIncludeAttachment}
        />
      )}

      {/* Main content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '10px 10px 0' }}>

        {/* Error */}
        {error && (
          <MessageBar intent="error" style={{ marginBottom: 10 }}>
            <MessageBarBody>
              <Text size={200}>{error}</Text>
            </MessageBarBody>
          </MessageBar>
        )}

        {/* Loading */}
        {loading && (
          <div style={{
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            padding: '40px 20px', gap: 12,
          }}>
            <Spinner size="medium" label="Generating replies…" />
          </div>
        )}

        {/* Reply cards */}
        {!loading && replies.map((reply, i) => (
          <ReplyCard
            key={i}
            reply={reply}
            selected={i === selectedIdx}
            onSelect={() => setSelectedIdx(i)}
          />
        ))}

        {/* Empty state - no email selected */}
        {!loading && !error && !context && (
          <div style={{ padding: '40px 20px', textAlign: 'center' }}>
            <Text size={300} style={{ opacity: 0.5 }}>
              Select or open an email to generate replies
            </Text>
          </div>
        )}
      </div>

      {/* Footer */}
      {replies.length > 0 && (
        <div style={{
          padding: '10px',
          borderTop: `1px solid ${tokens.colorNeutralStroke1}`,
          background: tokens.colorNeutralBackground2,
          display: 'flex', gap: 7,
          flexShrink: 0,
        }}>
          <Button
            appearance="primary"
            icon={<Send20Regular />}
            onClick={() => handleUseReply(false)}
            style={{ flex: 1 }}
          >
            Use Selected
          </Button>
          <Button
            appearance="outline"
            icon={<Edit20Regular />}
            onClick={() => handleUseReply(true)}
          >
            Edit
          </Button>
        </div>
      )}

      {/* Token exceeded dialog */}
      <TokenDialog
        open={tokenDialog.open}
        attachmentName={tokenDialog.attachmentName}
        currentTokens={context?.estimatedTokens || 0}
        requiredTokens={tokenDialog.requiredTokens}
        onDiscard={handleTokenDialogDiscard}
        onIncrease={handleTokenDialogIncrease}
      />
    </div>
  )
}
