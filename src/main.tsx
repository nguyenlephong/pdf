import { StrictMode } from 'react'
import ReactDOM, { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'

let root: ReactDOM.Root | null = null;

export function mount(containerId: string = 'root') {
  const container = document.getElementById(containerId);
  if (!container) throw new Error(`Container #${containerId} not found`);
  root = createRoot(container);
  root.render(<StrictMode><App /></StrictMode>);
}

export function unmount() {
  if (root) {
    root.unmount();
    root = null;
  }
}

