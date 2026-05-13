// Stub: request function for protocol module
const request = <T = any>(config: any): Promise<T> => {
  console.warn("[protocol-stub] request called but not implemented:", config?.url);
  return Promise.resolve({} as T);
};

export default request;
