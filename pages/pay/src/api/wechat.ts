import { http } from '@repo/utils'

// 保存或更新微信配置
export const fetchSaveOrUpdateWechatConfig = (data: any) => {
  return http.post('/v2/pay/merchant/wechat/saveOrUpdate', data)
}
