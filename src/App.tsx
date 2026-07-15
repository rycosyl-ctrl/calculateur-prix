import { useMemo } from 'react'
import { computeAll } from './engine/pipeline'
import { AppStateProvider, useAppState } from './state/AppStateContext'
import { AuthProvider, useAuth } from './auth/AuthContext'
import { Header } from './components/layout/Header'
import { LoginScreen } from './components/auth/LoginScreen'
import { SetPasswordScreen } from './components/auth/SetPasswordScreen'
import { GlobalParamsPanel } from './components/panels/GlobalParamsPanel'
import { OverfillTablePanel } from './components/panels/OverfillTablePanel'
import { VariantsTablePanel } from './components/panels/VariantsTablePanel'
import { ResultsTable } from './components/panels/ResultsTable'

function Workspace() {
  const { config, syncing } = useAppState()
  const pipeline = useMemo(() => computeAll(config), [config])

  return (
    <div className="min-h-screen">
      <Header />
      {syncing ? (
        <p className="mx-auto max-w-6xl px-6 py-10 text-sm text-slate-500">
          Chargement de vos calculs…
        </p>
      ) : (
        <main className="mx-auto grid max-w-6xl grid-cols-1 gap-5 px-6 py-6 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
          <div className="space-y-5">
            <GlobalParamsPanel />
            <VariantsTablePanel />
            <OverfillTablePanel />
          </div>
          <div>
            <ResultsTable pipeline={pipeline} />
          </div>
        </main>
      )}
    </div>
  )
}

function Gate() {
  const { session, loading, enabled, needsPassword } = useAuth()

  // Supabase non configuré : mode local sans compte (utile en développement)
  if (!enabled) {
    return (
      <AppStateProvider>
        <Workspace />
      </AppStateProvider>
    )
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-slate-500">
        Chargement…
      </div>
    )
  }

  if (!session) return <LoginScreen />

  if (needsPassword) return <SetPasswordScreen />

  return (
    <AppStateProvider key={session.user.id} userId={session.user.id}>
      <Workspace />
    </AppStateProvider>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <Gate />
    </AuthProvider>
  )
}
