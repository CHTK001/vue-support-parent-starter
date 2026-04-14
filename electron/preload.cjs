const { contextBridge } = require("electron");

contextBridge.exposeInMainWorld("musicDesktop", {
  platform: process.platform,
  packaged: process.env.NODE_ENV === "production",
});
