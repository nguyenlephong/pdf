import {SecurityConfig} from "~/core/mfe/mfe.type";

export interface MicroAppConfig {
  name: string;
  containerId: string;
  url: string | string[];
  css?: string[];
  sandbox?: boolean;       // sandbox bằng iframe
  shadow?: boolean;        // dùng Shadow DOM
  allowSameOrigin?: boolean;
  sri?: Record<string, string>;
  globalName?: string;
  mountFn?: string;
  unmountFn?: string;
}

export const MICRO_APPS: Record<string, MicroAppConfig> = {
  PDFDocsSetting: {
    name: 'PDFDocsSetting',
    containerId: 'mapp-pdf-docs-setting-root',
    url: ['/assets/micro-app/docs-setting/pdf-docs-setting.umd.js'],
    css: ['/assets/micro-app/docs-setting/pdf-docs-setting.css'],
    allowSameOrigin: false, // be careful if you want to enable this
    sandbox: false,
    shadow: false,
    mountFn: 'mount',
    unmountFn: 'unmount',
  },
};

// ============================================================================
// SECURITY CONFIGURATION - Externalized for audit & compliance
// ============================================================================

export const DEFAULT_SECURITY_CONFIG: SecurityConfig = Object.freeze({
  allowedOrigins: Object.freeze([
    'https://bonbonshop.vn',
    'http://localhost:4200',
    // Environment-specific origins should be injected via InjectionToken
  ]),
  scriptLoadTimeout: 15_000,
  sensitiveKeys: Object.freeze(new Set([
    'token',
    'authToken',
    'password',
    'authorization',
    'jwt',
    'apiKey',
    'secret',
    'privateKey',
    'sessionId',
    'refreshToken',
    'accessToken',
  ])),
  allowPropsKeys: Object.freeze(new Set([
    'onChangeSetting', 'onSaveSetting'
  ])),
  maxPayloadSize: 1_048_576, // 1MB JSON stringified
  enableCSP: true,
});