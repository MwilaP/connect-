import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import './index.css'
import { SupabaseProvider } from './contexts/SupabaseContext'
import { SubscriptionProvider } from './contexts/SubscriptionContext'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <SupabaseProvider>
        <SubscriptionProvider>
          <App />
        </SubscriptionProvider>
      </SupabaseProvider>
    </BrowserRouter>
  </React.StrictMode>,
)
