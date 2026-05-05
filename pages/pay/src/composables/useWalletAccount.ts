import { ref } from "vue";
import { getWalletAccountByMerchantId } from "../api/payment";
import type { WalletAccount } from "../types/payment";

export function useWalletAccount() {
  const walletAccount = ref<WalletAccount | null>(null);
  const walletLoading = ref(false);

  async function queryWalletAccount(merchantId: number) {
    walletLoading.value = true;
    try {
      const res = await getWalletAccountByMerchantId(merchantId);
      walletAccount.value = res.data ?? null;
    } finally {
      walletLoading.value = false;
    }
  }

  return { walletAccount, walletLoading, queryWalletAccount };
}
