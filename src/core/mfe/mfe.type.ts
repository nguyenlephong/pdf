
// ============================================================================
// TYPE DEFINITIONS - Strong typing prevents runtime errors
// ============================================================================

import {MicroAppConfig} from "~/core/mfe/micro-app.config";

export interface LoadedApp {
  readonly appName: string;
  readonly container: HTMLElement;
  readonly shadowRoot?: ShadowRoot;
  readonly iframe?: HTMLIFrameElement;
  readonly config: Readonly<MicroAppConfig>;
  readonly props: Readonly<Record<string, unknown>>;
  readonly cleanup?: () => void;
  readonly mountedAt: number; // for monitoring/debugging
}

export interface SecurityConfig {
  readonly allowedOrigins: ReadonlyArray<string>;
  readonly scriptLoadTimeout: number;
  readonly sensitiveKeys: ReadonlySet<string>;
  readonly allowPropsKeys: ReadonlySet<string>;
  readonly maxPayloadSize: number; // prevent DoS via large props
  readonly enableCSP: boolean;
}

export interface LoadResult {
  readonly success: boolean;
  readonly appName: string;
  readonly error?: Error;
  readonly loadTimeMs?: number;
}