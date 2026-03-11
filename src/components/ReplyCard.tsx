import React from 'react'
import { Text, tokens } from '@fluentui/react-components'
import { Checkmark20Filled } from '@fluentui/react-icons'
import { ReplyOption } from '../types'

interface ReplyCardProps {
  reply: ReplyOption
  selected: boolean
  onSelect: () => void
}

export const ReplyCard: React.FC<ReplyCardProps> = ({ reply, selected, onSelect }) => {
  const preview = reply.body.length > 160 ? reply.body.substring(0, 160) + '…' : reply.body

  return (
    <div
      onClick={onSelect}
      style={{
        background: selected ? tokens.colorBrandBackground2 : tokens.colorNeutralBackground1,
        border: `1px solid ${selected ? tokens.colorBrandStroke1 : tokens.colorNeutralStroke1}`,
        borderRadius: tokens.borderRadiusMedium,
        padding: '10px 12px',
        cursor: 'pointer',
        transition: 'all 0.15s',
        position: 'relative',
        marginBottom: 8,
      }}
    >
      {/* Checkmark */}
      {selected && (
        <div style={{
          position: 'absolute', top: 8, right: 8,
          width: 18, height: 18,
          background: tokens.colorBrandBackground,
          borderRadius: '50%',
          display: 'grid', placeItems: 'center',
        }}>
          <Checkmark20Filled style={{ width: 11, color: '#fff' }} />
        </div>
      )}

      {/* Tone label */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 5 }}>
        <span style={{ fontSize: 13 }}>{reply.emoji}</span>
        <Text
          size={100}
          weight="semibold"
          style={{
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            color: selected ? tokens.colorBrandForeground1 : tokens.colorNeutralForeground3,
          }}
        >
          {reply.tone}
        </Text>
      </div>

      {/* Preview */}
      <Text size={200} style={{ opacity: 0.8, lineHeight: '1.5' }}>
        {preview}
      </Text>
    </div>
  )
}
