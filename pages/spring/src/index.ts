import "./styles/spring-console.css";

export { default as JobConsolePage } from "./views/job/JobConsolePage.vue";
export { default as PaymentConsolePage } from "./views/payment/PaymentConsolePage.vue";
export { default as SpringConsoleLoginPage } from "./views/common/SpringConsoleLoginPage.vue";
export {
  getSpringPageDefinition,
  springPageDefinitions,
  type SpringPageDefinition,
} from "./support/pageRegistry";
