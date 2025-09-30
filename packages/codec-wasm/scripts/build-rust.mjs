#!/usr/bin/env node

import { execSync } from 'child_process';
import { existsSync, mkdirSync, copyFileSync } from 'fs';
import { join, resolve } from 'path';

// Get the project root directory
const projectRoot = resolve(process.cwd());

// Define paths
const rustSrcDir = join(projectRoot, 'src-rust');
const buildDir = join(projectRoot, 'build');

console.log('Building Rust WASM module...');

try {
  // Check if Rust and wasm-pack are installed
  try {
    execSync('rustc --version', { stdio: 'pipe' });
    console.log('✓ Rust is installed');
  } catch (error) {
    console.error('✗ Rust is not installed. Please install Rust from https://www.rust-lang.org/');
    process.exit(1);
  }

  try {
    execSync('wasm-pack --version', { stdio: 'pipe' });
    console.log('✓ wasm-pack is installed');
  } catch (error) {
    console.log('Installing wasm-pack...');
    execSync('cargo install wasm-pack', { stdio: 'inherit' });
  }

  // Create build directory if it doesn't exist
  if (!existsSync(buildDir)) {
    mkdirSync(buildDir, { recursive: true });
  }

  // Build the Rust WASM module
  console.log('Compiling Rust code to WASM...');
  execSync(`wasm-pack build ${rustSrcDir} --target web --out-dir ${buildDir}`, { 
    stdio: 'inherit',
    cwd: projectRoot
  });

  console.log('✓ Rust WASM build completed successfully!');
  console.log(`✓ WASM file is located at ${join(buildDir, 'codec_wasm_bg.wasm')}`);
  
} catch (error) {
  console.error('✗ Error building Rust WASM module:', error.message);
  process.exit(1);
}