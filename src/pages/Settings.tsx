import { useRef, useState } from 'react'
import { Icon } from '../components/Icon'
import { href } from '../router'
import { starterRecipes } from '../seed'
import { useStore } from '../store'
import { supabase } from '../supabase'
import type { Recipe } from '../types'

const SYNC_LABEL = { local: 'Local only (Supabase not configured)', synced: 'Synced', syncing: 'Syncing…', pending: 'Waiting to sync' }

export function Settings() {
  const { recipes, addMany, email, sync, signOut, refresh } = useStore()
  const file = useRef<HTMLInputElement>(null)
  const [msg, setMsg] = useState('')

  const exportJson = () => {
    const blob = new Blob([JSON.stringify({ app: 'bakey', version: 1, recipes }, null, 2)], { type: 'application/json' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `bakey-recipes-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(a.href)
  }

  const importJson = async (f: File) => {
    try {
      const parsed = JSON.parse(await f.text())
      const list: Recipe[] = Array.isArray(parsed) ? parsed : parsed.recipes
      if (!Array.isArray(list) || !list.every((r) => r.id && Array.isArray(r.variants))) throw new Error('Not a Bakey export')
      addMany(list)
      setMsg(`Imported ${list.length} recipe${list.length === 1 ? '' : 's'}.`)
    } catch (e) {
      setMsg(`Import failed: ${(e as Error).message}`)
    }
  }

  return (
    <div className="page">
      <header className="bar">
        <a className="iconbtn" href={href({ name: 'list' })} aria-label="Back">
          <Icon name="back" />
        </a>
        <span className="bar-title">Settings</span>
        <span className="iconbtn" />
      </header>

      <h2 className="sechead">Account</h2>
      <section className="card form">
        {email && (
          <div className="row">
            <span className="label">Signed in as</span>
            <span className="out small">{email}</span>
          </div>
        )}
        <div className="row">
          <span className="label">Sync</span>
          <span className="out small">{SYNC_LABEL[sync]}</span>
        </div>
        {supabase && (
          <div className="row">
            <button className="textbtn" onClick={refresh}>
              Sync now
            </button>
            <span className="grow" />
            <button className="textbtn danger" onClick={() => confirm('Sign out on this device?') && signOut()}>
              Sign out
            </button>
          </div>
        )}
      </section>

      <h2 className="sechead">Backup</h2>
      <section className="card form">
        <button className="rowbtn" onClick={exportJson}>
          Export recipes (JSON)
        </button>
        <button className="rowbtn" onClick={() => file.current?.click()}>
          Import from file…
        </button>
        <button
          className="rowbtn"
          onClick={() => {
            addMany(starterRecipes())
            setMsg('Starter recipes added.')
          }}
        >
          Add starter recipes
        </button>
        <input ref={file} type="file" accept="application/json,.json" hidden onChange={(e) => e.target.files?.[0] && importJson(e.target.files[0])} />
        {msg && <p className="hint">{msg}</p>}
      </section>
    </div>
  )
}
