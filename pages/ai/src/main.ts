import { createApp } from 'vue';
import ElementPlus from 'element-plus';
import './styles/theme.css';
import App from './App.vue';
import router from './router';
import { roleDirective } from './directives/role';

const app = createApp(App);
app.use(ElementPlus);
app.use(router);
app.directive('role', roleDirective);
app.mount('#app');
