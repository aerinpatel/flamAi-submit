import { useEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { IngredientsProvider } from '../context/IngredientsContext'
import { RecipeFlowProvider } from '../context/RecipeFlowContext'
import Navbar from '../components/Navbar/Navbar'
import Footer from '../components/Footer/Footer'

export default function RootLayout() {
  const { pathname } = useLocation()
  useEffect(() => { window.scrollTo(0, 0) }, [pathname])

  return (
    <IngredientsProvider>
      <RecipeFlowProvider>
        <div className="wrap">
          <Navbar />
          <Outlet />
          <Footer />
        </div>
      </RecipeFlowProvider>
    </IngredientsProvider>
  )
}
