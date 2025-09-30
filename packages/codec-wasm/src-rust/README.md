# Codec WASM - Rust Implementation

This directory contains the Rust implementation of the encryption/decryption algorithms used in the codec-wasm package.

## Features

- SM2 encryption/decryption and key generation
- SM3 hashing
- SM4 encryption/decryption
- AES-compatible encryption/decryption
- MD5 hashing
- Utility functions for nonce generation and timestamp retrieval
- Implementation of uu2, uu1, uu3, uu4 functions matching the original TypeScript source

## Prerequisites

- Rust toolchain (install from https://www.rust-lang.org/)
- wasm-pack (install with `cargo install wasm-pack`)

## Building

To build the Rust WASM module:

```bash
npm run build:rust
```

This will:
1. Compile the Rust code to WebAssembly using wasm-pack
2. Generate the necessary JavaScript bindings
3. Copy the WASM file to the build directory

## Project Structure

- `Cargo.toml` - Rust package configuration
- `src-rust/lib.rs` - Main Rust implementation
- `scripts/build-rust.mjs` - Build script
- `build/pkg/` - Generated WASM and JavaScript bindings (after build)

## Usage

The Rust implementation provides the same interface as the original AssemblyScript implementation, so it can be used as a drop-in replacement.

## Algorithms

### SM2
- `sm2_encrypt(data, public_key)` - Encrypt data with SM2 public key
- `sm2_decrypt(encrypted_data, private_key)` - Decrypt data with SM2 private key
- `sm2_decrypt_with_mode(encrypted_data, private_key, cipher_mode)` - Decrypt data with SM2 and cipher mode
- `sm2_generate_keypair()` - Generate a new SM2 keypair

### SM3
- `sm3_hash(data)` - Generate SM3 hash of data

### SM4
- `sm4_encrypt(data, key)` - Encrypt data with SM4
- `sm4_decrypt(encrypted_data, key)` - Decrypt data with SM4

### AES Functions
- `aes_encrypt(data, key)` - Encrypt data with AES (using SM4 as placeholder)
- `aes_decrypt(encrypted_data, key)` - Decrypt data with AES (using SM4 as placeholder)

### Utility Functions
- `generate_nonce()` - Generate a random nonce
- `md5_hash(input)` - Generate MD5 hash
- `add(a, b)` - Add two numbers
- `get_current_timestamp()` - Get current timestamp

### Specialized Functions (matching original source.ts)
- `uu2(request_data, request_url, config_open, codec_request_key)` - Encrypt request data
- `uu1(response_status, response_data, origin_key, timestamp)` - Decrypt response data
- `uu3(value)` - Decrypt value with default key
- `uu4(response_data, uuid, timestamp)` - Special response decryption
- `process_request(request_data, request_url, codec_config, codec_key)` - Process request
- `process_response(response_data, origin_key, timestamp)` - Process response
- `generate_sign(params_json, timestamp, nonce, secret_key)` - Generate signature

## Dependencies

- `wasm-bindgen` - For generating JavaScript bindings
- `sm2`, `sm3`, `sm4` - Rust implementations of Chinese cryptographic standards
- `getrandom` - For generating random numbers
- `hex` - For hex encoding/decoding
- `md5` - For MD5 hashing
- `serde`, `serde_json` - For JSON serialization/deserialization

## Testing

To run the integration tests:

```bash
cargo test
```

To run the WebAssembly tests:

```bash
wasm-pack test --headless --firefox
```

Or for Chrome:

```bash
wasm-pack test --headless --chrome
```