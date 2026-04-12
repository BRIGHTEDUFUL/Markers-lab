import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { ThemeProvider } from './contexts/ThemeContext';
import ErrorBoundary from './components/ErrorBoundary';
import {AuthProvider} from './contexts/AuthContext';
import App from './App';
import './index.css';

const resetScrollToTop = () => {
  window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  document.documentElement.scrollTop = 0;
  document.body.scrollTop = 0;
};

if ('scrollRestoration' in window.history) {
  window.history.scrollRestoration = 'manual';
}

resetScrollToTop();
window.addEventListener('pageshow', () => {
  resetScrollToTop();
});

const isIos = /iPad|iPhone|iPod/.test(window.navigator.userAgent)
  || (window.navigator.platform === 'MacIntel' && window.navigator.maxTouchPoints > 1);
if (isIos) {
  document.documentElement.classList.add('ios');
}

const nav = window.navigator as Navigator & { standalone?: boolean };
if (nav.standalone === true || window.matchMedia('(display-mode: standalone)').matches) {
  document.documentElement.classList.add('ios-standalone');
}

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
