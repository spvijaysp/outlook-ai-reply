import React from 'react'
import {
  Dialog,
  DialogSurface,
  DialogTitle,
  DialogBody,
  DialogActions,
  DialogContent,
  Button,
  Text,
  tokens,
} from '@fluentui/react-components'
import { Warning24Regular } from '@fluentui/react-icons'

interface TokenDialogProps {
  open: boolean
  attachmentName: string
  currentTokens: number
  requiredTokens: number
  onDiscard: () => void
  onIncrease: () => void
}

export const TokenDialog: React.FC<TokenDialogProps> = ({
  open,
  attachmentName,
  currentTokens,
  requiredTokens,
  onDiscard,
  onIncrease,
}) => {
  const over = requiredTokens - currentTokens

  return (
    <Dialog open={open}>
      <DialogSurface>
        <DialogBody>
          <DialogTitle>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Warning24Regular style={{ color: tokens.colorPaletteYellowForeground1 }} />
              Token Limit Exceeded
            </div>
          </DialogTitle>
          <DialogContent>
            <Text block style={{ marginBottom: 12 }}>
              Including <strong>{attachmentName}</strong> would push over your token limit.
            </Text>

            <div style={{
              background: tokens.colorNeutralBackground2,
              borderRadius: tokens.borderRadiusMedium,
              padding: '10px 14px',
              display: 'flex',
              flexDirection: 'column',
              gap: 6,
            }}>
              <Row label="Current tokens" value={currentTokens.toLocaleString()} />
              <Row label="With attachment" value={`${requiredTokens.toLocaleString()} (+${over} over)`} highlight />
            </div>
          </DialogContent>
          <DialogActions>
            <Button appearance="secondary" onClick={onDiscard}>
              Discard File
            </Button>
            <Button appearance="primary" onClick={onIncrease}>
              Increase to {(requiredTokens + 200).toLocaleString()}
            </Button>
          </DialogActions>
        </DialogBody>
      </DialogSurface>
    </Dialog>
  )
}

const Row = ({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
    <Text size={200} style={{ opacity: 0.7 }}>{label}</Text>
    <Text size={200} weight="semibold" style={highlight ? { color: tokens.colorPaletteRedForeground1 } : {}}>
      {value}
    </Text>
  </div>
)
