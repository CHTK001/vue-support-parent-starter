export function useUniNav() {
  const navigateTo = (url: string) => uni.navigateTo({ url });

  const redirectTo = (url: string) => uni.redirectTo({ url });

  const reLaunch = (url: string) => uni.reLaunch({ url });

  const switchTab = (url: string) => uni.switchTab({ url });

  const navigateBack = (delta = 1) => uni.navigateBack({ delta });

  const canGoBack = () => getCurrentPages().length > 1;

  const getCurrentPage = () => {
    const pages = getCurrentPages();
    return pages[pages.length - 1];
  };

  const showToast = (
    title: string,
    icon: "success" | "error" | "loading" | "none" = "none",
    duration = 2000,
  ) => uni.showToast({ title, icon, duration });

  const showModal = (title: string, content: string) =>
    new Promise<boolean>((resolve) => {
      uni.showModal({
        title,
        content,
        success: (res) => resolve(res.confirm),
      });
    });

  const showLoading = (title = "加载中") => uni.showLoading({ title, mask: true });

  const hideLoading = () => uni.hideLoading();

  return {
    navigateTo,
    redirectTo,
    reLaunch,
    switchTab,
    navigateBack,
    canGoBack,
    getCurrentPage,
    showToast,
    showModal,
    showLoading,
    hideLoading,
  };
}
