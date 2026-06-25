import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
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
            <Router />
          </CreateMeetingProvider>
        </BrowserRouter>
      </UserProvider>
    </ThemeProvider>
  </StrictMode>,
)
