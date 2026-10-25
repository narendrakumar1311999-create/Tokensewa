import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { registerSW } from 'virtual:pwa-register';
import { initGitHubPagesAdapter } from './utils/githubPagesAdapter';

// Initialize GitHub Pages offline & static hosting adapter
initGitHubPagesAdapter();

// Auto-register PWA service worker immediately for background notifications and offline capabilities
registerSW({ immediate: true });

createRoot(document.getElementById('root')!).render(<App />);

