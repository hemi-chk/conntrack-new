import { useState } from 'react'
import Layout from './components/Layout'
import Dashboard from './Dashboard'
import CreateOrder from './CreateOrder'
import Orders from './Orders'
import Tracking from './Tracking'
import Issues from './Issues'
import Bidding from './Bidding'

function App() {
  const [currentPath, setCurrentPath] = useState('/')

  return (
    <Layout currentPath={currentPath} onNavigate={setCurrentPath}>
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