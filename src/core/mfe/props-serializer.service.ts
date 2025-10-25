import {SecurityConfig} from "~/core/mfe/mfe.type";
import {MicroAppError} from "~/core/mfe/mfe.error";

/**
 * PropsSerializer - Sanitize and validate props before passing to micro apps
 * Prevents: Data leaks, XSS via props, DoS via large payloads
 */
export class PropsSerializer {
  constructor(private readonly config: SecurityConfig) {}
  
  sanitize(props: Record<string, unknown>): Record<string, unknown> {
    if (!props || typeof props !== 'object' || Array.isArray(props)) {
      return {};
    }
    
    this.validatePayloadSize(props);
    const sanitized: Record<string, unknown> = {};
    
    for (const [key, value] of Object.entries(props)) {
      if (this.isSensitiveKey(key) && !this.isAllowPropsKey(key)) {
        console.warn(`[MicroAppLoader] Blocked sensitive prop: ${key}`);
        continue;
      }
      
      if (this.isSerializable(value)) {
        sanitized[key] = this.deepClone(value);
      } else {
        console.warn(`[MicroAppLoader] Skipped non-serializable prop: ${key}`);
      }
    }
    
    return Object.freeze(sanitized);
  }
  
  private isSensitiveKey(key: string): boolean {
    const lowerKey = key.toLowerCase();
    return Array.from(this.config.sensitiveKeys).some(
      sensitive => lowerKey.includes(sensitive.toLowerCase())
    );
  }
  
  private isAllowPropsKey(key: string): boolean {
    const lowerKey = key.toLowerCase();
    return Array.from(this.config.allowPropsKeys).some(
      sensitive => lowerKey.includes(sensitive.toLowerCase())
    );
  }
  
  private validatePayloadSize(props: Record<string, unknown>): void {
    try {
      const serialized = JSON.stringify(props);
      if (serialized.length > this.config.maxPayloadSize) {
        throw new MicroAppError(
          `Props payload exceeds maximum size: ${this.config.maxPayloadSize} bytes`,
          'PAYLOAD_TOO_LARGE',
        );
      }
    } catch (error) {
      if (error instanceof MicroAppError) {
        throw error;
      }
      throw new MicroAppError('Props contain non-serializable values', 'INVALID_PROPS');
    }
  }
  
  private isSerializable(value: unknown): boolean {
    if (value === null || value === undefined) {
      return true;
    }
    
    const type = typeof value;
    if (type === 'string' || type === 'number' || type === 'boolean') {
      return true;
    }
    
    if (type === 'object') {
      try {
        JSON.stringify(value);
        return true;
      } catch {
        return false;
      }
    }
    
    if (type === "function") return true;
    
    return false;
  }
  
  private deepClone<T>(value: T): T {
    // Use structuredClone if available (modern browsers)
    if (typeof structuredClone === 'function') {
      try {
        return structuredClone(value);
      } catch(e) {
        // TODO Fallback to JSON for unsupported types => need to enhancement 
        return value;
      }
    }
    
    return JSON.parse(JSON.stringify(value));
  }
}
