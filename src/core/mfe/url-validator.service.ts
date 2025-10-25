import {SecurityConfig} from "~/core/mfe/mfe.type";
import {SecurityViolationError} from "~/core/mfe/mfe.error";
import {MicroAppConfig} from "~/core/mfe/micro-app.config";

/**
 * URLValidator - Centralized URL validation logic
 * Prevents: SSRF, XSS via script injection, mixed content
 */
export class URLValidator {
  private readonly allowedOrigins: ReadonlySet<string>;
  
  constructor(private readonly config: SecurityConfig) {
    this.allowedOrigins = new Set(this.config.allowedOrigins);
  }
  
  validateUrl(rawUrl: string): URL {
    let url: URL;
    
    try {
      url = new URL(rawUrl, location.origin);
    } catch {
      throw new SecurityViolationError(
        `Invalid URL format: ${rawUrl}`,
        'INVALID_URL',
      );
    }
    
    // Enforce HTTPS in production (allow http://localhost in dev)
    if (url.protocol !== 'https:' && !this.isLocalDevelopment(url)) {
      throw new SecurityViolationError(
        `Non-HTTPS URL not allowed: ${rawUrl}`,
        'INSECURE_PROTOCOL',
      );
    }
    
    // Check against whitelist
    if (!this.isOriginAllowed(url.origin)) {
      throw new SecurityViolationError(
        `Origin not in allowlist: ${url.origin}`,
        'UNTRUSTED_ORIGIN',
      );
    }
    
    return url;
  }
  
  validateConfig(config: Readonly<MicroAppConfig>): void {
    const urls = this.extractUrlsFromConfig(config);
    
    for (const url of urls) {
      this.validateUrl(url);
    }
  }
  
  private extractUrlsFromConfig(config: Readonly<MicroAppConfig>): string[] {
    const scriptUrls = Array.isArray(config.url) ? config.url : [config.url];
    const cssUrls = config.css ?? [];
    return [...scriptUrls, ...cssUrls].filter(Boolean);
  }
  
  private isOriginAllowed(origin: string): boolean {
    return this.allowedOrigins.has(origin);
  }
  
  private isLocalDevelopment(url: URL): boolean {
    // Allow localhost and 127.0.0.1 in development
    return url.hostname === 'localhost' || url.hostname === '127.0.0.1';
  }
}
