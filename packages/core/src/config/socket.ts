import { io } from "socket.io-client";
import { getToken } from "@repo/config";
import { uu4 } from "@repo/utils";
import { message } from "@repo/utils";

export const socket = (
  urls,
  options = {
    transports: ["websocket"],
    autoConnect: true, // 是否自动连接
    reconnection: true, // 是否自动重新连接
    reconnectionAttempts: 3, // 重新连接尝试次数
    reconnectionDelay: 1000, // 重新连接延迟时间（毫秒）
  },
) => {
  const newOptions = {
    query: null,
  };
  Object.assign(newOptions, options);
  const token = getToken();
  newOptions.query = { "x-oauth-token": token?.accessToken };
  const random = Math.random() * urls.length;
  const url = urls[random];
  const session = io(url, newOptions);
  const socketWrapper = {
    on: function (event, callback) {
      session.on(event, (row) => {
        if (!row) {
          return;
        }
        try {
          if (typeof row === "string") {
            try {
              row = JSON.parse(row);
            } catch (error) {
              callback(row);
              return;
            }
          }
          const data = uu4(row);
          if (typeof data === "object") {
            callback(data);
            return;
          }
          const line = data?.data || "";
          if (
            (line.startsWith("{") || line.startsWith("[")) &&
            (line.endsWith("]") || line.endsWith("}"))
          ) {
            callback(JSON.parse(line));
            return;
          }
          callback(line);
        } catch (e) {}
      });
    },
    off: function (event) {
      session?.off(event);
    },
    close: function () {
      session?.close();
    },
    emit: function (event, data) {
      session?.emit(event, data);
    },
  };
  socketWrapper.on("connect", (data) => {
    console.log("连接成功", data);
  });
  socketWrapper.on("connecting", (data) => {
    console.log("正在连接", data);
  });
  socketWrapper.on("disconnect", (data) => {
    console.log("断开连接", data);
    if (data === "io server disconnect") {
      // the disconnection was initiated by the server, you need to reconnect manually
      session?.connect();
    }
  });
  socketWrapper.on("connect_failed", (data) => {
    console.log("连接失败", data);
  });
  socketWrapper.on("error", (data) => {
    console.log("错误", data);
  });
  socketWrapper.on("reconnect_failed", (data) => {
    console.log("重连失败", data);
  });
  socketWrapper.on("reconnect", (data) => {
    console.log("成功重连", data);
  });
  socketWrapper.on("reconnecting", (data) => {
    console.log("正在重连", data);
  });

  if (window.Notification && Notification.permission === "denied") {
    Notification.requestPermission();
  }

  socketWrapper.on("online", (data) => {
    // 浏览器支持且用户没有禁止浏览器通知的情况下执行
    if (window.Notification && Notification.permission !== "denied") {
      const data1 = JSON.parse(data);
      Notification.requestPermission(function () {
        new Notification("上线通知", {
          body: data1?.message,
        });
      });
    } else {
      const data1 = JSON.parse(data);
      message(data1?.message, { type: "success" });
    }
  });
  socketWrapper.on("offline", (data) => {
    // 浏览器支持且用户没有禁止浏览器通知的情况下执行
    if (window.Notification && Notification.permission !== "denied") {
      const data1 = JSON.parse(data);
      Notification.requestPermission(function () {
        new Notification("下线通知", {
          body: data1?.message,
        });
      });
    } else {
      const data1 = JSON.parse(data);
      message(data1?.message, { type: "success" });
    }
  });
  return socketWrapper;
};
