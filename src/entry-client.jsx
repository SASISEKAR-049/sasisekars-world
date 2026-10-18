import { createRoot, hydrateRoot } from 'react-dom/client';
import { flushSync } from 'react-dom';
import App from './App.jsx';
import { startMotion } from './motion/index.js';
import './index.css';

const root = document.getElementById('root');

// The motion layer mutates the DOM (SplitType, cloned strips), so the page
// must be fully rendered first and React must never re-render it.
// No StrictMode: its dev-only double mount would undo those mutations.
if (root.firstElementChild) {
  hydrateRoot(root, <App />, { onRecoverableError: () => {} });
  requestAnimationFrame(startMotion);
} else {
  flushSync(() => createRoot(root).render(<App />));
  startMotion();
}
