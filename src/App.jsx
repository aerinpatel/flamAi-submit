import { Routes, Route, Link } from 'react-router-dom'
import RootLayout from './components/RootLayout/RootLayout'
import HomePage from './pages/HomePage'
import AboutPage from './pages/AboutPage'
import ResultsPage from './pages/ResultsPage'
import RecipePage from './pages/RecipePage'

function NotFoundPage() {
  return (
    <main className="mx-auto flex min-h-[70vh] max-w-xl flex-col items-center justify-center gap-4 px-5 pt-24 text-center">
      <p className="text-7xl font-extrabold text-orange">404</p>
      <p className="text-xl font-semibold">This page isn't on the menu.</p>
      <Link to="/" className="btn">Back to home</Link>
    </main>
  )
}

export default function App() {
  return (
    <Routes>
      <Route element={<RootLayout />}>
        <Route index element={<HomePage />} />
        <Route path="about" element={<AboutPage />} />
        <Route path="results" element={<ResultsPage />} />
        <Route path="recipe/:id" element={<RecipePage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  )
}
