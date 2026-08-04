import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Intercept transient browser database connection / closing errors in iframe & tab background states
if (typeof window !== 'undefined') {
  window.addEventListener('unhandledrejection', (event) => {
    const reasonStr = String(event.reason?.message || event.reason || '');
    if (
      reasonStr.toLowerCase().includes('database is closing') ||
      reasonStr.toLowerCase().includes('database connection is closing') ||
      reasonStr.toLowerCase().includes('closing/hidden') ||
      reasonStr.includes('IndexedDB') ||
      reasonStr.includes('no-speech')
    ) {
      console.warn('[System Guard] Prevented unhandled database closing/hidden rejection:', reasonStr);
      event.preventDefault();
    }
  });

  window.addEventListener('error', (event) => {
    const errorMsg = String(event.message || event.error?.message || '');
    if (
      errorMsg.toLowerCase().includes('database is closing') ||
      errorMsg.toLowerCase().includes('database connection is closing') ||
      errorMsg.toLowerCase().includes('closing/hidden')
    ) {
      console.warn('[System Guard] Prevented unhandled database closing/hidden error:', errorMsg);
      event.preventDefault();
    }
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

