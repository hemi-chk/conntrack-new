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
import Staff from './pages/Staff'
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

  // Redirect if logged in with non-admin role
  if (role !== 'admin') {
    const externalRedirectMap = {
      operations: "http://127.0.0.1:5174",
      supplier: "http://127.0.0.1:5175",
      logistics: "http://127.0.0.1:5176",
    }
    if (externalRedirectMap[role]) {
      const redirectUrl = new URL(externalRedirectMap[role])
      redirectUrl.searchParams.set("token", token)
      redirectUrl.searchParams.set("role", role)
      redirectUrl.searchParams.set("user", localStorage.getItem('user') || '{}')
      window.location.href = redirectUrl.toString()
      return null
    }
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
      case '/staff': return <Staff darkMode={darkMode} />
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