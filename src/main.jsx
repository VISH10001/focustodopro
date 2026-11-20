
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './focus_to_do_personal_edition pro.tsx';
import AuthGate from './AuthGate';
import './index.css';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AuthGate>
      <App />
    </AuthGate>
  </StrictMode>
);
