import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { AuthProvider } from './store/authContext.jsx' // <-- 1. IMPORT THIS

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AuthProvider>  {/* <-- 2. WRAP YOUR APP COMPONENT */}
      <App />
    </AuthProvider>
  </StrictMode>,
)