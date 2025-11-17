export interface MemberUserVo {
  id: string; //会员用户ID
  createTime: string; //创建时间
  status: string; //状态
  nickname: string; //用户昵称
  mobile: string; //手机号码
  email: string; //电子邮箱
  avatar: string; //用户头像
  sex: string; //性别
  address: string; //地址
  loginIp: string; //最后登录IP
  loginDate: string; //最后登录时间
  bindWechat: boolean; //是否绑定微信:true-绑定
}

export interface MemberBindThirdPartyBo {
  type: string; //第三方平台类型:wechat-微信
  code: string; //授权码
}

export interface MemberBindMobileBo {
  mobile: string; //手机号
  code: string;   //手机验证码
}
