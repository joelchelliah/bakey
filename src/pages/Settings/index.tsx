import { useRef, useState } from 'react'
import { readAuthLog } from '../../authLog'
import { IconButton, TextButton } from '../../components/Button'
import { Card } from '../../components/Card'
import { Hint } from '../../components/Hint'
import { Page } from '../../components/Page'
import { Row, RowValue } from '../../components/Row'
import { SectionTitle } from '../../components/SectionTitle'
import { TopBar } from '../../components/TopBar'
import { exportRecipes, parseBackup } from '../../model'
import { href } from '../../router'
import { starterRecipes } from '../../seed'
import { useStore } from '../../storeContext'
import { supabase } from '../../supabase'
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

  const importJson = async (f: File) => {
    try {
      const list = parseBackup(await f.text())
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
        <button className={s.rowButton} onClick={() => exportRecipes(recipes)}>
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
        <button
          className={s.rowButton}
          onClick={() =>
            navigator.clipboard.writeText(readAuthLog()).then(
              () => setMsg('Auth log copied.'),
              (e: Error) => setMsg(`Copy failed: ${e.message}`),
            )
          }
        >
          Copy auth log
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
