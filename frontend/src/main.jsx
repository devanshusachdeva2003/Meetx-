import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { Toaster } from 'sonner'
import './index.css'
import Router from './router.jsx'
import { UserProvider } from './context/UserContext.jsx'
import { ThemeProvider } from './context/ThemeContext.jsx'

import { CreateMeetingProvider } from './context/CreateMeetingContext.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ThemeProvider>
      <UserProvider>
        <BrowserRouter>
          <CreateMeetingProvider>
            <Toaster position="top-right" theme="dark" richColors />
            <Router />
          </CreateMeetingProvider>
        </BrowserRouter>
      </UserProvider>
    </ThemeProvider>
  </StrictMode>,
)
