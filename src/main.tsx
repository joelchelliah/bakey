import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from './App'
import { StoreProvider } from './store'
import './styles/tokens.css'
import './styles/global.css'

const root = document.getElementById('root')

if (!root) throw new Error('#root missing')

createRoot(root).render(
  <StrictMode>
    <StoreProvider>
      <App />
    </StoreProvider>
  </StrictMode>,
)
