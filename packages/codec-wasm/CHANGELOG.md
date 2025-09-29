# Changelog

## [1.0.0] - 2025-09-29

### Added
- Initial release of codec-wasm module
- WebAssembly implementation of codec utilities for encryption/decryption
- Implementation of SM2, SM4, and AES encryption/decryption algorithms
- Object parameter passing to WASM using function wrappers
- JavaScript layer acting as pure proxy without business logic
- All business logic implemented in AssemblyScript WASM module

### Changed
- Modified JavaScript wrapper to ensure it only acts as a proxy
- Updated TypeScript declarations to match the new API
- Improved WASM module loading mechanism
- Enhanced error handling and logging

### Fixed
- Resolved issues with Node.js compatibility by designing for browser environment
- Fixed object parameter passing by using function wrappers instead of JSON serialization
- Addressed WASM module loading issues in browser environments

## Key Implementation Details

### Object Parameter Passing

Instead of serializing objects to JSON strings, we pass objects as functions to WASM:

```javascript
// Before (serialized JSON)
const requestData = JSON.stringify(request);

// After (function wrapper)
const requestFunc = (key) => {
  switch (key) {
    case 'data': return request.data;
    case 'url': return request.url;
    default: return '';
  }
};
```

### Pure Proxy JavaScript Layer

The JavaScript layer acts only as a proxy, forwarding function calls to the WASM module:

```javascript
// JavaScript wrapper (pure proxy)
export function uu2_wasm(requestFunc, getConfig) {
  ensureWasmLoaded();
  return wasmModule.uu2_wasm(requestFunc, getConfig);
}
```

### Business Logic in WASM

All business logic is implemented in the AssemblyScript code:

```typescript
// AssemblyScript (business logic)
export function uu2_wasm(requestFunc: (key: string) => string, getConfig: (key: string) => string): string {
  // All encryption logic implemented here
  // ...
}
```