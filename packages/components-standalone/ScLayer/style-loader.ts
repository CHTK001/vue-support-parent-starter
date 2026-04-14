let scLayerBaseVendorStylesPromise: Promise<void> | null = null;
let scLayerOlExtVendorStylesPromise: Promise<void> | null = null;
let scLayerCesiumVendorStylesPromise: Promise<void> | null = null;

const toVoid = (promise: Promise<unknown>) => promise.then(() => undefined);

export const ensureScLayerBaseVendorStyles = (): Promise<void> => {
  if (!scLayerBaseVendorStylesPromise) {
    scLayerBaseVendorStylesPromise = toVoid(import("ol/ol.css"));
  }

  return scLayerBaseVendorStylesPromise;
};

export const ensureScLayerOlExtVendorStyles = (): Promise<void> => {
  if (!scLayerOlExtVendorStylesPromise) {
    scLayerOlExtVendorStylesPromise = toVoid(import("ol-ext/dist/ol-ext.css"));
  }

  return scLayerOlExtVendorStylesPromise;
};

export const ensureScLayerCesiumVendorStyles = (): Promise<void> => {
  if (!scLayerCesiumVendorStylesPromise) {
    scLayerCesiumVendorStylesPromise = toVoid(
      import("cesium/Build/Cesium/Widgets/widgets.css"),
    );
  }

  return scLayerCesiumVendorStylesPromise;
};

export const ensureScLayerVendorStyles = (): Promise<void> =>
  Promise.all([
    ensureScLayerBaseVendorStyles(),
    ensureScLayerOlExtVendorStyles(),
    ensureScLayerCesiumVendorStyles(),
  ]).then(() => undefined);
