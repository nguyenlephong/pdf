// src/mfe-entry.js
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

let root = null;

export function bootstrap() {
  console.log('React MFE bootstrap');
}

export function mount(container) {
  console.log('React MFE mount');
  root = ReactDOM.createRoot(container);
  root.render(<App />);
}

export function unmount() {
  console.log('React MFE unmount');
  root?.unmount();
}