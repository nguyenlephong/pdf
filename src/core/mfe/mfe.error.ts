// ============================================================================
// CUSTOM ERRORS - Explicit error hierarchy for debugging
// ============================================================================

export class MicroAppError extends Error {
  constructor(message: string, public readonly code: string) {
    super(message);
    this.name = 'MicroAppError';
    Object.setPrototypeOf(this, MicroAppError.prototype);
  }
}

export class SecurityViolationError extends MicroAppError {
  constructor(message: string, public readonly violation: string) {
    super(message, 'SECURITY_VIOLATION');
    this.name = 'SecurityViolationError';
    Object.setPrototypeOf(this, SecurityViolationError.prototype);
  }
}

export class AssetLoadError extends MicroAppError {
  constructor(message: string, public readonly assetUrl: string) {
    super(message, 'ASSET_LOAD_FAILED');
    this.name = 'AssetLoadError';
    Object.setPrototypeOf(this, AssetLoadError.prototype);
  }
}
