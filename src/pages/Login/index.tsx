import { useState } from 'react'
import { PrimaryButton, TextButton } from '../../components/Button'
import { Card } from '../../components/Card'
import { Hint } from '../../components/Hint'
import { Input } from '../../components/Input'
import { Page } from '../../components/Page'
import { Warning } from '../../components/Warning'
import { supabase } from '../../supabase'
import s from './index.module.css'

export function Login() {
  const [email, setEmail] = useState(() => localStorage.getItem('bakey.email') ?? '')
  const [code, setCode] = useState('')
  const [sent, setSent] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const send = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!supabase) return
    setBusy(true)
    setError('')
    localStorage.setItem('bakey.email', email)
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: location.origin + location.pathname, shouldCreateUser: true },
    })
    setBusy(false)
    if (error) setError(error.message)
    else setSent(true)
  }

  const verify = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!supabase) return
    setBusy(true)
    setError('')
    const { error } = await supabase.auth.verifyOtp({ email, token: code.trim(), type: 'email' })
    setBusy(false)
    if (error) setError(error.message)
  }

  return (
    <Page>
      <div className={s.login}>
        <div className={s.logo}>🥖</div>
        <h1>Bakey</h1>
        <Card>
          {!sent ? (
            <form onSubmit={send} className={s.form}>
              <Input type="email" required autoComplete="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
              <PrimaryButton disabled={busy}>{busy ? 'Sending…' : 'Send sign-in email'}</PrimaryButton>
            </form>
          ) : (
            <form onSubmit={verify} className={s.form}>
              <Hint flush>Check {email}. Tap the link, or enter the code from the email here (handy when using the home-screen app).</Hint>
              <Input inputMode="numeric" autoComplete="one-time-code" placeholder="Code" value={code} onChange={(e) => setCode(e.target.value)} />
              <PrimaryButton disabled={busy || code.trim().length < 6}>{busy ? 'Checking…' : 'Sign in'}</PrimaryButton>
              <TextButton type="button" onClick={() => setSent(false)}>
                Use another email
              </TextButton>
            </form>
          )}
        </Card>
        {error && <Warning>{error}</Warning>}
      </div>
    </Page>
  )
}
