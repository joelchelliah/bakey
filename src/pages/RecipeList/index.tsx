import { IconButton, PrimaryButton, TextButton } from '../../components/Button'
import { Icon } from '../../components/Icon'
import { Page } from '../../components/Page'
import { TopBar } from '../../components/TopBar'
import { href } from '../../router'
import { starterRecipes } from '../../seed'
import { useStore } from '../../storeContext'
import { categories } from '../../types'
import type { Category } from '../../types'
import s from './index.module.css'

export function RecipeList() {
  const { recipes, addMany, sync } = useStore()
  const groups = (Object.keys(categories) as Category[])
    .map((c) => ({ category: c, items: recipes.filter((r) => r.category === c) }))
    .filter((g) => g.items.length > 0)
  return (
    <Page>
      <TopBar
        start={
          <span className={s.brand}>
            <svg className={s.logo} width={40} height={40} viewBox="0 0 32 32" aria-hidden>
              <path d="M3 23c0-8 5.8-14 13-14s13 6 13 14z" />
              <path d="M11 14l2 4M16 13v5M21 14l-2 4" />
            </svg>
            Bakey
          </span>
        }
        end={
          <>
            {sync === 'pending' && (
              <span className={s.badge} title="Changes waiting to sync">
                Offline
              </span>
            )}
            <a className={s.add} href={href({ name: 'new' })} aria-label="New recipe">
              <Icon name="plus" size={22} />
            </a>
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
        groups.map(({ category, items }) => (
          <section key={category}>
            <h2 className={s.group}>{categories[category]}</h2>
            <ul className={s.list}>
              {items.map((r) => (
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
          </section>
        ))
      )}
    </Page>
  )
}
