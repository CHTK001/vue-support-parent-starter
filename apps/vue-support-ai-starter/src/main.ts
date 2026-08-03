import { createApp } from 'vue';
import ElementPlus from 'element-plus';
import 'element-plus/dist/index.css';
import App from '../../../pages/ai/src/App.vue';
import router from '../../../pages/ai/src/router';

const app = createApp(App);
app.use(ElementPlus);
app.use(router);
app.mount('#app');
