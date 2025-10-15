import { http } from '@repo/utils'

// 分页查询订单（支持状态、商户、支付/完成时间区间）
export const fetchPageOrder = async (params: any) => {
  const res: any = await http.get('/v2/pay/order/page', params)
  const data = res?.data || {}
  return { data: data?.records || data?.data || [], total: data?.total || 0 }
}

// 关闭订单
export const fetchCloseOrder = (orderCode: string) => {
  return http.put(`/v2/pay/closeOrder/${orderCode}`)
}

// 退款订单（原路退）
export const fetchRefundOrder = (orderCode: string, payload: { refundAmount: number; refundReason?: string }) => {
  return http.put(`/v2/pay/refundOrder/${orderCode}`, payload)
}

// 退款到钱包
export const fetchRefundToWallet = (orderCode: string, payload: { refundAmount: number; refundReason?: string }) => {
  return http.put(`/v2/pay/refundOrderToWallet/${orderCode}`, payload)
}

// 订单流水
export const fetchOrderWater = (orderCode: string) => {
  return http.get('/v2/pay/order/water', { payMerchantOrderCode: orderCode })
}

// 失败记录
export const fetchOrderFailure = (orderCode: string) => {
  return http.get('/v2/pay/order/failure', { payMerchantOrderCode: orderCode })
}

export const OrderStatusOptions = [
  { value: 'PAY_CREATE', label: '已创建' },
  { value: 'PAY_WAITING', label: '支付中' },
  { value: 'PAY_SUCCESS', label: '支付成功' },
  { value: 'PAY_REFUND_WAITING', label: '退款中' },
  { value: 'PAY_REFUND_SUCCESS', label: '已退款' },
  { value: 'PAY_CLOSE_SUCCESS', label: '已关闭' },
  { value: 'PAY_TIMEOUT', label: '已超时' }
]
