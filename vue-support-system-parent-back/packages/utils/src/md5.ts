import { Md5 } from 'ts-md5';

export class Md5Crypto {

    timestamp: number;
    constructor(timestamp: number) {
        this.timestamp = timestamp;
    }
    /**
     * md5加密
     * @param plaintext
     */
    static md5(plaintext: string) {
        return Md5.hashStr(plaintext);
    }
}
