import { useMemo } from 'react'
import { computeAll } from './engine/pipeline'
import { AppStateProvider, useAppState } from './state/AppStateContext'
import { Header } from './components/layout/Header'
import { GlobalParamsPanel } from './components/panels/GlobalParamsPanel'
import { OverfillTablePanel } from './components/panels/OverfillTablePanel'
import { VariantsTablePanel } from './components/panels/VariantsTablePanel'
import { ResultsTable } from './components/panels/ResultsTable'

function Workspace() {
  const { config } = useAppState()
  const pipeline = useMemo(() => computeAll(config), [config])

  return (
    <div className="min-h-screen">
      <Header />
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
    </div>
  )
}

export default function App() {
  return (
    <AppStateProvider>
      <Workspace />
    </AppStateProvider>
  )
}
