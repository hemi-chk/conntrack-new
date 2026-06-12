import { useState } from 'react'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import Orders from './pages/Orders'
import OrderDetails from './pages/OrderDetails'
import Bids from './pages/Bids'
import Drivers from './pages/Drivers'
import Suppliers from './pages/Suppliers'
import Operations from './pages/Operations'
import Logistics from './pages/Logistics'
import Documents from './pages/Documents'
import Settings from './pages/Settings'
import Login from './pages/Login'


function App() {
  const [currentPath, setCurrentPath] = useState('/')
  const [darkMode, setDarkMode] = useState(false)

  // Auth check
  const token = localStorage.getItem('token')
  const role = localStorage.getItem('role')

  // If not logged in, show login page
  if (!token || !role) {
    return <Login />
  }

  const renderPage = () => {
    if (currentPath.startsWith('/orders/') && currentPath.length > 8) {
      const orderId = currentPath.split('/')[2]
      return <OrderDetails orderId={orderId} onNavigate={setCurrentPath} />
    }

    switch (currentPath) {
      case '/': return <Dashboard />
      case '/orders': return <Orders onNavigate={setCurrentPath} />
      case '/bids': return <Bids />
      case '/drivers': return <Drivers />
      case '/suppliers': return <Suppliers />
      case '/operations': return <Operations />
      case '/logistics': return <Logistics />
      case '/documents': return <Documents />
      case '/settings': return <Settings />
      default: return <Dashboard />
    }
  }

  return (
    <Layout
      currentPath={currentPath}
      onNavigate={setCurrentPath}
      darkMode={darkMode}
      onToggleDark={() => setDarkMode(!darkMode)}
    >
      {renderPage()}
    </Layout>
  )
}

export default App