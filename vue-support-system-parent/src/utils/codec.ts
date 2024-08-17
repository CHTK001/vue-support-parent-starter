import { sm2 } from "sm-crypto";

/** uu1 */
export const uu1 = response => {
  return uu(sm2, response);
};

/** uu */
export const uu = (sm2, response) => {
  if (response.status == 200) {
    const data = response.data?.data;
    const sign1 = c;
    var origin = response.headers["access-control-origin-key"];
    if (origin) {
      const ts = response.headers["access-control-timestamp-user"];
      ts += sign1;
      try {
        response.data = JSON.parse(
          sm2.doDecrypt(
            data?.data.substring(6, data?.data.length - 4),
            tool.crypto.AES.decrypt(origin, ts),
            0
          )
        );
      } catch (err) {}
    }
  }
  return response;
};
