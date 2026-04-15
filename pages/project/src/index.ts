import ProjectHomePage from "./index.vue";
import ProjectIndex from "./views/project/index.vue";
import SecretIndex from "./views/secret/index.vue";
import EmailTemplate from "./views/template/email/index.vue";
import SmsTemplate from "./views/template/sms/index.vue";

export default ProjectHomePage;

export {
  EmailTemplate,
  ProjectHomePage,
  ProjectIndex,
  SecretIndex,
  SmsTemplate,
};
export * from "./api/manage/secret";
