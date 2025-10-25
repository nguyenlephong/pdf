import {SecurityConfig} from "~/core/mfe/mfe.type";
import {URLValidator} from "~/core/mfe/url-validator.service";
import {MicroAppConfig} from "~/core/mfe/micro-app.config";
import {AssetLoadError} from "~/core/mfe/mfe.error";

/**
 * AssetLoader - Secure asset loading with SRI verification
 * Prevents: Code injection, tampering, MITM attacks
 */
export class AssetLoader {
  constructor(
    private readonly config: SecurityConfig,
    private readonly urlValidator: URLValidator,
  ) {}
  
  async loadJavaScript(doc: Document, appConfig: Readonly<MicroAppConfig>): Promise<void> {
    const scripts = Array.isArray(appConfig.url) ? appConfig.url : [appConfig.url];
    
    // Sequential loading to maintain execution order
    for (const src of scripts) {
      const validatedUrl = this.urlValidator.validateUrl(src);
      
      if (this.isScriptAlreadyLoaded(doc, validatedUrl.href)) {
        continue;
      }
      
      await this.loadScript(doc, validatedUrl.href, appConfig);
    }
  }
  
  async loadCSSIntoDocument(doc: Document, appConfig: Readonly<MicroAppConfig>): Promise<void> {
    const stylesheets = appConfig.css ?? [];
    
    for (const href of stylesheets) {
      const validatedUrl = this.urlValidator.validateUrl(href);
      
      if (this.isStylesheetAlreadyLoaded(doc, validatedUrl.href)) {
        continue;
      }
      
      this.loadStylesheet(doc.head, validatedUrl.href, appConfig);
    }
  }
  
  async loadCSSIntoShadow(shadow: ShadowRoot, appConfig: Readonly<MicroAppConfig>): Promise<void> {
    const stylesheets = appConfig.css ?? [];
    
    for (const href of stylesheets) {
      const validatedUrl = this.urlValidator.validateUrl(href);
      this.loadStylesheet(shadow, validatedUrl.href, appConfig);
    }
  }
  
  private async loadScript(doc: Document, src: string, appConfig: Readonly<MicroAppConfig>): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      const script = doc.createElement('script');
      script.src = src;
      script.async = false; // Maintain order
      script.type = 'text/javascript';
      
      // Apply SRI if configured
      const integrity = this.getSRIHash(appConfig, src);
      if (integrity) {
        script.integrity = integrity;
        script.crossOrigin = 'anonymous';
      }
      
      let settled = false;
      const timeoutHandle = setTimeout(() => {
        if (!settled) {
          settled = true;
          cleanup();
          reject(new AssetLoadError(`Script load timeout: ${src}`, src));
        }
      }, this.config.scriptLoadTimeout);
      
      const cleanup = () => {
        script.removeEventListener('load', onLoad);
        script.removeEventListener('error', onError);
        clearTimeout(timeoutHandle);
      };
      
      const onLoad = () => {
        if (!settled) {
          settled = true;
          cleanup();
          resolve();
        }
      };
      
      const onError = () => {
        if (!settled) {
          settled = true;
          cleanup();
          reject(new AssetLoadError(`Script load failed: ${src}`, src));
        }
      };
      
      script.addEventListener('load', onLoad);
      script.addEventListener('error', onError);
      
      doc.body.appendChild(script);
    });
  }
  
  private loadStylesheet(target: HTMLHeadElement | ShadowRoot, href: string, appConfig: Readonly<MicroAppConfig>): void {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = href;
    
    const integrity = this.getSRIHash(appConfig, href);
    if (integrity) {
      link.integrity = integrity;
      link.crossOrigin = 'anonymous';
    }
    
    target.appendChild(link);
  }
  
  private isScriptAlreadyLoaded(doc: Document, src: string): boolean {
    return !!doc.querySelector(`script[src="${this.escapeSelector(src)}"]`);
  }
  
  private isStylesheetAlreadyLoaded(doc: Document, href: string): boolean {
    return !!doc.querySelector(`link[rel="stylesheet"][href="${this.escapeSelector(href)}"]`);
  }
  
  private getSRIHash(config: Readonly<MicroAppConfig>, assetUrl: string): string | undefined {
    if (!config.sri) {
      return undefined;
    }
    return (config.sri as Record<string, string>)[assetUrl];
  }
  
  private escapeSelector(str: string): string {
    return str.replace(/["\\]/g, '\\$&');
  }
}