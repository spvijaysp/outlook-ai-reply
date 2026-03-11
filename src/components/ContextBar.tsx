import React from 'react'
import {
  Text,
  ProgressBar,
  Badge,
  Link,
  tokens,
} from '@fluentui/react-components'
import {
  CheckmarkCircle20Regular,
  Warning20Regular,
  DismissCircle20Regular,
  ChevronDown20Regular,
  ChevronUp20Regular,
} from '@fluentui/react-icons'
import { EmailContext } from '../types'

interface ContextBarProps {
  context: EmailContext
  tokenLimit: number
  onIncludeAttachment: (id: string) => void
}

export const ContextBar: React.FC<ContextBarProps> = ({
  context,
  tokenLimit,
  onIncludeAttachment,
}) => {
  const [collapsed, setCollapsed] = React.useState(false)
  const pct = Math.min(context.estimatedTokens / tokenLimit, 1)
  const color = pct > 0.9 ? 'error' : pct > 0.7 ? 'warning' : 'success'

  return (
    <div style={{
      borderBottom: `1px solid ${tokens.colorNeutralStroke1}`,
      background: tokens.colorNeutralBackground2,
    }}>
      {/* Header */}
      <div
        onClick={() => setCollapsed(!collapsed)}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '8px 14px 4px',
          cursor: 'pointer',
          userSelect: 'none',
        }}
      >
        <Text size={100} weight="semibold" style={{ letterSpacing: '0.08em', textTransform: 'uppercase', opacity: 0.6 }}>
          ✦ AI Context
        </Text>
        {collapsed
          ? <ChevronDown20Regular style={{ opacity: 0.5, width: 14 }} />
          : <ChevronUp20Regular style={{ opacity: 0.5, width: 14 }} />
        }
      </div>

      {!collapsed && (
        <div style={{ padding: '0 14px 10px' }}>
          {/* Context items */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 8 }}>
            <ContextItem icon="ok" text="Email body & subject" />
            <ContextItem icon="ok" text="Sender info" />
            {context.threadSummary && (
              <ContextItem icon="warn" text="Thread history" note="summarised" />
            )}
            {context.attachments.map(att => (
              <ContextItem
                key={att.id}
                icon={att.isIncluded ? 'ok' : att.isSupported ? 'none' : 'unsupported'}
                text={att.name}
                note={att.isIncluded ? `${att.estimatedTokens} tokens` : att.isSupported ? 'not included' : 'unsupported'}
                action={att.isSupported && !att.isIncluded ? () => onIncludeAttachment(att.id) : undefined}
              />
            ))}
          </div>

          {/* Token bar */}
          <ProgressBar
            value={pct}
            color={color}
            thickness="medium"
            style={{ marginBottom: 4 }}
          />
          <Text size={100} style={{ opacity: 0.55 }}>
            {context.estimatedTokens.toLocaleString()} of {tokenLimit.toLocaleString()} tokens used
          </Text>
        </div>
      )}
    </div>
  )
}

interface ContextItemProps {
  icon: 'ok' | 'warn' | 'none' | 'unsupported'
  text: string
  note?: string
  action?: () => void
}

const ContextItem: React.FC<ContextItemProps> = ({ icon, text, note, action }) => {
  const iconEl = icon === 'ok'
    ? <CheckmarkCircle20Regular style={{ color: tokens.colorPaletteGreenForeground1, width: 14, flexShrink: 0 }} />
    : icon === 'warn'
    ? <Warning20Regular style={{ color: tokens.colorPaletteYellowForeground1, width: 14, flexShrink: 0 }} />
    : icon === 'none'
    ? <DismissCircle20Regular style={{ color: tokens.colorNeutralForeground4, width: 14, flexShrink: 0 }} />
    : <DismissCircle20Regular style={{ color: tokens.colorNeutralForeground4, width: 14, flexShrink: 0, opacity: 0.4 }} />

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      {iconEl}
      <Text size={200} style={{ opacity: 0.8, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 140 }}>
        {text}
      </Text>
      {note && (
        <Text size={100} style={{ opacity: 0.45, flexShrink: 0 }}>{note}</Text>
      )}
      {action && (
        <Link onClick={action} style={{ marginLeft: 2, flexShrink: 0, fontSize: 11 }}>          Include?
        </Link>
      )}
    </div>
  )
}
