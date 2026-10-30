import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@fontsource-variable/albert-sans'
import '@fontsource-variable/kantumruy-pro'
import './index.css'
import './App.css'
import App from './App'
import { TooltipProvider } from '@/components/ui/tooltip'
import { Provider } from 'react-redux'
import { store } from './store/store'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

import { LanguageProvider } from '@/i18n/LanguageContext'
import { ThemeProvider } from 'next-themes'
import { PrimaryColorProvider } from '@/theme/PrimaryColorContext'

const queryClient = new QueryClient()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false} disableTransitionOnChange>
          <PrimaryColorProvider>
            <LanguageProvider>
              <TooltipProvider>
                <App />
              </TooltipProvider>
            </LanguageProvider>
          </PrimaryColorProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </Provider>
  </StrictMode>,
)
