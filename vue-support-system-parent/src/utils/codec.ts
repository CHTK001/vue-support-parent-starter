import { sm2, sm4 } from "sm-crypto";
import * as crypto from "@/utils/crypto";
import type { PureHttpResponse, PureHttpRequestConfig } from "../utils/http/types.d";
import { useConfigStore } from "@/store/modules/config";

/** uu2 */
export const uu2 = (request: PureHttpRequestConfig) => {
  const body = request.data;
  const url = request.url;
  if (url.startsWith("/v2/setting")) {
    return request;
  }
  if (!body) {
    return request;
  }

  if (!useConfigStore().requestCodecOpen() || !useConfigStore().codecRequestKey()) {
    return request;
  }

  const isArray = body instanceof Array;
  if (!isArray) {
    const keys = Object.keys(body);
    if (
      keys.filter(item => {
        const val = body[item];
        if (val instanceof File) {
          return true;
        }

        if (val instanceof Blob) {
          return true;
        }

        return false;
      }).length > 0
    ) {
      return request;
    }
  }
  var data1 = JSON.stringify(body);
  try {
    const newData = sm4.encrypt(data1, useConfigStore().codecRequestKey());
    request.data = isArray ? [{ data: newData }] : { data: newData };
    request.headers["access-control-origin-key"] = new Date().getTime();
    return request;
  } catch (error) {
    return request;
  }
};
/** uu1 */
export const uu1 = (response: PureHttpResponse) => {
  return uu(sm2, response);
};

/** uu */
const uu = (sm2, response: PureHttpResponse) => {
  if (response.status == 200) {
    var data = response.data?.data;
    if (typeof data !== "string") {
      if (typeof data === "object") {
        if (!data?.data || typeof data.data !== "string") {
          return response;
        }

        data = data.data;
      } else {
        return response;
      }
    }
    if (!data.startsWith("02")) {
      return response;
    }
    var origin = response.headers["access-control-origin-key"];
    if (origin) {
      const ts = response.headers["access-control-timestamp-user"];
      try {
        response.data = JSON.parse(sm2.doDecrypt(data.substring(8, data.length - 4), crypto.default.AES.decrypt(origin, ts), 0));
      } catch (err) {}
    }
  }
  return response;
};
