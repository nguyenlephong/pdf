import { StrictMode } from 'react'
import ReactDOM, { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'

let root: ReactDOM.Root | null = null;

export function mount(containerId: string = 'root', props?: any) {
  const container = document.getElementById(containerId);
  if (!container) throw new Error(`Container #${containerId} not found`);
  root = createRoot(container);
  // @ts-ignore
  root.render(<StrictMode><App {...props} /></StrictMode>);
}

export function unmount() {
  if (root) {
    root.unmount();
    root = null;
  }
}

