import type { App, InjectionKey, Plugin } from "vue";
import {
  createFaceApiService,
  type FaceApiService,
  type FaceApiServiceOptions,
} from "@repo/utils";

export interface FaceApiPluginOptions extends FaceApiServiceOptions {
  globalPropertyName?: string;
}

export const FACE_API_INJECTION_KEY: InjectionKey<FaceApiService> = Symbol(
  "FACE_API_INJECTION_KEY",
);

export const createFaceApiPlugin = (
  options: FaceApiPluginOptions = {},
): Plugin => {
  const service = createFaceApiService(options);
  const propertyName = options.globalPropertyName ?? "$faceApi";

  return {
    install(app: App) {
      app.provide(FACE_API_INJECTION_KEY, service);
      (app.config.globalProperties as Record<string, unknown>)[propertyName] =
        service;
    },
  };
};

export const useFaceApiPlugin = createFaceApiPlugin;

declare module "vue" {
  interface ComponentCustomProperties {
    $faceApi: FaceApiService;
  }
}
