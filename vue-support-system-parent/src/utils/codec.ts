import { sm2 } from "sm-crypto";
import * as crypto from "@/utils/crypto";

/** uu1 */
export const uu1 = response => {
  return uu(sm2, response);
};

/** uu */
export const uu = (sm2, response) => {
  if (response.status == 200) {
    var origin = response.headers["access-control-origin-key"];
    if (origin) {
      const data = response.data?.data;
      const ts = response.headers["access-control-timestamp-user"];
      try {
        response.data = JSON.parse(
          sm2.doDecrypt(
            data?.data.substring(6, data?.data.length - 4),
            crypto.default.AES.decrypt(origin, ts),
            0
          )
        );
      } catch (err) {}
    }
  }
  return response;
};
