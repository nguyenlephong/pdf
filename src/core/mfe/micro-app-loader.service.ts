import {Injectable, OnDestroy, Renderer2, RendererFactory2} from '@angular/core';
import {DEFAULT_SECURITY_CONFIG, MICRO_APPS, MicroAppConfig} from './micro-app.config';
import {LoadedApp, LoadResult, SecurityConfig} from './mfe.type';
import {MicroAppError} from './mfe.error';
import {URLValidator} from './url-validator.service';
import {AssetLoader} from './asset-loader.service';
import {PropsSerializer} from './props-serializer.service';
import {DOMManager} from './dom-manager.service';

@Injectable({ providedIn: 'root' })
export class MicroAppLoaderService implements OnDestroy {
  private readonly renderer: Renderer2;
  private readonly loadedApps: Map<string, LoadedApp>;
  private readonly securityConfig: SecurityConfig;
  private readonly urlValidator: URLValidator;
  private readonly assetLoader: AssetLoader;
  private readonly propsSerializer: PropsSerializer;
  private readonly domManager: DOMManager;
  private isDestroyed = false;
  
  constructor(
    rendererFactory: RendererFactory2,
    // In production, inject SecurityConfig via InjectionToken for environment-specific config
  ) {
    this.renderer = rendererFactory.createRenderer(null, null);
    this.loadedApps = new Map();
    this.securityConfig = DEFAULT_SECURITY_CONFIG;
    
    // Composition over inheritance - delegate to specialized classes
    this.urlValidator = new URLValidator(this.securityConfig);
    this.assetLoader = new AssetLoader(this.securityConfig, this.urlValidator);
    this.propsSerializer = new PropsSerializer(this.securityConfig);
    this.domManager = new DOMManager(this.renderer);
  }
  
  // --------------------------------------------------------------------------
  // PUBLIC API - Load micro app with comprehensive validation
  // --------------------------------------------------------------------------
  
  async load(
    appName: string,
    container: HTMLElement,
    props: Record<string, unknown> = {},
  ): Promise<LoadResult> {
    const startTime = performance.now();
    
    try {
      this.assertNotDestroyed();
      this.validateLoadParameters(appName, container);
      
      const config = this.getValidatedConfig(appName);
      const sanitizedProps = this.propsSerializer.sanitize(props);
      
      // Prevent duplicate loads - clean up first
      if (this.loadedApps.has(appName)) {
        await this.unmount(appName);
      }
      
      // Security-critical: validate all URLs before any network request
      this.urlValidator.validateConfig(config);
      
      // Execute load strategy based on config
      if (config.sandbox) {
        await this.loadInSandboxedIframe(appName, container, config, sanitizedProps);
      } else {
        await this.loadInHostContext(appName, container, config, sanitizedProps);
      }
      
      const loadTimeMs = performance.now() - startTime;
      
      return {
        success: true,
        appName,
        loadTimeMs,
      };
      
    } catch (error) {
      const loadTimeMs = performance.now() - startTime;
      const wrappedError = error instanceof MicroAppError
        ? error
        : new MicroAppError(`Failed to load ${appName}: ${(error as Error).message}`, 'LOAD_FAILED');
      
      this.handleLoadError(appName, wrappedError);
      
      return {
        success: false,
        appName,
        error: wrappedError,
        loadTimeMs,
      };
    }
  }
  
  // --------------------------------------------------------------------------
  // UNMOUNT - Graceful cleanup with error isolation
  // --------------------------------------------------------------------------
  
  async unmount(appName: string): Promise<void> {
    const loaded = this.loadedApps.get(appName);
    if (!loaded) {
      return;
    }
    
    try {
      if (loaded.iframe) {
        await this.unmountIframeApp(loaded);
      } else {
        await this.unmountHostApp(loaded);
      }
    } catch (error) {
      // Log but don't throw - cleanup should be resilient
      console.error(`[MicroAppLoader] Error during unmount of ${appName}:`, error);
    } finally {
      this.loadedApps.delete(appName);
    }
  }
  
  async unloadAll(): Promise<void> {
    const unmountPromises = Array.from(this.loadedApps.keys())
      .map(name => this.unmount(name));
    
    await Promise.allSettled(unmountPromises);
    this.loadedApps.clear();
  }
  
  ngOnDestroy(): void {
    this.isDestroyed = true;
    void this.unloadAll();
  }
  
  // --------------------------------------------------------------------------
  // OBSERVABILITY - Read-only state access
  // --------------------------------------------------------------------------
  
  isAppLoaded(appName: string): boolean {
    return this.loadedApps.has(appName);
  }
  
  getLoadedApps(): ReadonlyArray<string> {
    return Array.from(this.loadedApps.keys());
  }
  
  getAppMetadata(appName: string): Readonly<Pick<LoadedApp, 'mountedAt' | 'config'>> | null {
    const app = this.loadedApps.get(appName);
    return app ? {mountedAt: app.mountedAt, config: app.config} : null;
  }
  
