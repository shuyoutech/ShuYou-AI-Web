import type { AxiosResponse } from 'axios'
import type { PayOrderQuery, PayOrderVo, PayPrepayVo, PayWalletVo, QueryOrderVo } from '@/api/pay/types.ts'
import api from '@/utils/axios.ts'

/**
 * 支付管理-支付下单
 * @param amount 支付金额,单位分
 */
export function payPrepayApi(amount: number): Promise<AxiosResponse<PayPrepayVo>> {
  return api({
    url: '/pay/prepay',
    method: 'post',
    data: {
      amount,
      sceneCode: 'weixin-native',
    },
  })
}

/**
 * 支付管理-查询订单
 * @param outTradeNo 商户订单号
 */
export function payQueryOrderApi(outTradeNo: string): Promise<AxiosResponse<QueryOrderVo>> {
  return api({
    url: '/pay/query-order',
    method: 'post',
    data: {
      outTradeNo,
      sceneCode: 'weixin-native',
    },
  })
}

/**
 * 钱包管理-获得用户钱包详情
 */
export function payGetWalletApi(): Promise<AxiosResponse<PayWalletVo>> {
  return api({
    url: '/pay/wallet/get',
    method: 'post',
  })
}

/**
 * 充值管理-充值记录分页
 */
export function payOrderPageApi(data: PageQuery<PayOrderQuery>): Promise<AxiosResponse<PageResult<PayOrderVo>>> {
  return api({
    url: '/pay/order/page',
    method: 'post',
    data,
  })
}
