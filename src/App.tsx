import { HashRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './lib/auth'
import { ToastProvider } from './components/Toast'
import { Layout } from './components/Layout'
import { ProtectedRoute } from './components/ProtectedRoute'
import { IS_CONFIGURED } from './lib/config'
import { NotConfigured } from './pages/NotConfigured'

import Home from './pages/Home'
import Apply from './pages/Apply'
import MyApplication from './pages/MyApplication'
import Applications from './pages/admin/Applications'
import CalendarPage from './pages/admin/CalendarPage'
import Roster from './pages/admin/Roster'
import Meeting from './pages/admin/Meeting'
import Hierarchy from './pages/admin/Hierarchy'
import Managers from './pages/admin/Managers'
import NotFound from './pages/NotFound'

export default function App() {
  if (!IS_CONFIGURED) return <NotConfigured />

  return (
    <AuthProvider>
      <ToastProvider>
        <HashRouter>
          <Layout>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route
                path="/postuler"
                element={
                  <ProtectedRoute require="auth">
                    <Apply />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/ma-candidature"
                element={
                  <ProtectedRoute require="auth">
                    <MyApplication />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin"
                element={
                  <ProtectedRoute require="manager">
                    <Applications />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/calendrier"
                element={
                  <ProtectedRoute require="manager">
                    <CalendarPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/effectif"
                element={
                  <ProtectedRoute require="manager">
                    <Roster />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/reunion"
                element={
                  <ProtectedRoute require="manager">
                    <Meeting />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/hierarchie"
                element={
                  <ProtectedRoute require="manager">
                    <Hierarchy />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/gerants"
                element={
                  <ProtectedRoute require="owner">
                    <Managers />
                  </ProtectedRoute>
                }
              />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Layout>
        </HashRouter>
      </ToastProvider>
    </AuthProvider>
  )
}
