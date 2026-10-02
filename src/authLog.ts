// TEMPORARY: on-device auth trace for debugging unexpected sign-outs in the home-screen app. Remove when solved.

const KEY = 'bakey.authlog'
const MAX = 1500
const NOISE = ['#_acquireLock', '#_useSession', '#_autoRefreshTokenTick()', '#getSession()']
const SECRET = new Set(['access_token', 'refresh_token', 'provider_token', 'provider_refresh_token', 'user'])

function redact(value: unknown) {
  if (typeof value === 'string') return value
  try {
    return JSON.stringify(value, (k, v) => (SECRET.has(k) ? (v ? '…' : v) : v))
  } catch {
    return String(value)
  }
}

export function authLog(...args: unknown[]) {
  // auth-js calls the logger as (prefix, message, ...details); our own calls pass just the message.
  const parts = typeof args[0] === 'string' && args[0].startsWith('GoTrueClient@') ? args.slice(1) : args
  if (typeof parts[0] === 'string' && NOISE.some((n) => (parts[0] as string).startsWith(n))) return
  try {
    const log: string[] = JSON.parse(localStorage.getItem(KEY) ?? '[]')
    log.push(`${new Date().toISOString().slice(5, 23)} ${parts.map(redact).join(' ').slice(0, 400)}`)
    localStorage.setItem(KEY, JSON.stringify(log.slice(-MAX)))
  } catch {
    // storage unavailable – nothing to do
  }
}

export function readAuthLog() {
  return (JSON.parse(localStorage.getItem(KEY) ?? '[]') as string[]).join('\n')
}

// What the stored session looks like at launch, before Supabase touches it.
function bootSnapshot() {
  const keys = Object.keys(localStorage)
  const authKey = keys.find((k) => k.startsWith('sb-') && k.endsWith('-auth-token'))
  let session = 'none'
  if (authKey) {
    try {
      const s = JSON.parse(localStorage.getItem(authKey) ?? 'null')
      session = s
        ? `expires ${new Date(s.expires_at * 1000).toISOString()} refresh=${s.refresh_token ? 'yes' : 'no'}`
        : 'null'
    } catch {
      session = 'unparseable'
    }
  }
  const standalone = matchMedia('(display-mode: standalone)').matches
  authLog(`BOOT standalone=${standalone} session=${session} keys=${keys.join(',')}`)
}

try {
  bootSnapshot()
} catch (e) {
  authLog('BOOT snapshot failed', String(e))
}
addEventListener('visibilitychange', () => authLog(`VISIBILITY ${document.visibilityState}`))
addEventListener('pagehide', (e) => authLog(`PAGEHIDE persisted=${e.persisted}`))
