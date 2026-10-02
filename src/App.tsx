import { Login } from './pages/Login'
import { RecipeEdit, newRecipe } from './pages/RecipeEdit'
import { RecipeList } from './pages/RecipeList'
import { RecipeView } from './pages/RecipeView'
import { Settings } from './pages/Settings'
import { useRoute } from './router'
import { useStore } from './store'
import { useMemo } from 'react'

export function App() {
  const { auth, recipes } = useStore()
  const route = useRoute()
  const fresh = useMemo(() => newRecipe(), [route.name === 'new']) // eslint-disable-line react-hooks/exhaustive-deps

  if (auth === 'loading') return <div className="page center">🥖</div>
  if (auth === 'signedOut') return <Login />

  switch (route.name) {
    case 'list':
      return <RecipeList />
    case 'settings':
      return <Settings />
    case 'new':
      return <RecipeEdit key={fresh.id} initial={fresh} isNew />
    case 'view':
    case 'edit': {
      const recipe = recipes.find((r) => r.id === route.id)
      if (!recipe) return <NotFound />
      return route.name === 'view' ? <RecipeView recipe={recipe} /> : <RecipeEdit key={recipe.id} initial={recipe} />
    }
  }
}

function NotFound() {
  return (
    <div className="page center">
      <p>Recipe not found.</p>
      <a className="textbtn" href="#/">
        Back to recipes
      </a>
    </div>
  )
}
