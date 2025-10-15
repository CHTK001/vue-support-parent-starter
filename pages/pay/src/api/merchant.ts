import { http } from '@repo/utils'

// 分页查询商户
export const fetchPageMerchant = async (params: any) => {
  return await http.get('/v2/pay/merchant/page', params)
}

// 新增商户
export const fetchSaveMerchant = (data: any) => {
  return http.post('/v2/pay/merchant/save', data)
}

// 更新商户（启用/禁用/编辑）
export const fetchUpdateMerchant = (data: any) => {
  return http.put('/v2/pay/merchant/update', data)
}

// 删除商户（逻辑删除）
export const fetchDeleteMerchant = (row: any) => {
  return http.put('/v2/pay/merchant/update', { payMerchantId: row.payMerchantId, payMerchantDelete: 1 })
}