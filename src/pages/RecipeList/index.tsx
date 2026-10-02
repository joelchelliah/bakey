import { IconButton, PrimaryButton, TextButton } from '../../components/Button'
import { Icon } from '../../components/Icon'
import { Page } from '../../components/Page'
import { TopBar } from '../../components/TopBar'
import { href } from '../../router'
import { starterRecipes } from '../../seed'
import { useStore } from '../../storeContext'
import s from './index.module.css'

export function RecipeList() {
  const { recipes, addMany, sync } = useStore()
  return (
    <Page>
      <TopBar
        start={<span className={s.brand}>Bakey</span>}
        end={
          <>
            {sync === 'pending' && (
              <span className={s.badge} title="Changes waiting to sync">
                Offline
              </span>
            )}
            <IconButton icon="gear" label="Settings" href={href({ name: 'settings' })} />
          </>
        }
      />

      {recipes.length === 0 ? (
        <div className={s.empty}>
          <p>No recipes yet.</p>
          <PrimaryButton onClick={() => addMany(starterRecipes())}>Add starter recipes</PrimaryButton>
          <TextButton href={href({ name: 'new' })}>or create your own</TextButton>
        </div>
      ) : (
        <ul className={s.list}>
          {recipes.map((r) => (
            <li key={r.id}>
              <a href={href({ name: 'view', id: r.id })}>
                <span className={s.emoji}>{r.emoji}</span>
                <span className={s.text}>
                  <span className={s.name}>{r.name}</span>
                  {r.variants.length > 1 && <small>{r.variants.map((v) => v.name).join(' · ')}</small>}
                </span>
                <Icon name="back" size={18} />
              </a>
            </li>
          ))}
        </ul>
      )}

      <a className={s.fab} href={href({ name: 'new' })} aria-label="New recipe">
        <Icon name="plus" size={28} />
      </a>
    </Page>
  )
}
