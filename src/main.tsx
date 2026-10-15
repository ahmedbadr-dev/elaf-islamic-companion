import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import { LocationsDashboard } from './components/dashboard/LocationsDashboard'
import './index.css'

const path = window.location.pathname.replace(/\/+$/, '') || '/'
const hash = window.location.hash.replace(/^#\/?/, '')
const isDashboard = path === '/dashboard' || hash === 'dashboard'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>{isDashboard ? <LocationsDashboard /> : <App />}</React.StrictMode>,
)
