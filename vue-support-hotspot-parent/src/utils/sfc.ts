import { defineAsyncComponent } from "vue";

const cacheLoadModule = {};
export const loadSfcModule = (name, sysSfcId) => {
  return defineAsyncComponent(async () => {
    let module = cacheLoadModule[sysSfcId];
    if (module) {
      if (module.timestamp + 360_000 < new Date().getTime()) {
        cacheLoadModule[sysSfcId] = null;
      } else {
        return module.module;
      }
    }
  });
};
