import React, { useState, useEffect } from 'react'
import { createRoot } from 'react-dom/client'
import {
  FluentProvider,
  webLightTheme,
  webDarkTheme,
} from '@fluentui/react-components'
import { ReplyPanel } from './components/ReplyPanel'

const App: React.FC = () => {
  const [dark, setDark] = useState(
    window.matchMedia('(prefers-color-scheme: dark)').matches
  )

  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const handler = (e: MediaQueryListEvent) => setDark(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  return (
    <FluentProvider theme={dark ? webDarkTheme : webLightTheme} style={{ height: '100vh' }}>
      <ReplyPanel />
    </FluentProvider>
  )
}

Office.onReady(() => {
  const root = createRoot(document.getElementById('root')!)
  root.render(<App />)
})
