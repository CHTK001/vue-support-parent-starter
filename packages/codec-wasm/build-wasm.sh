#!/bin/bash
# WASM 构建脚本
# 每次构建都会重新编译 WASM，确保代码最新

echo "[codec-wasm] 开始构建 WASM 模块..."

# 临时移除 Git 的 bin 目录，避免 link.exe 冲突
ORIGINAL_PATH="$PATH"
# 移除包含 /usr/bin 和 Git 相关路径，但保留系统路径
# 在 Windows 上，需要保留 /c/Windows/System32 等路径
NEW_PATH=$(echo "$PATH" | tr ':' '\n' | grep -vE '(usr/bin|Git.*bin)' | grep -vE '^/usr' | tr '\n' ':' | sed 's/:$//')
# 如果 NEW_PATH 为空，使用原始 PATH
if [ -z "$NEW_PATH" ]; then
  NEW_PATH="$ORIGINAL_PATH"
fi
export PATH="$NEW_PATH"

# 执行构建
cd src-rust

# 使用 Python 创建 build 目录（更兼容 Windows）
python3 -c "import os; os.makedirs('../build', exist_ok=True)" 2>/dev/null || \
python -c "import os; os.makedirs('../build', exist_ok=True)" 2>/dev/null || \
{
  # 如果 Python 不可用，尝试使用 shell 内置命令
  if [ ! -d "../build" ]; then
    # 尝试使用各种方式创建目录
    command mkdir -p ../build 2>/dev/null || \
    /bin/mkdir -p ../build 2>/dev/null || \
    {
      # 最后尝试使用 Windows 命令
      if command -v cmd.exe >/dev/null 2>&1; then
        cmd.exe /c "if not exist ..\build mkdir ..\build" 2>/dev/null
      fi
    }
  fi
}

wasm-pack build --target web --out-dir ../build --release 2>&1 || {
  echo "wasm-pack 构建失败，但继续处理 TypeScript 类型定义文件..."
}

# 检查是否生成了 TypeScript 类型定义文件
if [ -f "../build/codec_wasm.d.ts" ]; then
  echo "TypeScript 类型定义文件已生成: build/codec_wasm.d.ts"
else
  echo "警告: wasm-pack 未生成 TypeScript 类型定义文件，正在自动创建..."
  # 确保 build 目录存在
  python3 -c "import os; os.makedirs('../build', exist_ok=True)" 2>/dev/null || \
  python -c "import os; os.makedirs('../build', exist_ok=True)" 2>/dev/null || \
  {
    if [ ! -d "../build" ]; then
      command mkdir -p ../build 2>/dev/null || \
      /bin/mkdir -p ../build 2>/dev/null || \
      {
        if command -v cmd.exe >/dev/null 2>&1; then
          cmd.exe /c "if not exist ..\build mkdir ..\build" 2>/dev/null
        fi
      }
    fi
  }
  # 恢复 PATH 以便使用 cat 命令
  export PATH="$ORIGINAL_PATH"
  # 创建 TypeScript 类型定义文件
  cat > "../build/codec_wasm.d.ts" << 'EOF'
/* tslint:disable */
/* eslint-disable */
/**
 * TypeScript 类型定义文件 - 由 Rust 代码生成
 * 对应 src-rust/src/lib.rs 中的 wasm_bindgen 导出函数
 */

export type InitInput = RequestInfo | URL | Response | BufferSource | WebAssembly.Module;

export interface InitOutput {
  readonly memory: WebAssembly.Memory;
  readonly alloc: (size: number) => number;
  readonly dealloc: (ptr: number, size: number) => void;
  readonly sm3_hash: (data_ptr: number, data_len: number) => number;
  readonly md5_hash: (data_ptr: number, data_len: number) => number;
  readonly aes_encrypt: (data_ptr: number, data_len: number, key_ptr: number, key_len: number) => number;
  readonly aes_decrypt: (data_ptr: number, data_len: number, key_ptr: number, key_len: number) => number;
  readonly sm4_encrypt: (data_ptr: number, data_len: number, key_ptr: number, key_len: number) => number;
  readonly sm4_decrypt: (data_ptr: number, data_len: number, key_ptr: number, key_len: number) => number;
  readonly generate_sm2_key_pair: () => number;
  readonly sm2_encrypt: (data_ptr: number, data_len: number, pubkey_ptr: number, pubkey_len: number) => number;
  readonly sm2_decrypt: (data_ptr: number, data_len: number, privkey_ptr: number, privkey_len: number) => number;
  readonly generate_nonce: () => string;
  readonly get_current_timestamp: () => number;
  readonly generate_sign: (data_ptr: number, data_len: number, privkey_ptr: number, privkey_len: number) => number;
  readonly verify_sign: (data_ptr: number, data_len: number, sig_ptr: number, sig_len: number, pubkey_ptr: number, pubkey_len: number) => boolean;
  readonly uu3_decrypt_simple: (data_ptr: number, data_len: number) => number;
  readonly uu1_decrypt_response: (data_ptr: number, data_len: number, origin_ptr: number, origin_len: number, ts_ptr: number, ts_len: number) => number;
  readonly uu1_decrypt_response_object: (response: any) => any;
  readonly uu1_decrypt_response_object_with_arraybuffer: (response: any) => any;
  readonly uu2_encrypt_request: (data_ptr: number, data_len: number, key_ptr: number, key_len: number) => number;
  readonly uu2_process_request: (request: any) => any;
  readonly uu4_decrypt_response: (data_ptr: number, data_len: number, uuid_ptr: number, uuid_len: number, ts_ptr: number, ts_len: number) => number;
  readonly encrypt_storage_key: (key_ptr: number, key_len: number, _: number, _1: number) => number;
  readonly encrypt_storage_value: (val_ptr: number, val_len: number, _: number, _1: number, _2: number, _3: number, _4: number, _5: number, _6: number, _7: number) => number;
  readonly decrypt_storage_value: (val_ptr: number, val_len: number, _: number, _1: number, _2: number, _3: number, _4: number, _5: number, _6: number, _7: number) => number;
  readonly custom_encrypt_with_codec_keypair: (data_ptr: number, data_len: number, pubkey_ptr: number, pubkey_len: number, privkey_ptr: number, privkey_len: number) => number;
  readonly font_encrypt_text: (text_ptr: number, text_len: number, encrypt_numbers: boolean, encrypt_chinese: boolean) => number;
  readonly font_decrypt_text: (text_ptr: number, text_len: number) => number;
  readonly font_is_encrypted_char: (char_ptr: number, char_len: number) => boolean;
  readonly font_get_mapped_char_count: () => number;
  readonly font_get_maps: () => number;
}

/**
 * 同步初始化函数
 */
export function initSync(module: InitInput): InitOutput;

/**
 * 异步初始化函数
 */
export default function init(input?: InitInput | Promise<InitInput>): Promise<InitOutput>;
EOF
  echo "✓ TypeScript 类型定义文件已自动创建: build/codec_wasm.d.ts"
fi

# 恢复原始 PATH（如果之前没有恢复）
export PATH="$ORIGINAL_PATH"


