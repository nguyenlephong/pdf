import React from 'react'
import ReactDOM, {createRoot, type Root} from "react-dom/client";
import PDFSettingPage from "./pdf.ui";
import createCache from '@emotion/cache';
import {CacheProvider} from '@emotion/react'
import '@/i18n';
import pdfStyles from '@/modules/docs-setting/pdf/pdf.style.scss?inline';
import {ShadowPortalProvider} from "@/shared/shadow-portal.provider";

const SHADOW_ID = 'react-shadow-root';
const PORTAL_ID = 'mui-portal-root';
const STYLE_ATTR = 'data-shadow-style';

// WeakMap để track mounted roots
const mountedRoots = new WeakMap<HTMLElement, Root>();
let root: ReactDOM.Root | null = null;

export function mount(target: HTMLElement | string, props?: any) {
  let container: HTMLElement | null = null;
  
  // If inside shadow DOM → attach styles there
  let shadowRoot: any;
  
  if (typeof target === 'string') {
    // try current document first
    container = document.getElementById(target);
    if (!container && (window as any).document) {
      // fallback: if running in iframe, maybe ownerDocument differs; attempt again
      container = (window as any).document.getElementById(target);
    }
  } else if (target instanceof HTMLElement) {
    container = target;
  }
  
  if (!container) {
    throw new Error(`[React MFE] mount: container not found (${target})`);
  }
  
  //@ts-ignore
  shadowRoot = container.getRootNode() as ShadowRoot | Document;
  if(shadowRoot instanceof ShadowRoot){
    const styleEl = document.createElement('style');
    // @ts-ignore
    styleEl.textContent = pdfStyles;
    shadowRoot.appendChild(styleEl);
    
    // ✅ Create a portal container INSIDE the shadow root
    const portalContainer = document.createElement('div');
    portalContainer.id = 'mui-portal-root';
    shadowRoot.appendChild(portalContainer);
    
    
    // Create a shadow container inside shadow root
    // const innerContainer = document.createElement('div');
    // innerContainer.id = 'react-shadow-root';
    shadowRoot.appendChild(container);
    
    renderApp(container, shadowRoot, portalContainer, props);
    return
  }
  
  renderApp(container, shadowRoot, undefined, props);
  return;
}


export function mountShadowBK(target: HTMLElement, props?: any) {
  let container: HTMLElement | null = null;
  
  // If inside shadow DOM → attach styles there
  let shadowRoot: ShadowRoot | undefined;
  
  if (target.shadowRoot) {
    shadowRoot = target.shadowRoot;
  } else {
    shadowRoot = target.attachShadow({mode: 'open'});
    
    // ✅ Inject compiled SCSS content
    const styleEl = document.createElement('style');
    styleEl.textContent = pdfStyles;
    shadowRoot.appendChild(styleEl);
  }
  
  if(shadowRoot instanceof ShadowRoot){
    const styleEl = document.createElement('style');
    // @ts-ignore
    styleEl.textContent = pdfStyles;
    shadowRoot.appendChild(styleEl);
    
    
    // ✅ Create a portal container INSIDE the shadow root
    const portalContainer = document.createElement('div');
    portalContainer.id = 'mui-portal-root';
    shadowRoot.appendChild(portalContainer);
    
    
    // Create a shadow container inside shadow root
    const innerContainer = document.createElement('div');
    innerContainer.id = 'react-shadow-root';
    shadowRoot.appendChild(innerContainer);
    
    renderApp(innerContainer, shadowRoot, portalContainer, props);
    return;
  }
  
  renderApp(container, shadowRoot, undefined, props);
  return;
}


