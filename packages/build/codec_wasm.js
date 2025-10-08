let wasm;

/**
 * @param {number} size
 * @returns {number}
 */
export function alloc(size) {
    const ret = wasm.alloc(size);
    return ret >>> 0;
}

/**
 * @param {number} ptr
 * @param {number} size
 */
export function dealloc(ptr, size) {
    wasm.dealloc(ptr, size);
}

/**
 * @param {number} data_ptr
 * @param {number} data_len
 * @param {number} key_ptr
 * @param {number} key_len
 * @returns {number}
 */
export function aes_encrypt(data_ptr, data_len, key_ptr, key_len) {
    const ret = wasm.aes_encrypt(data_ptr, data_len, key_ptr, key_len);
    return ret >>> 0;
}

/**
 * @param {number} encrypted_data_ptr
 * @param {number} encrypted_data_len
 * @param {number} key_ptr
 * @param {number} key_len
 * @returns {number}
 */
export function aes_decrypt(encrypted_data_ptr, encrypted_data_len, key_ptr, key_len) {
    const ret = wasm.aes_decrypt(encrypted_data_ptr, encrypted_data_len, key_ptr, key_len);
    return ret >>> 0;
}

/**
 * @param {number} data_ptr
 * @param {number} data_len
 * @returns {number}
 */
export function sm3_hash(data_ptr, data_len) {
    const ret = wasm.sm3_hash(data_ptr, data_len);
    return ret >>> 0;
}

/**
 * @param {number} data_ptr
 * @param {number} data_len
 * @param {number} key_ptr
 * @param {number} key_len
 * @returns {number}
 */
export function sm4_encrypt(data_ptr, data_len, key_ptr, key_len) {
    const ret = wasm.sm4_encrypt(data_ptr, data_len, key_ptr, key_len);
    return ret >>> 0;
}

/**
 * @param {number} encrypted_data_ptr
 * @param {number} encrypted_data_len
 * @param {number} key_ptr
 * @param {number} key_len
 * @returns {number}
 */
export function sm4_decrypt(encrypted_data_ptr, encrypted_data_len, key_ptr, key_len) {
    const ret = wasm.sm4_decrypt(encrypted_data_ptr, encrypted_data_len, key_ptr, key_len);
    return ret >>> 0;
}

/**
 * @returns {number}
 */
export function generate_sm2_key_pair() {
    const ret = wasm.generate_sm2_key_pair();
    return ret >>> 0;
}

/**
 * @param {number} data_ptr
 * @param {number} data_len
 * @param {number} public_key_ptr
 * @param {number} public_key_len
 * @returns {number}
 */
export function sm2_encrypt(data_ptr, data_len, public_key_ptr, public_key_len) {
    const ret = wasm.sm2_encrypt(data_ptr, data_len, public_key_ptr, public_key_len);
    return ret >>> 0;
}

/**
 * @param {number} encrypted_data_ptr
 * @param {number} encrypted_data_len
 * @param {number} private_key_ptr
 * @param {number} private_key_len
 * @returns {number}
 */
export function sm2_decrypt(encrypted_data_ptr, encrypted_data_len, private_key_ptr, private_key_len) {
    const ret = wasm.sm2_decrypt(encrypted_data_ptr, encrypted_data_len, private_key_ptr, private_key_len);
    return ret >>> 0;
}

const EXPECTED_RESPONSE_TYPES = new Set(['basic', 'cors', 'default']);

async function __wbg_load(module, imports) {
    if (typeof Response === 'function' && module instanceof Response) {
        if (typeof WebAssembly.instantiateStreaming === 'function') {
            try {
                return await WebAssembly.instantiateStreaming(module, imports);

            } catch (e) {
                const validResponse = module.ok && EXPECTED_RESPONSE_TYPES.has(module.type);

                if (validResponse && module.headers.get('Content-Type') !== 'application/wasm') {
                    console.warn("`WebAssembly.instantiateStreaming` failed because your server does not serve Wasm with `application/wasm` MIME type. Falling back to `WebAssembly.instantiate` which is slower. Original error:\n", e);

                } else {
                    throw e;
                }
            }
        }

        const bytes = await module.arrayBuffer();
        return await WebAssembly.instantiate(bytes, imports);

    } else {
        const instance = await WebAssembly.instantiate(module, imports);

        if (instance instanceof WebAssembly.Instance) {
            return { instance, module };

        } else {
            return instance;
        }
    }
}

function __wbg_get_imports() {
    const imports = {};
    imports.wbg = {};
    imports.wbg.__wbindgen_init_externref_table = function() {
        const table = wasm.__wbindgen_export_0;
        const offset = table.grow(4);
        table.set(0, undefined);
        table.set(offset + 0, undefined);
        table.set(offset + 1, null);
        table.set(offset + 2, true);
        table.set(offset + 3, false);
        ;
    };

    return imports;
}

function __wbg_init_memory(imports, memory) {

}

function __wbg_finalize_init(instance, module) {
    wasm = instance.exports;
    __wbg_init.__wbindgen_wasm_module = module;


    wasm.__wbindgen_start();
    return wasm;
}

function initSync(module) {
    if (wasm !== undefined) return wasm;


    if (typeof module !== 'undefined') {
        if (Object.getPrototypeOf(module) === Object.prototype) {
            ({module} = module)
        } else {
            console.warn('using deprecated parameters for `initSync()`; pass a single object instead')
        }
    }

    const imports = __wbg_get_imports();

    __wbg_init_memory(imports);

    if (!(module instanceof WebAssembly.Module)) {
        module = new WebAssembly.Module(module);
    }

    const instance = new WebAssembly.Instance(module, imports);

    return __wbg_finalize_init(instance, module);
}

async function __wbg_init(module_or_path) {
    if (wasm !== undefined) return wasm;


    if (typeof module_or_path !== 'undefined') {
        if (Object.getPrototypeOf(module_or_path) === Object.prototype) {
            ({module_or_path} = module_or_path)
        } else {
            console.warn('using deprecated parameters for the initialization function; pass a single object instead')
        }
    }

    if (typeof module_or_path === 'undefined') {
        module_or_path = new URL('codec_wasm_bg.wasm', import.meta.url);
    }
    const imports = __wbg_get_imports();

    if (typeof module_or_path === 'string' || (typeof Request === 'function' && module_or_path instanceof Request) || (typeof URL === 'function' && module_or_path instanceof URL)) {
        module_or_path = fetch(module_or_path);
    }

    __wbg_init_memory(imports);

    const { instance, module } = await __wbg_load(await module_or_path, imports);

    return __wbg_finalize_init(instance, module);
}

export { initSync };
export default __wbg_init;
