import { StrictMode } from 'react';
import { createRoot, hydrateRoot } from 'react-dom/client';
import App from './App.jsx';
import './index.css';

const root = document.getElementById('root');
const app = <StrictMode><App /></StrictMode>;

// Production: the page was pre-rendered at build time, so React hydrates it.
// Development: index.html only has a placeholder, so React renders from scratch.
if (root.firstElementChild) hydrateRoot(root, app);
else createRoot(root).render(app);
