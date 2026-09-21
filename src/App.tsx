import { useState } from 'react'
import { BudgetProvider, useBudget } from './store'
import { TopNav, type TabId } from './components/TopNav'
import { SettingsSheet } from './components/SettingsSheet'
import { UndoToast } from './components/UndoToast'
import { Banner } from './components/Banner'
import { HomeView } from './views/HomeView'
import { WalletView } from './views/WalletView'
import { ExpensesView } from './views/ExpensesView'
import { PeopleView } from './views/PeopleView'

function AppShell() {
  const { state, canUndo, notice, persistError, undo, dismissNotice } = useBudget()
  const [activeTab, setActiveTab] = useState<TabId>('home')
  const [showSettings, setShowSettings] = useState(false)

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F5F5F7' }}>
      <TopNav
        activeTab={activeTab}
        onTabChange={setActiveTab}
        displayName={state.settings.displayName}
        onSettingsClick={() => setShowSettings(true)}
      />

      <Banner
        notice={notice}
        persistError={persistError}
        onDismissNotice={dismissNotice}
      />

      <main className="max-w-5xl mx-auto px-6 py-6 sm:py-10 safe-bottom">
        {activeTab === 'home' && <HomeView />}
        {activeTab === 'wallet' && <WalletView />}
        {activeTab === 'expenses' && <ExpensesView />}
        {activeTab === 'people' && <PeopleView />}
      </main>

      <SettingsSheet open={showSettings} onClose={() => setShowSettings(false)} />
      <UndoToast visible={canUndo} onUndo={undo} />
    </div>
  )
}

export default function App() {
  return (
    <BudgetProvider>
      <AppShell />
    </BudgetProvider>
  )
}
