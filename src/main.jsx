import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import './styles.css';

// StrictMode is intentionally not used: it double-mounts effects in development, which would build
// (and immediately tear down) the whole WebGL engine twice.
createRoot(document.getElementById('root')).render(<App />);
