import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import { ManagerApp } from './ManagerApp'
import { BarApp } from './BarApp'
import './index.css'

const isManager = window.location.search.includes('manage=true') || window.location.hash.includes('manage') || window.location.pathname.includes('/manage')
const isBar = window.location.search.includes('bar=true') || window.location.hash.includes('bar') || window.location.pathname.includes('/bar')

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    {isBar ? <BarApp /> : isManager ? <ManagerApp /> : <App />}
  </React.StrictMode>,
)
