import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider, useAuth } from '@/context/AuthContext'
import { Layout } from '@/components/layout/Layout'
import { LoginPage } from '@/pages/LoginPage'
import { HomePage } from '@/pages/HomePage'
import { MedicinesPage } from '@/pages/MedicinesPage'
import { HistoryPage } from '@/pages/HistoryPage'
import { DoctorVisitsPage } from '@/pages/DoctorVisitsPage'
import { SettingsPage } from '@/pages/SettingsPage'
import { LogDosePage } from '@/pages/LogDosePage'
import { StockDaysPage } from '@/pages/StockDaysPage'
import { PageLoader } from '@/components/common/LoadingSpinner'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, staleTime: 30_000 },
    mutations: { retry: 0 },
  },
})

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { session, loading } = useAuth()
  if (loading) return <PageLoader />
  if (!session) return <Navigate to="/login" replace />
  return <Layout>{children}</Layout>
}

function AppRoutes() {
  const { session, loading } = useAuth()
  if (loading) return <PageLoader />

  return (
    <Routes>
      <Route path="/login" element={session ? <Navigate to="/" replace /> : <LoginPage />} />
      <Route path="/" element={<ProtectedRoute><HomePage /></ProtectedRoute>} />
      <Route path="/medicines" element={<ProtectedRoute><MedicinesPage /></ProtectedRoute>} />
      <Route path="/history" element={<ProtectedRoute><HistoryPage /></ProtectedRoute>} />
      <Route path="/doctor-visits" element={<ProtectedRoute><DoctorVisitsPage /></ProtectedRoute>} />
      <Route path="/log-dose" element={<ProtectedRoute><LogDosePage /></ProtectedRoute>} />
      <Route path="/stock-days" element={<ProtectedRoute><StockDaysPage /></ProtectedRoute>} />
      <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  )
}
