import { sm2 } from 'sm-crypto-v2';

export class Sm2 {
  private secret: string;
  constructor(secret: string) {
    this.secret = secret;
  }
  encrypt(data: string) {
    return sm2.doEncrypt(this.secret, data);
  }
  decrypt(encrypted: string) {
    return sm2.doDecrypt(this.secret, encrypted);
  }
}