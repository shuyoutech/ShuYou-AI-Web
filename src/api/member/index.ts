import type {AxiosResponse} from "axios"
import type {MemberUserVo} from "@/api/member/types.ts"
import api from "@/utils/axios.ts"

/**
 * 会员管理-获取个人信息
 */
export function memberGetProfileApi(): Promise<AxiosResponse<MemberUserVo>> {
  return api({
    url: '/member/user/get-profile',
    method: 'post',
  });
}

/**
 * 会员管理-绑定第三方用户
 */
export function memberBindThirdPartyApi(code: string): Promise<AxiosResponse<boolean>> {
  return api({
    url: '/member/user/bind-third-party',
    method: 'post',
    data: {
      type: 'wechat',
      code: code,
    },
  });
}

/**
 * 会员管理-绑定手机号
 */
export function memberBindMobileApi(mobile: string, code: string): Promise<AxiosResponse<boolean>> {
  return api({
    url: '/member/user/bind-mobile',
    method: 'post',
    data: {
      mobile: mobile,
      code: code,
    },
  });
}
