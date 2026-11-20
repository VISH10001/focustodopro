import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './focus_to_do_personal_edition pro.tsx';
import './index.css';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>
);