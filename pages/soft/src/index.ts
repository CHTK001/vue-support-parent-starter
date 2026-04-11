import SoftCatalogPage from "./views/SoftCatalogPage.vue";
import SoftDetailPage from "./views/SoftDetailPage.vue";
import SoftInstallationPage from "./views/SoftInstallationPage.vue";
import SoftRecordPage from "./views/SoftRecordPage.vue";
import SoftRepositoryPage from "./views/SoftRepositoryPage.vue";
import SoftTargetPage from "./views/SoftTargetPage.vue";

export * from "./api";
export * from "./composables/useSoftOperationStream";
export * from "./composables/useSoftRuntimeLogStream";
export * from "./composables/useSoftSocketService";
export {
  SoftCatalogPage,
  SoftDetailPage,
  SoftInstallationPage,
  SoftRecordPage,
  SoftRepositoryPage,
  SoftTargetPage,
};
export { default as softRoutes } from "./router";
