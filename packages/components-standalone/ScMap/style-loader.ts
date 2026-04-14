let scMapVendorStylesPromise: Promise<void> | null = null;
let scMapOlExtVendorStylesPromise: Promise<void> | null = null;
let scMapMiniMapVendorStylesPromise: Promise<void> | null = null;
let scMapMarkerClusterVendorStylesPromise: Promise<void> | null = null;

const toVoid = (promise: Promise<unknown>) => promise.then(() => undefined);

export const ensureScMapVendorStyles = (): Promise<void> => {
  if (!scMapVendorStylesPromise) {
    scMapVendorStylesPromise = toVoid(import("leaflet/dist/leaflet.css"));
  }

  return scMapVendorStylesPromise;
};

export const ensureScMapOlExtVendorStyles = (): Promise<void> => {
  if (!scMapOlExtVendorStylesPromise) {
    scMapOlExtVendorStylesPromise = toVoid(import("ol-ext/dist/ol-ext.css"));
  }

  return scMapOlExtVendorStylesPromise;
};

export const ensureScMapMiniMapVendorStyles = (): Promise<void> => {
  if (!scMapMiniMapVendorStylesPromise) {
    scMapMiniMapVendorStylesPromise = toVoid(
      import("leaflet-minimap/dist/Control.MiniMap.min.css"),
    );
  }

  return scMapMiniMapVendorStylesPromise;
};

export const ensureScMapMarkerClusterVendorStyles = (): Promise<void> => {
  if (!scMapMarkerClusterVendorStylesPromise) {
    scMapMarkerClusterVendorStylesPromise = Promise.all([
      toVoid(import("leaflet.markercluster/dist/MarkerCluster.css")),
      toVoid(import("leaflet.markercluster/dist/MarkerCluster.Default.css")),
    ]).then(() => undefined);
  }

  return scMapMarkerClusterVendorStylesPromise;
};