export function mountShadowCheckExist(target: HTMLElement, props?: any) {
  // Nếu đã mount trước đó → reuse hoặc cleanup trước
  if (mountedRoots.has(target)) {
    const root = mountedRoots.get(target);
    if (root) {
      root.render(null);
      mountedRoots.delete(target);
    }
  }
  
  // Lấy hoặc tạo shadow root
  const shadowRoot = target.shadowRoot ?? target.attachShadow({ mode: 'open' });
  
  // Nếu chưa có style → inject style (chỉ 1 lần)
  if (!shadowRoot.querySelector('style[data-shadow-style]')) {
    const styleEl = document.createElement('style');
    styleEl.textContent = pdfStyles;
    styleEl.setAttribute('data-shadow-style', '');
    shadowRoot.appendChild(styleEl);
  }
  
  // Lấy hoặc tạo portal container
  let portalContainer = shadowRoot.querySelector(`#${PORTAL_ID}`) as HTMLElement;
  if (!portalContainer) {
    portalContainer = document.createElement('div');
    portalContainer.id = PORTAL_ID;
    shadowRoot.appendChild(portalContainer);
  }
  
  // Lấy hoặc tạo React container
  let innerContainer = shadowRoot.querySelector(`#${SHADOW_ID}`) as HTMLElement;
  if (!innerContainer) {
    innerContainer = document.createElement('div');
    innerContainer.id = SHADOW_ID;
    shadowRoot.appendChild(innerContainer);
  }
  
  // Mount React app
  const root = createRoot(innerContainer);
  mountedRoots.set(target, root);
  
  root.render(renderApp(innerContainer, shadowRoot, portalContainer, props));
  
  // Return cleanup function
  return () => {
    const root = mountedRoots.get(target);
    if (root) {
      root.unmount();
      mountedRoots.delete(target);
    }
  };
}

export function mountShadow(target: HTMLElement, props?: any) {
  // Cleanup existing root nếu có
  const existingRoot = mountedRoots.get(target);
  if (existingRoot) {
    existingRoot.unmount();
    mountedRoots.delete(target);
  }
  
  // Lấy hoặc khởi tạo shadow root
  let shadowRoot = target.shadowRoot;
  if (!shadowRoot) {
    shadowRoot = target.attachShadow({ mode: 'open' });
  }
  
  // Inject styles nếu chưa có
  if (!shadowRoot.querySelector(`style[${STYLE_ATTR}]`)) {
    const styleEl = document.createElement('style');
    styleEl.setAttribute(STYLE_ATTR, '');
    styleEl.textContent = pdfStyles;
    shadowRoot.appendChild(styleEl);
  }
  
  // Tái sử dụng hoặc tạo mới portal container
  let portalContainer = shadowRoot.querySelector(`#${PORTAL_ID}`) as HTMLElement;
  if (!portalContainer) {
    portalContainer = document.createElement('div');
    portalContainer.id = PORTAL_ID;
    shadowRoot.appendChild(portalContainer);
  }
  
  // Tái sử dụng hoặc tạo mới react container  
  let reactContainer = shadowRoot.querySelector(`#${SHADOW_ID}`) as HTMLElement;
  if (!reactContainer) {
    reactContainer = document.createElement('div');
    reactContainer.id = SHADOW_ID;
    shadowRoot.appendChild(reactContainer);
  }
  
  // Mount React app
  const root = createRoot(reactContainer);
  mountedRoots.set(target, root);
  
  const cache = createCache({
    key: 'mui',
    prepend: true,
    container: (shadowRoot instanceof ShadowRoot ? shadowRoot : document?.head) || shadowRoot,
  });
  
  // Render app
  root.render(
    // @ts-ignore
    <React.StrictMode>
      <CacheProvider value={cache}>
        {/*@ts-ignore*/}
        <ShadowPortalProvider value={{portalContainer, shadowRoot}}>
          <PDFSettingPage {...props}/>
        </ShadowPortalProvider>
      </CacheProvider>
    </React.StrictMode>
  );
  
  // Return cleanup function
  return () => {
    const root = mountedRoots.get(target);
    if (root) {
      root.unmount();
      mountedRoots.delete(target);
    }
  };
}

export function unmount(target?: HTMLElement | string) {
  if (!root) {
    // fallback: try to find root via target's ownerDocument if provided
    // but primarily rely on the saved `root`
    return;
  }
  
  try {
    root.unmount();
  } finally {
    root = null;
  }
  
  if (!target) return;
  const rootTarget = (target as any).__reactRoot;
  if (rootTarget) {
    rootTarget.unmount();
    delete (target as any).__reactRoot;
  }
}

function renderApp(container: HTMLElement, shadowRoot?: ShadowRoot | Document, portalContainer?: HTMLElement, props?: any) {
  const cache = createCache({
    key: 'mui',
    prepend: true,
    container: (shadowRoot instanceof ShadowRoot ? shadowRoot : document?.head) || shadowRoot,
  });
  
  const root = createRoot(container);
  (container as any).__reactRoot = root;
  
  root.render(
    // @ts-ignore
    <React.StrictMode>
      <CacheProvider value={cache}>
        {/*@ts-ignore*/}
        <ShadowPortalProvider value={{portalContainer, shadowRoot}}>
          <PDFSettingPage {...props}/>
        </ShadowPortalProvider>
      </CacheProvider>
    </React.StrictMode>
  );
}