import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import { ManagerApp } from './ManagerApp'
import './index.css'

const isManager = window.location.pathname.startsWith('/manage')

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    {isManager ? <ManagerApp /> : <App />}
  </React.StrictMode>,
)
