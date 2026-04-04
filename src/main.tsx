import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { ThemeProvider } from './contexts/ThemeContext';
import ErrorBoundary from './components/ErrorBoundary';
import {AuthProvider} from './contexts/AuthContext';
import App from './App';
import './index.css';

// Register Service Worker for PWA
// VitePWA handles this automatically in most cases, but we can keep it if needed
// However, manual registration of /sw.js might conflict with VitePWA's generated one.
// We'll let VitePWA handle it.

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <HelmetProvider>
        <BrowserRouter>
          <ThemeProvider>
            <AuthProvider>
              <App />
            </AuthProvider>
          </ThemeProvider>
        </BrowserRouter>
      </HelmetProvider>
    </ErrorBoundary>
  </StrictMode>,
);
