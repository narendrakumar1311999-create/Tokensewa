import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { registerSW } from 'virtual:pwa-register';

// Auto-register PWA service worker immediately for background notifications and offline capabilities
registerSW({ immediate: true });

createRoot(document.getElementById('root')!).render(<App />);

