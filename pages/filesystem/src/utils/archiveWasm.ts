/**
 * Archive scanning utilities via WASM (archive-wasm/libarchive).
 *
 * This module provides helper functions for archive operations using WASM.
 * The main scanning logic is in filestorageApi.ts (getArchiveEntriesWithWasm).
 *
 * @deprecated Use getArchiveEntriesWithWasm from filestorageApi instead.
 */
import type { ArchiveEntry, ArchiveScanResponse } from "../api/filestorageApi";

/**
 * Lazy-load archive-wasm only when needed
 */
let archiveWasm: typeof import("archive-wasm") | null = null;

async function loadWasm(): Promise<typeof import("archive-wasm")> {
  if (archiveWasm) return archiveWasm;
  archiveWasm = await import("archive-wasm");
  return archiveWasm;
}

/** Path of the last WASM load attempt to avoid repeated failures. */
let wasmLoadFailed = false;

/**
 * Check if the browser environment supports WASM.
 */
export function supportsWasm(): boolean {
  return typeof WebAssembly !== "undefined";
}

/**
 * Check if a file is a supported archive format.
 */
export function isArchive(fileName: string): boolean {
  const ext = fileName.toLowerCase().split(".").pop() || "";
  const archiveExts = [
    "zip", "rar", "tar", "gz", "tgz", "tar.gz",
    "bz2", "tbz2", "tar.bz2", "xz", "txz", "tar.xz",
    "7z", "zst", "tzst", "tar.zst", "lz4", "tar.lz4",
    "lzma", "tar.lzma", "jar", "war", "ear", "apk", "ipa",
  ];
  return archiveExts.includes(ext);
}

/**
 * Scan an archive using WASM (libarchive) - used as a fallback or for direct
 * browser-based scanning without server involvement.
 *
 * @param data  Raw archive bytes (ArrayBuffer)
 * @param format File extension (e.g. "zip", "tar.gz")
 * @param fileName Full file name (for empty archive response)
 * @returns Archive structure or null if WASM scanning failed
 */
export async function scanArchiveWasm(
  data: ArrayBuffer,
  format: string,
  fileName: string,
): Promise<ArchiveScanResponse | null> {
  if (!supportsWasm() || wasmLoadFailed) return null;

  try {
    const mod = await loadWasm();
    const uint8 = new Uint8Array(data);

    const entries = mod.extractAll(uint8, {
      recursive: false,
      normalize: true,
      ignoreDotDir: true,
      sizeLimit: 128n * 1024n * 1024n, // 128MB limit
    });

    if (!entries || entries.length === 0) {
      return {
        name: fileName,
        extension: format.toLowerCase(),
        archiveSize: data.byteLength,
        fileCount: 0,
        dirCount: 0,
        totalSize: 0,
        compressRate: 0,
        entries: [],
      };
    }

    // Convert entries to our format
    const archiveEntries: ArchiveEntry[] = [];
    for (const entry of entries) {
      const path = entry.path ?? "";
      if (!path || path === ".") continue;

      const isDir = entry.type === "DIR";
      const name = path.split("/").pop() || path;
      const size = entry.size ? Number(entry.size) : 0;

      let modified = 0;
      if (entry.mtime && typeof entry.mtime === "bigint" && entry.mtime > 0n) {
        modified = Number(entry.mtime / 1000000n);
      }

      archiveEntries.push({
        path,
        name,
        directory: isDir,
        size: isDir ? 0 : size,
        compressedSize: -1,
        modified,
      });
    }

    // Fill implicit directories
    const allEntries = fillImplicitDirs(archiveEntries);

    const fileEntries = allEntries.filter((e) => !e.directory);
    const dirEntries = allEntries.filter((e) => e.directory);
    const totalSize = fileEntries.reduce((sum, e) => sum + e.size, 0);

    const compressRate =
      totalSize > 0 ? Math.round((data.byteLength * 100) / totalSize) : 0;

    return {
      name: fileName,
      extension: format.toLowerCase(),
      archiveSize: data.byteLength,
      fileCount: fileEntries.length,
      dirCount: dirEntries.length,
      totalSize,
      compressRate,
      entries: allEntries.sort((a, b) => {
        if (a.directory !== b.directory) {
          return a.directory ? -1 : 1;
        }
        return a.name.localeCompare(b.name, "zh-Hans-CN");
      }),
    };
  } catch (e) {
    console.debug("[archive-wasm] Scanning failed:", e);
    wasmLoadFailed = true;
    return null;
  }
}

/**
 * Extract a specific entry from an archive using WASM.
 *
 * @param data Archive bytes
 * @param entryPath Path of the entry to extract
 * @returns Entry content as ArrayBuffer, or null if failed
 */
export async function extractEntryWasm(
  data: ArrayBuffer,
  entryPath: string,
): Promise<ArrayBuffer | null> {
  if (!supportsWasm() || wasmLoadFailed) return null;

  try {
    const mod = await loadWasm();
    const uint8 = new Uint8Array(data);

    const entries = mod.extractAll(uint8, {
      recursive: false,
      normalize: true,
      ignoreDotDir: true,
    });

    for (const entry of entries) {
      if (entry.path === entryPath && entry.type === "FILE") {
        const entryData = entry.data;
        if (entryData && entryData.byteLength > 0) {
          return entryData;
        }
      }
    }

    return null;
  } catch (e) {
    console.debug("[archive-wasm] Extraction failed:", e);
    return null;
  }
}

/**
 * Fill implicit directories (directories not explicitly listed in the archive).
 */
function fillImplicitDirs(entries: ArchiveEntry[]): ArchiveEntry[] {
  const byPath = new Map<string, ArchiveEntry>();

  for (const entry of entries) {
    byPath.set(entry.path, entry);
  }

  // Add implicit directories from file paths
  for (const entry of Array.from(byPath.values())) {
    if (entry.directory) continue;

    const parts = entry.path.split("/");
    for (let i = 0; i < parts.length - 1; i++) {
      const dirPath = parts.slice(0, i + 1).join("/");
      if (!byPath.has(dirPath)) {
        const dirName = parts[i];
        byPath.set(dirPath, {
          path: dirPath,
          name: dirName,
          directory: true,
          size: 0,
          compressedSize: -1,
          modified: 0,
        });
      }
    }
  }

  return Array.from(byPath.values());
}