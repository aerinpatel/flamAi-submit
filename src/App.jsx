import { Routes, Route } from 'react-router-dom'
import RootLayout from './layouts/RootLayout'
import HomePage from './pages/HomePage'
import ResultsPage from './pages/ResultsPage'

export default function App() {
  return (
    <Routes>
      <Route element={<RootLayout />}>
        <Route index element={<HomePage />} />
        <Route path="results" element={<ResultsPage />} />
      </Route>
    </Routes>
  )
}