import { Outlet } from 'react-router-dom'
import { IngredientsProvider } from '../context/IngredientsContext'
import Navbar from '../components/Navbar/Navbar'
import Footer from '../components/Footer/Footer'

export default function RootLayout() {
  return (
    <IngredientsProvider>
      <div className="wrap">
        <Navbar />
        <Outlet />
        <Footer />
      </div>
    </IngredientsProvider>
  )
}