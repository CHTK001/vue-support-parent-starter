export const config  = {
  filename: "file",
  maxSizeFile: 10 * 1024 * 1024,
  successCode: "00000"
}

export const parseData = (data) => {
  return {
    code: data.code,
    ...data?.data
  }
}

export default config;