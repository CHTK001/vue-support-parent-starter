import { defineAsyncComponent } from "vue";

export function createLazySfcComponent(sysSfc: any) {
  if (sysSfc?.vue) {
    return sysSfc.vue;
  }

  return defineAsyncComponent(async () => {
    const { loadSfcModule } = await import("@repo/utils/sfc");
    return loadSfcModule(`${sysSfc.sysSfcName}.vue`, sysSfc.sysSfcId, sysSfc);
  });
}
