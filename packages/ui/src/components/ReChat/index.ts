import type { App, Plugin } from 'vue';
import ReChat from './ReChat.vue';

const plugin: Plugin = {
  install(app: App) {
    app.component('ReChat', ReChat);
  },
};

export { plugin as install };
export default ReChat;
