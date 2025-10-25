import ReactDOM, {createRoot} from "react-dom/client";
import PDFSettingPage from "./pdf.ui";
import {CacheProvider} from '@emotion/react'
import {ConfigProvider as AntConfigProvider} from 'antd'
import muiCache from '../../../emotion-cache'
import '@/i18n';
let root: ReactDOM.Root | null = null;

export function mount(target: HTMLElement | string, props?: any) {
  let container: HTMLElement | null = null;
  
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
  
  // If container belongs to an iframe/shadow root, use that container's ownerDocument for createRoot
  // createRoot accepts an Element; React will operate on the correct document context.
  root = createRoot(container);
  root.render(
    <CacheProvider value={muiCache}>
      <AntConfigProvider>
        <PDFSettingPage {...props} />
      </AntConfigProvider>
    </CacheProvider>
  );
}

export function unmount(_target?: HTMLElement | string) {
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
}