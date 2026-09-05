import { useState } from 'react'

import Layout from './components/Layout'

import Bidding from './Bidding'
import CreateOrder from './CreateOrder'
import Dashboard from './Dashboard'
import Issues from './Issues'
import Orders from './Orders'
import Tracking from './Tracking'

function App() {
  const [currentPath, setCurrentPath] = useState('/')
  const [darkMode, setDarkMode] = useState(false)

  return (
    <Layout
      currentPath={currentPath}
      onNavigate={setCurrentPath}
      darkMode={darkMode}
      onToggleDark={() => setDarkMode((current) => !current)}
    >
      {currentPath === '/' && (
        <Dashboard onNavigate={setCurrentPath} />
      )}

      {currentPath === '/create' && (
        <CreateOrder onNavigate={setCurrentPath} />
      )}

      {currentPath === '/orders' && (
        <Orders onNavigate={setCurrentPath} />
      )}

      {currentPath === '/bidding' && (
        <Bidding onNavigate={setCurrentPath} />
      )}

      {currentPath === '/tracking' && (
        <Tracking onNavigate={setCurrentPath} />
      )}

      {currentPath === '/issues' && (
        <Issues onNavigate={setCurrentPath} />
      )}
    </Layout>
  )
}

export default App