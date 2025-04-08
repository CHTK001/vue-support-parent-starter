import { App } from 'vue';
import ScRegion from './src/index.vue';

ScRegion.install = (app: App) => {
  app.component('ScRegion', ScRegion);
};

export default ScRegion;
export * from './src/types';
export * from './src/data'; 