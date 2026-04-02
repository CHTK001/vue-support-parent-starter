export const safeRelaunch = (url: string) => {
  if (typeof window !== "undefined" && window.location?.origin) {
    const base = `${window.location.origin}${window.location.pathname}`;
    window.location.replace(`${base}?nav=${Date.now()}#${url}`);
    return;
  }
  uni.reLaunch({ url });
};
