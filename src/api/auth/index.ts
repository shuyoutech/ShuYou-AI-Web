import api from '@/utils/axios.ts'
import type {
  AuthAccessTokenReq,
  AuthAccessTokenRes,
  AuthAuthorizeReq, AuthLoginReq, AuthLoginRes,
  AuthSmsLoginReq,
  AuthSmsLoginRes,
  AuthSmsSendReq
} from "@/api/auth/types.ts"
import type {AxiosResponse} from "axios"

/**
 * 使用账号密码登录
 */
export function authLogin(data: AuthLoginReq): Promise<AxiosResponse<AuthLoginRes>> {
  return api({
    url: '/api/auth/login',
    method: 'post',
    data: data
  });
}

/**
 * 社交用户授权,获取code
 */
export function authAuthorize(data: AuthAuthorizeReq): Promise<AxiosResponse<string>> {
  return api({
    url: '/api/auth/authorize',
    method: 'post',
    data: data
  });
}

/**
 * 根据code获取第三方访问令牌
 */
export function authAccessToken(data: AuthAccessTokenReq): Promise<AxiosResponse<AuthAccessTokenRes>> {
  return api({
    url: '/api/auth/token',
    method: 'post',
    data: data
  });
}

/**
 * 使用手机 + 验证码登录
 */
export function authSendSms(data: AuthSmsSendReq): Promise<AxiosResponse<boolean>> {
  return api({
    url: '/api/auth/send-sms',
    method: 'post',
    data: data
  });
}

/**
 * 使用手机 + 验证码登录
 */
export function authSmsLogin(data: AuthSmsLoginReq): Promise<AxiosResponse<AuthSmsLoginRes>> {
  return api({
    url: '/api/auth/sms-login',
    method: 'post',
    data: data
  });
}

/**
 * 用户退出
 */
export function authLogout() {
  return api({
    url: '/auth/logout',
    method: 'post'
  });
}
