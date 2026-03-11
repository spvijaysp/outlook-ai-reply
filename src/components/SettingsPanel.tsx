import React, { useState } from 'react'
import {
  Button,
  Input,
  Select,
  Textarea,
  Text,
  Spinner,
  tokens,
  Badge,
} from '@fluentui/react-components'
import {
  Eye20Regular,
  EyeOff20Regular,
  CheckmarkCircle20Regular,
  DismissCircle20Regular,
  ArrowLeft20Regular,
} from '@fluentui/react-icons'
import { Settings, LLMProvider, PROVIDER_MODELS, PROVIDER_LABELS, PROVIDER_ICONS } from '../types'
import { loadApiKey, saveApiKey, saveSettings } from '../utils/storage'
import { testConnection } from '../utils/llm'

interface SettingsPanelProps {
  settings: Settings
  onSave: (settings: Settings) => void
  onBack: () => void
}

export const SettingsPanel: React.FC<SettingsPanelProps> = ({ settings, onSave, onBack }) => {
  const [local, setLocal] = useState<Settings>({ ...settings })
  const [apiKey, setApiKey] = useState(loadApiKey(settings.provider))
  const [showKey, setShowKey] = useState(false)
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState<'ok' | 'fail' | null>(null)

  const update = (patch: Partial<Settings>) => setLocal(prev => ({ ...prev, ...patch }))

  const handleProviderChange = (provider: LLMProvider) => {
    update({ provider })
    setApiKey(loadApiKey(provider))
    setTestResult(null)
  }

  const handleTest = async () => {
    setTesting(true)
    setTestResult(null)
    saveApiKey(local.provider, apiKey)
    const ok = await testConnection(local)
    setTestResult(ok ? 'ok' : 'fail')
    setTesting(false)
  }

  const handleSave = () => {
    saveApiKey(local.provider, apiKey)
    saveSettings(local)
    onSave(local)
  }

  const models = PROVIDER_MODELS[local.provider]

  const activeModel = local.provider === 'anthropic' ? local.anthropicModel
    : local.provider === 'openai' ? local.openaiModel
    : local.provider === 'google' ? local.googleModel
    : local.ollamaModel

  const setActiveModel = (model: string) => {
    if (local.provider === 'anthropic') update({ anthropicModel: model })
    else if (local.provider === 'openai') update({ openaiModel: model })
    else if (local.provider === 'google') update({ googleModel: model })
    else update({ ollamaModel: model })
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header */}
      <div style={{
        padding: '12px 14px',
        borderBottom: `1px solid ${tokens.colorNeutralStroke1}`,
        display: 'flex', alignItems: 'center', gap: 8,
        background: tokens.colorNeutralBackground2,
        flexShrink: 0,
      }}>
        <Button appearance="subtle" icon={<ArrowLeft20Regular />} onClick={onBack} size="small" />
        <Text size={400} weight="semibold">⚙ Settings</Text>
      </div>

      {/* Body */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 14px' }}>

        {/* Provider */}
        <SectionLabel>LLM Provider</SectionLabel>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 20 }}>
          {(['anthropic', 'openai', 'google', 'ollama'] as LLMProvider[]).map(p => {
            const active = local.provider === p
            return (
              <div
                key={p}
                onClick={() => handleProviderChange(p)}
                style={{
                  background: active ? tokens.colorBrandBackground2 : tokens.colorNeutralBackground2,
                  border: `1px solid ${active ? tokens.colorBrandStroke1 : tokens.colorNeutralStroke1}`,
                  borderRadius: tokens.borderRadiusMedium,
                  padding: '10px 12px',
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                  position: 'relative',
                }}
              >
                {active && (
                  <div style={{ position: 'absolute', top: 6, right: 6 }}>
                    <CheckmarkCircle20Regular style={{ color: tokens.colorBrandForeground1, width: 14 }} />
                  </div>
                )}
                <div style={{ fontSize: 20, marginBottom: 4 }}>{PROVIDER_ICONS[p]}</div>
                <Text size={200} weight="semibold" block>{PROVIDER_LABELS[p]}</Text>
                {active && (
                  <Text size={100} style={{ color: tokens.colorBrandForeground1 }}>● Active</Text>
                )}
              </div>
            )
          })}
        </div>

        {/* Model */}
        <SectionLabel>Model</SectionLabel>
        <div style={{ marginBottom: 16 }}>
          <Select
            value={activeModel}
            onChange={(_, d) => setActiveModel(d.value)}
            size="small"
          >
            {models.map(m => <option key={m} value={m}>{m}</option>)}
          </Select>
        </div>

        {/* Ollama endpoint */}
        {local.provider === 'ollama' && (
          <div style={{ marginBottom: 16 }}>
            <SectionLabel>Ollama Endpoint</SectionLabel>
            <Input
              value={local.ollamaEndpoint}
              onChange={(_, d) => update({ ollamaEndpoint: d.value })}
              size="small"
              style={{ width: '100%' }}
            />
          </div>
        )}

        {/* API Key */}
        {local.provider !== 'ollama' && (
          <>
            <SectionLabel>API Key</SectionLabel>
            <div style={{ display: 'flex', gap: 6, marginBottom: 6 }}>
              <Input
                type={showKey ? 'text' : 'password'}
                value={apiKey}
                onChange={(_, d) => { setApiKey(d.value); setTestResult(null) }}
                size="small"
                style={{ flex: 1, fontFamily: 'monospace', fontSize: 11 }}
                placeholder={`Enter ${PROVIDER_LABELS[local.provider]} API key`}
              />
              <Button
                appearance="subtle"
                icon={showKey ? <EyeOff20Regular /> : <Eye20Regular />}
                onClick={() => setShowKey(!showKey)}
                size="small"
                title={showKey ? 'Hide key' : 'Show key'}
              />
              <Button
                appearance="outline"
                onClick={handleTest}
                size="small"
                disabled={testing || !apiKey}
              >
                {testing ? <Spinner size="tiny" /> : 'Test'}
              </Button>
            </div>
            {testResult === 'ok' && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 12 }}>
                <CheckmarkCircle20Regular style={{ color: tokens.colorPaletteGreenForeground1, width: 14 }} />
                <Text size={100} style={{ color: tokens.colorPaletteGreenForeground1 }}>Connected successfully</Text>
              </div>
            )}
            {testResult === 'fail' && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 12 }}>
                <DismissCircle20Regular style={{ color: tokens.colorPaletteRedForeground1, width: 14 }} />
                <Text size={100} style={{ color: tokens.colorPaletteRedForeground1 }}>Connection failed — check your key</Text>
              </div>
            )}
          </>
        )}

        {/* Persona */}
        <SectionLabel>Persona & Instructions</SectionLabel>
        <div style={{ marginBottom: 10 }}>
          <Text size={100} style={{ opacity: 0.6, display: 'block', marginBottom: 4 }}>Your role / context</Text>
          <Input
            value={local.personaRole}
            onChange={(_, d) => update({ personaRole: d.value })}
            size="small"
            style={{ width: '100%' }}
            placeholder="e.g. Senior Product Manager at Acme"
          />
        </div>
        <div style={{ marginBottom: 16 }}>
          <Text size={100} style={{ opacity: 0.6, display: 'block', marginBottom: 4 }}>Custom instructions</Text>
          <Textarea
            value={local.personaInstructions}
            onChange={(_, d) => update({ personaInstructions: d.value })}
            size="small"
            style={{ width: '100%' }}
            rows={4}
            placeholder="e.g. Keep replies concise. Always end with a call to action."
          />
        </div>

        {/* Preferences */}
        <SectionLabel>Preferences</SectionLabel>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <div>
            <Text size={100} style={{ opacity: 0.6, display: 'block', marginBottom: 4 }}>Reply options</Text>
            <Select
              value={String(local.replyCount)}
              onChange={(_, d) => update({ replyCount: Number(d.value) })}
              size="small"
            >
              <option value="1">1 option</option>
              <option value="2">2 options</option>
              <option value="3">3 options</option>
            </Select>
          </div>
          <div>
            <Text size={100} style={{ opacity: 0.6, display: 'block', marginBottom: 4 }}>Token limit</Text>
            <Select
              value={String(local.tokenLimit)}
              onChange={(_, d) => update({ tokenLimit: Number(d.value) })}
              size="small"
            >
              <option value="2000">2,000</option>
              <option value="3000">3,000</option>
              <option value="4000">4,000</option>
              <option value="6000">6,000</option>
            </Select>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div style={{
        padding: '12px 14px',
        borderTop: `1px solid ${tokens.colorNeutralStroke1}`,
        display: 'flex', gap: 8, justifyContent: 'flex-end',
        background: tokens.colorNeutralBackground2,
        flexShrink: 0,
      }}>
        <Button appearance="secondary" onClick={onBack}>Cancel</Button>
        <Button appearance="primary" onClick={handleSave}>Save Settings</Button>
      </div>
    </div>
  )
}

const SectionLabel: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div style={{
    borderBottom: `1px solid ${tokens.colorNeutralStroke1}`,
    marginBottom: 10,
    paddingBottom: 5,
  }}>
    <Text
      size={100}
      weight="semibold"
      style={{ letterSpacing: '0.1em', textTransform: 'uppercase', opacity: 0.5 }}
    >
      {children}
    </Text>
  </div>
)
