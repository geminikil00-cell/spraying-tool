import { Navigate, Route, Routes } from 'react-router-dom'
import Layout from './components/Layout'
import RequireAuth from './components/RequireAuth'
import { FarmDataProvider } from './lib/FarmDataContext'
import AuthPage from './pages/AuthPage'
import ParamsPage from './pages/ParamsPage'
import PlanningPage from './pages/PlanningPage'
import RecordsPage from './pages/RecordsPage'
import SprayPage from './pages/SprayPage'

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<AuthPage />} />
      <Route
        element={
          <RequireAuth />
        }
      >
        <Route
          element={
            <FarmDataProvider>
              <Layout />
            </FarmDataProvider>
          }
        >
          <Route path="/" element={<Navigate to="/spray" replace />} />
          <Route path="/spray" element={<SprayPage />} />
          <Route path="/records" element={<RecordsPage />} />
          <Route path="/params" element={<ParamsPage />} />
          <Route path="/planning" element={<PlanningPage />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/spray" replace />} />
    </Routes>
  )
}
