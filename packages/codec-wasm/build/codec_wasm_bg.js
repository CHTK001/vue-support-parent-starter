let wasm;
export function __wbg_set_wasm(val) {
    wasm = val;
}

/**
 * @returns {number}
 */
export function generateSm2KeyPair() {
    const ret = wasm.generateSm2KeyPair();
    return ret >>> 0;
}

/**
 * @param {number} data_ptr
 * @param {number} data_len
 * @param {number} public_key_ptr
 * @param {number} public_key_len
 * @returns {number}
 */
export function sm2Encrypt(data_ptr, data_len, public_key_ptr, public_key_len) {
    const ret = wasm.sm2Encrypt(data_ptr, data_len, public_key_ptr, public_key_len);
    return ret >>> 0;
}

/**
 * @param {number} encrypted_data_ptr
 * @param {number} encrypted_data_len
 * @param {number} private_key_ptr
 * @param {number} private_key_len
 * @returns {number}
 */
export function sm2Decrypt(encrypted_data_ptr, encrypted_data_len, private_key_ptr, private_key_len) {
    const ret = wasm.sm2Decrypt(encrypted_data_ptr, encrypted_data_len, private_key_ptr, private_key_len);
    return ret >>> 0;
}

export function __wbindgen_init_externref_table() {
    const table = wasm.__wbindgen_export_0;
    const offset = table.grow(4);
    table.set(0, undefined);
    table.set(offset + 0, undefined);
    table.set(offset + 1, null);
    table.set(offset + 2, true);
    table.set(offset + 3, false);
    ;
};

