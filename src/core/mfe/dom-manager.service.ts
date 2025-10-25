import {Renderer2} from "@angular/core";
import {MicroAppConfig} from "~/core/mfe/micro-app.config";

/**
 * DOMManager - Safe DOM manipulation with XSS prevention
 */
export class DOMManager {
  constructor(private readonly renderer: Renderer2) {}
  
  clearContainer(container: HTMLElement): void {
    // Use textContent instead of innerHTML to prevent XSS
    container.textContent = '';
  }
  
  createShadowRoot(container: HTMLElement, appName: string, config: Readonly<MicroAppConfig>): {
    shadowRoot: ShadowRoot;
    hostElement: HTMLElement;
  } {
    this.clearContainer(container);
    
    const shadowRoot = container.attachShadow({ mode: 'open' });
    
    const hostElement = this.renderer.createElement('div') as HTMLElement;
    hostElement.id = config.containerId ?? `${appName}-root`;
    
    // Defensive styles to prevent layout breaks
    this.renderer.setStyle(hostElement, 'width', '100%');
    this.renderer.setStyle(hostElement, 'height', '100%');
    this.renderer.setStyle(hostElement, 'contain', 'content');
    
    this.renderer.appendChild(shadowRoot, hostElement);
    
    // Inject base styles
    this.injectShadowBaseStyles(shadowRoot);
    
    return { shadowRoot, hostElement };
  }
  
  destroyShadowRoot(shadowRoot: ShadowRoot): void {
    // Clear all children safely
    while (shadowRoot.firstChild) {
      shadowRoot.removeChild(shadowRoot.firstChild);
    }
  }
  
  createSecureIframe(config: Readonly<MicroAppConfig>): HTMLIFrameElement {
    const iframe = this.renderer.createElement('iframe') as HTMLIFrameElement;
    
    const sandboxFlags = ['allow-scripts'];
    if (config.allowSameOrigin) {
      sandboxFlags.push('allow-same-origin');
    }
    
    iframe.setAttribute('sandbox', sandboxFlags.join(' '));
    iframe.setAttribute('referrerpolicy', 'no-referrer');
    
    // Remove this line - it can cause document access issues
    // iframe.loading = 'eager';
    
    iframe.setAttribute('allow', '');
    
    this.renderer.setStyle(iframe, 'border', 'none');
    this.renderer.setStyle(iframe, 'width', '100%');
    this.renderer.setStyle(iframe, 'height', '100%');
    
    return iframe;
  }
  
  createIframeMountPoint(doc: Document, appName: string): HTMLElement {
    doc.open();
    doc.write('<!DOCTYPE html><html><head><meta charset="utf-8"></head><body></body></html>');
    doc.close();
    
    const mountEl = doc.createElement('div');
    mountEl.id = `${appName}-mount`;
    mountEl.style.width = '100%';
    mountEl.style.height = '100%';
    
    doc.body.appendChild(mountEl);
    return mountEl;
  }
  
  private injectShadowBaseStyles(shadowRoot: ShadowRoot): void {
    const style = shadowRoot.ownerDocument.createElement('style');
    style.textContent = `
      :host {
        display: block;
        contain: content;
        isolation: isolate;
      }
      *, *::before, *::after {
        box-sizing: border-box;
      }
      :host {
        -webkit-font-smoothing: antialiased;
        -moz-osx-font-smoothing: grayscale;
      }
    `;
    shadowRoot.appendChild(style);
  }
}