  // --------------------------------------------------------------------------
  // PRIVATE - Load strategies
  // --------------------------------------------------------------------------
  
  private async loadInHostContext(
    appName: string,
    container: HTMLElement,
    config: Readonly<MicroAppConfig>,
    props: Record<string, unknown>,
  ): Promise<void> {
    this.domManager.clearContainer(container);
    
    let targetContainer: HTMLElement;
    let shadowRoot: ShadowRoot | undefined;
    
    if (config.shadow) {
      const shadowResult = this.domManager.createShadowRoot(container, appName, config);
      targetContainer = shadowResult.hostElement;
      shadowRoot = shadowResult.shadowRoot;
      
      // Load CSS into shadow DOM
      await this.assetLoader.loadCSSIntoShadow(shadowRoot, config);
    } else {
      targetContainer = container;
      // Load CSS into document head (idempotent)
      await this.assetLoader.loadCSSIntoDocument(document, config);
    }
    
    // Load JS assets sequentially
    await this.assetLoader.loadJavaScript(document, config);
    
    // Register before mount to ensure cleanup works
    this.loadedApps.set(appName, {
      appName,
      container: targetContainer,
      shadowRoot,
      config,
      props,
      mountedAt: Date.now(),
    });
    
    // Mount the application
    await this.mountHostApp(appName, targetContainer, props);
  }
  
  private async loadInSandboxedIframe(
    appName: string,
    container: HTMLElement,
    config: Readonly<MicroAppConfig>,
    props: Record<string, unknown>,
  ): Promise<void> {
    this.domManager.clearContainer(container);
    
    const iframe = this.domManager.createSecureIframe(config);
    this.renderer.appendChild(container, iframe);
    
    await this.waitForIframeReady(iframe);
    
    const doc = this.getIframeDocument(iframe);
    const mountEl = this.domManager.createIframeMountPoint(doc, appName);
    
    await this.assetLoader.loadCSSIntoDocument(doc, config);
    await this.assetLoader.loadJavaScript(doc, config);
    
    await this.mountIframeApp(iframe, appName, mountEl, config, props);
    
    this.loadedApps.set(appName, {
      appName,
      iframe,
      container,
      config,
      props,
      mountedAt: Date.now(),
    });
  }
  
