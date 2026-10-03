import { TextButton } from './components/Button'
import { Page } from './components/Page'
import { newRecipe } from './model'
import { Login } from './pages/Login'
import { RecipeEdit } from './pages/RecipeEdit'
import { RecipeList } from './pages/RecipeList'
import { RecipeView } from './pages/RecipeView'
import { Settings } from './pages/Settings'
import { useRoute } from './router'
import { useStore } from './storeContext'

export function App() {
  const { auth, recipes } = useStore()
  const route = useRoute()

  if (auth === 'loading') return <Page center>🥖</Page>
  if (auth === 'signedOut') return <Login />

  switch (route.name) {
    case 'list':
      return <RecipeList />
    case 'settings':
      return <Settings />
    case 'new':
      // initial is only read on mount, so this is a fresh draft each time the route is entered
      return <RecipeEdit key="new" initial={newRecipe()} isNew />
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
    <Page center>
      <p>Recipe not found.</p>
      <TextButton href="#/">Back to recipes</TextButton>
    </Page>
  )
}
