import React from 'react';
import {createRoot} from 'react-dom/client';
import {RouterProvider} from 'react-router';
import {router} from './routes/routes';
import createCache from '@emotion/cache';
import {CacheProvider} from '@emotion/react';
import './index.css';
import '@/i18n';
import pdfStyles from '@/modules/docs-setting/pdf/pdf.style.scss?inline';
import {ShadowPortalProvider} from "@/shared/shadow-portal.provider";


export * from './modules/docs-setting/pdf/loader';

function renderApp(container: HTMLElement, shadowRoot?: ShadowRoot, portalContainer?: any, props?: any) {
  const cache = createCache({
    key: 'mui',
    prepend: true,
    container: shadowRoot instanceof ShadowRoot ? shadowRoot : document.head,
  });
  
  const root = createRoot(container);
  (container as any).__reactRoot = root;
  
  root.render(
    <React.StrictMode>
      <CacheProvider value={cache}>
        {/* @ts-ignore */}
        <ShadowPortalProvider value={{portalContainer: portalContainer, shadowRoot}}>
          <RouterProvider router={router} {...props} />
        </ShadowPortalProvider>
      </CacheProvider>
    </React.StrictMode>
  );
}

// replace: link.href = new URL('/index.css').toString();

const cssUrl = (() => {
  try {
    // preferred: resolve relative to this module (works with Vite)
    return new URL('./index.css', import.meta.url).href;
  } catch {
    // fallback: use BASE_URL if available, else root-relative path
    const base = (import.meta as any)?.env?.BASE_URL ?? '/';
    return `${base.replace(/\/$/, '')}/index.css`;
  }
})();

export function mount(target: HTMLElement, props?: any) {
  // ✅ Create a shadow root automatically if the container doesn't already have one
  let shadowRoot: ShadowRoot | undefined;
  
  if (target.shadowRoot) {
    shadowRoot = target.shadowRoot;
  } else {
    shadowRoot = target.attachShadow({mode: 'open'});
    
    // ✅ Inject compiled SCSS content
    const styleEl = document.createElement('style');
    styleEl.textContent = pdfStyles;
    shadowRoot.appendChild(styleEl);
    
    
    // Inject CSS bundle dynamically into shadow root (from vite build)
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = cssUrl;
    shadowRoot.appendChild(link);
  }
  
  // ✅ Create a portal container INSIDE the shadow root
  const portalContainer = document.createElement('div');
  portalContainer.id = 'mui-portal-root';
  shadowRoot.appendChild(portalContainer);
  
  
  // Create a shadow container inside shadow root
  const innerContainer = document.createElement('div');
  innerContainer.id = 'react-shadow-root';
  shadowRoot.appendChild(innerContainer);
  
  renderApp(innerContainer, shadowRoot, portalContainer, props);
}

export function unmount(target?: HTMLElement) {
  if (!target) return;
  const root = (target as any).__reactRoot;
  if (root) {
    root.unmount();
    delete (target as any).__reactRoot;
  }
}

// ---- Auto detect if running standalone (Vite dev) ----
const defaultContainer = document.getElementById('root');
if (defaultContainer) {
  console.log('🌈 Running in standalone dev mode — using Shadow DOM');
  mount(defaultContainer);
}