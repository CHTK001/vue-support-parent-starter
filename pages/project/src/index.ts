import ProjectHomePage from "./index.vue";
import ProjectIndex from "./views/project/index.vue";
import ProjectContainerServicePanel from "./views/project/ProjectContainerServicePanel.vue";
import SecretIndex from "./views/secret/index.vue";
import EmailTemplate from "./views/template/email/index.vue";
import SmsTemplate from "./views/template/sms/index.vue";
import ServerRemoteProjectPanel from "./components/ServerRemoteProjectPanel.vue";

export default ProjectHomePage;

export {
  EmailTemplate,
  ProjectContainerServicePanel,
  ProjectHomePage,
  ProjectIndex,
  SecretIndex,
  ServerRemoteProjectPanel,
  SmsTemplate,
};
export * from "./api/manage/secret";
export * from "./api/manage/remote";
