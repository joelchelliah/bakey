import { Icon } from '../components/Icon'
import { href } from '../router'
import { starterRecipes } from '../seed'
import { useStore } from '../store'

export function RecipeList() {
  const { recipes, addMany, sync } = useStore()
  return (
    <div className="page">
      <header className="bar">
        <span className="brand">Bakey</span>
        <div className="bar-actions">
          {sync === 'pending' && <span className="badge" title="Changes waiting to sync">Offline</span>}
          <a className="iconbtn" href={href({ name: 'settings' })} aria-label="Settings">
            <Icon name="gear" />
          </a>
        </div>
      </header>

      {recipes.length === 0 ? (
        <div className="empty">
          <p>No recipes yet.</p>
          <button className="primarybtn" onClick={() => addMany(starterRecipes())}>
            Add starter recipes
          </button>
          <a className="textbtn" href={href({ name: 'new' })}>
            or create your own
          </a>
        </div>
      ) : (
        <ul className="list">
          {recipes.map((r) => (
            <li key={r.id}>
              <a href={href({ name: 'view', id: r.id })}>
                <span className="emoji">{r.emoji}</span>
                <span className="grow">
                  <span className="name">{r.name}</span>
                  {r.variants.length > 1 && <small>{r.variants.map((v) => v.name).join(' · ')}</small>}
                </span>
                <Icon name="back" size={18} />
              </a>
            </li>
          ))}
        </ul>
      )}

      <a className="fab" href={href({ name: 'new' })} aria-label="New recipe">
        <Icon name="plus" size={28} />
      </a>
    </div>
  )
}