  private waitForIframeReady(iframe: HTMLIFrameElement): Promise<void> {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        cleanup();
        reject(new MicroAppError('Iframe ready timeout', 'IFRAME_TIMEOUT'));
      }, 5000);
      
      const cleanup = () => {
        iframe.removeEventListener('load', onLoad);
        clearTimeout(timeout);
      };
      
      const onLoad = () => {
        cleanup();
        // Additional check to ensure document is accessible
        try {
          if (iframe.contentDocument) {
            resolve();
          } else {
            reject(new MicroAppError('Iframe document not accessible after load', 'IFRAME_NO_DOCUMENT'));
          }
        } catch (error) {
          reject(new MicroAppError('Iframe access denied', 'IFRAME_ACCESS_DENIED'));
        }
      };
      
      // Check if already loaded
      if (iframe.contentDocument && iframe.contentDocument.readyState === 'complete') {
        cleanup();
        resolve();
        return;
      }
      
      iframe.addEventListener('load', onLoad);
    });
  }
  
  // --------------------------------------------------------------------------
  // PRIVATE - Mount/Unmount operations
  // --------------------------------------------------------------------------
  
  private async mountHostApp(
    appName: string,
    container: HTMLElement,
    props: Record<string, unknown>,
  ): Promise<void> {
    const loaded = this.loadedApps.get(appName);
    if (!loaded) {
      throw new MicroAppError(`App ${appName} not in loaded state`, 'INVALID_STATE');
    }
    
    const { config } = loaded;
    const globalApp = this.getGlobalApp(window, config, appName);
    const mountFn = this.getMountFunction(globalApp, config);
    
    try {
      await mountFn(container, props);
      
      // Register cleanup
      const unmountFn = this.getUnmountFunction(globalApp, config);
      const cleanup = () => {
        try {
          unmountFn(container);
        } catch (error) {
          console.warn(`[MicroAppLoader] Cleanup failed for ${appName}:`, error);
        }
      };
      
      // Update loaded app with cleanup function
      this.loadedApps.set(appName, {...loaded, cleanup});
      
    } catch (error) {
      throw new MicroAppError(
        `Mount failed for ${appName}: ${(error as Error).message}`,
        'MOUNT_FAILED',
      );
    }
  }
  
  private async mountIframeApp(
    iframe: HTMLIFrameElement,
    appName: string,
    mountEl: HTMLElement,
    config: Readonly<MicroAppConfig>,
    props: Record<string, unknown>,
  ): Promise<void> {
    const win = this.getIframeWindow(iframe);
    const globalApp = this.getGlobalApp(win, config, appName);
    const mountFn = this.getMountFunction(globalApp, config);
    
    try {
      await mountFn(mountEl, props);
    } catch (error) {
      throw new MicroAppError(
        `Iframe mount failed for ${appName}: ${(error as Error).message}`,
        'IFRAME_MOUNT_FAILED',
      );
    }
  }
  
  private async unmountHostApp(loaded: LoadedApp): Promise<void> {
    if (loaded.cleanup) {
      await loaded.cleanup();
    }
    
    if (loaded.shadowRoot) {
      this.domManager.destroyShadowRoot(loaded.shadowRoot);
    } else {
      this.domManager.clearContainer(loaded.container);
    }
  }
  
  private async unmountIframeApp(loaded: LoadedApp): Promise<void> {
    if (!loaded.iframe) {
      return;
    }
    
    try {
      const win = this.getIframeWindow(loaded.iframe);
      const globalApp = this.getGlobalApp(win, loaded.config, loaded.appName);
      const unmountFn = this.getUnmountFunction(globalApp, loaded.config);
      
      const doc = this.getIframeDocument(loaded.iframe);
      const mountEl = doc.getElementById(`${loaded.appName}-mount`);
      
      if (mountEl) {
        await unmountFn(mountEl);
      }
    } catch (error) {
      console.warn(`[MicroAppLoader] Iframe unmount error:`, error);
    } finally {
      this.renderer.removeChild(loaded.container, loaded.iframe);
    }
  }
  
  // --------------------------------------------------------------------------
  // PRIVATE - Validation & helpers
  // --------------------------------------------------------------------------
  
  private assertNotDestroyed(): void {
    if (this.isDestroyed) {
      throw new MicroAppError('Service has been destroyed', 'SERVICE_DESTROYED');
    }
  }
  
  private validateLoadParameters(appName: string, container: HTMLElement): void {
    if (!appName || typeof appName !== 'string') {
      throw new MicroAppError('Invalid appName parameter', 'INVALID_PARAMETER');
    }
    
    if (!container || !(container instanceof HTMLElement)) {
      throw new MicroAppError('Invalid container parameter', 'INVALID_PARAMETER');
    }
  }
  
  private getValidatedConfig(appName: string): Readonly<MicroAppConfig> {
    const config = MICRO_APPS[appName];
    if (!config) {
      throw new MicroAppError(`No configuration found for app: ${appName}`, 'CONFIG_NOT_FOUND');
    }
    return Object.freeze({...config});
  }
  
  private getGlobalApp(context: Window, config: Readonly<MicroAppConfig>, appName: string): any {
    const globalName = config.globalName ?? appName;
    const globalApp = (context as any)[globalName];
    
    if (!globalApp) {
      throw new MicroAppError(
        `Global app object not found: ${globalName}`,
        'GLOBAL_NOT_FOUND',
      );
    }
    
    return globalApp;
  }
  
  private getMountFunction(globalApp: any, config: Readonly<MicroAppConfig>): Function {
    const mountFnName = config.mountFn ?? 'mount';
    const mountFn = globalApp[mountFnName];
    
    if (typeof mountFn !== 'function') {
      throw new MicroAppError(
        `Mount function not found: ${mountFnName}`,
        'MOUNT_FN_NOT_FOUND',
      );
    }
    
    return mountFn.bind(globalApp);
  }
  
  private getUnmountFunction(globalApp: any, config: Readonly<MicroAppConfig>): Function {
    const unmountFnName = config.unmountFn ?? 'unmount';
    const unmountFn = globalApp[unmountFnName];
    
    if (typeof unmountFn !== 'function') {
      // Fallback to noop if unmount not provided
      return () => {
      };
    }
    
    return unmountFn.bind(globalApp);
  }
  
  private getIframeDocument(iframe: HTMLIFrameElement): Document {
    try {
      const doc = iframe.contentDocument;
      if (!doc) {
        throw new MicroAppError(
          'Iframe document not accessible. This may be due to sandbox restrictions or cross-origin policies.',
          'IFRAME_NO_DOCUMENT'
        );
      }
      return doc;
    } catch (error) {
      if (error instanceof MicroAppError) {
        throw error;
      }
      throw new MicroAppError(
        `Cannot access iframe document: ${(error as Error).message}`,
        'IFRAME_ACCESS_ERROR'
      );
    }
  }
  
  private getIframeWindow(iframe: HTMLIFrameElement): Window {
    const win = iframe.contentWindow;
    if (!win) {
      throw new MicroAppError('Iframe window not accessible', 'IFRAME_NO_WINDOW');
    }
    return win;
  }
  
  private handleLoadError(appName: string, error: Error): void {
    // Clean up partial state
    this.loadedApps.delete(appName);
    
    // Log for monitoring (integrate with your logging system)
    console.error(`[MicroAppLoader] Load failed for ${appName}:`, {
      error: error.message,
      code: error instanceof MicroAppError ? error.code : 'UNKNOWN',
      stack: error.stack,
    });
  }
}

