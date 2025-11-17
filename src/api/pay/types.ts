export interface PayPrepayBo {
  sceneCode: string // 支付场景编号:weixin-native(微信PC端网页支付),weixin-jsapi(微信小程序支付)
  amount: number // 支付金额,单位分
}

export interface PayPrepayVo {
  codeUrl: string // 二维码
  outTradeNo: string // 商户订单号
  appId: string //
  timeStamp: string // 时间戳
  nonceStr: string // 随机字符串
  package: string // 预支付交易会话标识
  signType: string // 签名类型,默认为RSA，仅支持RSA
  paySign: string // 签名值
}

export interface QueryOrderBo {
  sceneCode: string // 支付场景编号
  outTradeNo: string // 商户订单号
}

export interface QueryOrderVo {
  transactionId: string // 微信支付订单号
  tradeState: string // 交易状态,SUCCESS:支付成功
  amount: object // 订单金额:{total:总金额,currency:CNY货币类型}
  tradeType: string // 交易类型:JSAPI：公众号支付、小程序支付,NATIVE：Native支付,APP：APP支付,MICROPAY：付款码支付,MWEB：H5支付,FACEPAY：刷脸支付
  successTime: string // 支付完成时间
  appid: string // 公众账号ID
  mchid: string // 商户号
}

export interface PayWalletVo {
  balance: number // 积分余额，单位算力
  totalExpense: number // 积分累计支出，单位算力
  totalRecharge: number // 积分累计充值，单位算力
}

export interface PayOrderQuery {
  startDate?: string
  endDate?: string
}

export interface PayOrderVo {
  id: string
  createTime: string
  createUserId: string
  createUserName: string
  status: string
  statusName: string
  sceneCode: string
  mchId: string
  appId: string
  transactionId: string
  payPrice: number
  payPriceStr: string
}
