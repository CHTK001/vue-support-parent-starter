import { sm2 } from 'sm-crypto';

export class Sm<T extends object> {
    /** Secret */
    secret: string;

    constructor(secret: string) {
        this.secret = secret;
    }

    encode(data: T): string {
        const dataString = JSON.stringify(data);
        return sm2.doEncrypt(dataString, this.secret);
    }

    decode(encrypted: string) {
        const decrypted = sm2.doDecrypt(encrypted, this.secret);
        try {
            return JSON.parse(decrypted) as T;
        } catch {
            // avoid parse error
            return null;
        }
    }
}
