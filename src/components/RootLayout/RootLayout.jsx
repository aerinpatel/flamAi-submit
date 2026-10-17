import { useEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { IngredientsProvider } from '../../hooks/useIngredients'
import { RecipeFlowProvider } from '../../hooks/useRecipeFlow'
import Navbar from '../Navbar/Navbar'
import Footer from '../Footer/Footer'

export default function RootLayout() {
  const { pathname } = useLocation()
  useEffect(() => { window.scrollTo(0, 0) }, [pathname])

  return (
    <IngredientsProvider>
      <RecipeFlowProvider>
        <div className="relative">
          <Navbar />
          <Outlet />
          <Footer />
        </div>
      </RecipeFlowProvider>
    </IngredientsProvider>
  )
}
