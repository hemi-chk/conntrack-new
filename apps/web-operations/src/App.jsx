import { useState } from 'react'
import Layout from './components/Layout'
import Dashboard from './Dashboard'
import CreateOrder from './CreateOrder'
import Orders from './Orders'
import Suppliers from './Suppliers'
import Tracking from './Tracking'
import Issues from './Issues'
import Bidding from './Bidding'
import Reports from './Reports'

function App() {
  const [currentPath, setCurrentPath] = useState('/')

  return (
    <Layout currentPath={currentPath} onNavigate={setCurrentPath}>

      {/* Dashboard (FIXED) */}
      {currentPath === '/' && (
        <Dashboard onNavigate={setCurrentPath} />
      )}

      {currentPath === '/create' && <CreateOrder />}
      
      {currentPath === '/orders' && (
        <Orders onNavigate={setCurrentPath} />
      )}

      {currentPath === '/suppliers' && <Suppliers />}

      {currentPath === '/tracking' && <Tracking />}

      {currentPath === '/issues' && <Issues />}

      {currentPath === '/bidding' && <Bidding />}

      {currentPath === '/reports' && <Reports />}

    </Layout>
  )
}

export default App