import { useState } from 'react'
import { supabase } from '../supabase'

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
    <div className="page login">
      <div className="logo">🥖</div>
      <h1>Bakey</h1>
      {!sent ? (
        <form onSubmit={send} className="card form">
          <input type="email" required autoComplete="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
          <button className="primarybtn" disabled={busy}>
            {busy ? 'Sending…' : 'Send sign-in email'}
          </button>
        </form>
      ) : (
        <form onSubmit={verify} className="card form">
          <p className="hint">Check {email}. Tap the link, or enter the code from the email here (handy when using the home-screen app).</p>
          <input inputMode="numeric" autoComplete="one-time-code" placeholder="Code" value={code} onChange={(e) => setCode(e.target.value)} />
          <button className="primarybtn" disabled={busy || code.trim().length < 6}>
            {busy ? 'Checking…' : 'Sign in'}
          </button>
          <button type="button" className="textbtn" onClick={() => setSent(false)}>
            Use another email
          </button>
        </form>
      )}
      {error && <p className="warn">{error}</p>}
    </div>
  )
}
