import { Component, type ErrorInfo } from 'react'
import { exportRecipes } from '../../model'
import { keys, readJson } from '../../storage'
import { PrimaryButton, TextButton } from '../Button'
import { Page } from '../Page'
import s from './index.module.css'

interface ErrorBoundaryProps {
  children: React.ReactNode
}

interface ErrorBoundaryState {
  error: Error | null
}

/** Catches render errors so the app shows a way out instead of a blank screen. */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error(error, info.componentStack)
  }

  backToList = () => {
    location.hash = '#/'
    this.setState({ error: null })
  }

  // Reads the raw cache rather than the store, which may be what crashed.
  exportCache = () => {
    const raw = readJson<unknown>(keys.recipes, [])
    exportRecipes(Array.isArray(raw) ? raw : [])
  }

  render() {
    const { error } = this.state
    if (!error) return this.props.children
    return (
      <Page center>
        <div className={s.fallback}>
          <div className={s.logo}>🥖</div>
          <p>Something went wrong.</p>
          <small className={s.message}>{error.message}</small>
          <PrimaryButton onClick={() => location.reload()}>Reload</PrimaryButton>
          <TextButton onClick={this.backToList}>Back to recipes</TextButton>
          <TextButton onClick={this.exportCache}>Export recipes</TextButton>
        </div>
      </Page>
    )
  }
}
