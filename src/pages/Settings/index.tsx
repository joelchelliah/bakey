import { useRef, useState } from 'react'
import { IconButton, TextButton } from '../../components/Button'
import { Card } from '../../components/Card'
import { Hint } from '../../components/Hint'
import { Page } from '../../components/Page'
import { Row, RowValue } from '../../components/Row'
import { SectionTitle } from '../../components/SectionTitle'
import { TopBar } from '../../components/TopBar'
import { href } from '../../router'
import { starterRecipes } from '../../seed'
import { useStore } from '../../storeContext'
import { supabase } from '../../supabase'
import type { Recipe } from '../../types'
import s from './index.module.css'

const SYNC_LABEL = {
  local: 'Local only (Supabase not configured)',
  synced: 'Synced',
  syncing: 'Syncing…',
  pending: 'Waiting to sync',
}

export function Settings() {
  const { recipes, addMany, remove, email, sync, signOut, refresh } = useStore()
  const file = useRef<HTMLInputElement>(null)
  const [msg, setMsg] = useState('')

  const exportJson = () => {
    const blob = new Blob([JSON.stringify({ app: 'bakey', version: 1, recipes }, null, 2)], {
      type: 'application/json',
    })
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
      if (!Array.isArray(list) || !list.every((r) => r.id && Array.isArray(r.variants)))
        throw new Error('Not a Bakey export')
      addMany(list)
      setMsg(`Imported ${list.length} recipe${list.length === 1 ? '' : 's'}.`)
    } catch (e) {
      setMsg(`Import failed: ${(e as Error).message}`)
    }
  }

  return (
    <Page>
      <TopBar start={<IconButton icon="back" label="Back" href={href({ name: 'list' })} />} title="Settings" />

      <SectionTitle>Account</SectionTitle>
      <Card>
        {email && (
          <Row label="Signed in as">
            <RowValue muted>{email}</RowValue>
          </Row>
        )}
        <Row label="Sync">
          <RowValue muted>{SYNC_LABEL[sync]}</RowValue>
        </Row>
        {supabase && (
          <Row className={s.split}>
            <TextButton onClick={refresh}>Sync now</TextButton>
            <TextButton danger onClick={() => confirm('Sign out on this device?') && signOut()}>
              Sign out
            </TextButton>
          </Row>
        )}
      </Card>

      <SectionTitle>Backup</SectionTitle>
      <Card>
        <button className={s.rowButton} onClick={exportJson}>
          Export recipes (JSON)
        </button>
        <button className={s.rowButton} onClick={() => file.current?.click()}>
          Import from file…
        </button>
        <button
          className={s.rowButton}
          onClick={() => {
            if (!confirm('Replace all recipes with the starter recipes?')) return
            recipes.forEach((r) => remove(r.id))
            addMany(starterRecipes())
            setMsg('Starter recipes restored.')
          }}
        >
          Reset to starter recipes
        </button>
        <input
          ref={file}
          type="file"
          accept="application/json,.json"
          hidden
          onChange={(e) => e.target.files?.[0] && importJson(e.target.files[0])}
        />
        {msg && <Hint>{msg}</Hint>}
      </Card>
    </Page>
  )
}
