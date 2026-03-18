import { defineStore } from "pinia";
import { ref } from "vue";
import type { EmailAccount, EmailMessage } from "../api/email";

export const useEmailStore = defineStore("email", () => {
  const accounts = ref<EmailAccount[]>([]);
  const currentAccount = ref<EmailAccount | null>(null);
  const emails = ref<EmailMessage[]>([]);
  const currentFolder = ref("INBOX");

  const setAccounts = (newAccounts: EmailAccount[]) => {
    accounts.value = newAccounts;
    if (newAccounts.length > 0 && !currentAccount.value) {
      currentAccount.value =
        newAccounts.find((a) => a.isDefault) || newAccounts[0];
    }
  };

  const setCurrentAccount = (account: EmailAccount) => {
    currentAccount.value = account;
  };

  const setEmails = (newEmails: EmailMessage[]) => {
    emails.value = newEmails;
  };

  const setCurrentFolder = (folder: string) => {
    currentFolder.value = folder;
  };

  return {
    accounts,
    currentAccount,
    emails,
    currentFolder,
    setAccounts,
    setCurrentAccount,
    setEmails,
    setCurrentFolder,
  };
});
