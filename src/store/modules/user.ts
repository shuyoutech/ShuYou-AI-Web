import { authAccessToken, authLogout, authSmsLogin } from '@/api/auth'
import { memberGetProfileApi } from '@/api/member'
import type { MemberUserVo } from '@/api/member/types.ts'
import { getCookie, removeCookie, setCookie } from '@/utils/cookie'
import type {AuthSmsLoginRes} from "@/api/auth/types.ts";

export const useUserStore = defineStore(
  // 唯一ID
  'user',
  () => {
    // 所有用户信息从 cookie 中读取，实现子域名共享
    const account = ref(getCookie('account') ?? '')
    const token = ref(getCookie('token') ?? '')
    const avatar = ref(getCookie('avatar') ?? '')
    const nickname = ref(getCookie('nickname') ?? '')
    const userId = ref(getCookie('userId') ?? '')
    const expireTime = ref(getCookie('expireTime') ?? '') // token有效期（秒）
    const loginTime = ref(getCookie('loginTime') ?? '') // 登录时间戳（秒）
    const userInfo = ref<MemberUserVo>(getCookie('userInfo') ? JSON.parse(getCookie('userInfo')) : {})
    const showLoginModal = ref(false)
    const isLogin = computed(() => {
      return token.value !== ''
    })

    // 检查 token 是否过期（使用函数，每次调用都会执行）
    const isTokenExpired = () => {
      if (!expireTime.value || !loginTime.value) {
        return true
      }
      // 计算当前时间与登录时间的差值（秒）
      const now = Math.floor(Date.now() / 1000) // 直接获取当前时间
      const login = Number.parseInt(loginTime.value) // 登录时间戳（秒）
      const tokenValidity = Number.parseInt(expireTime.value) // token有效期（秒）

      // 如果当前时间 - 登录时间 >= token有效期，则token已过期
      return (now - login) >= tokenValidity
    }

    // 检查 token 是否有效（未过期且存在）
    const isTokenValid = computed(() => {
      return token.value !== '' && !isTokenExpired()
    })

    // 第三方扫码登录
    const accessToken = (code: string) => {
      authAccessToken({
        type: 'wechat',
        code,
      }).then((res: any) => {
        if (res.code === 0) {
          const currentTime = Math.floor(Date.now() / 1000) // 当前时间戳（秒）
          // 所有信息存储到 cookie，实现子域名共享，同时更新 ref 确保响应式
          const tokenValue = res.data.accessToken
          setCookie('token', tokenValue)
          setCookie('userId', res.data.userId)
          setCookie('expireTime', res.data.expireTime)
          setCookie('loginTime', currentTime.toString())
          token.value = tokenValue // 更新 ref，触发响应式更新
          userId.value = res.data.userId
          expireTime.value = res.data.expireTime
          loginTime.value = currentTime.toString()
          showLoginModal.value = false
          getMemberInfo()
        } else {
          requestLogout()
        }
      })
    }

    // 更新用户token相关信息
    const updateAccessToken = (res: AuthSmsLoginRes) => {
      const currentTime = Math.floor(Date.now() / 1000) // 当前时间戳（秒）
      // 所有信息存储到 cookie，实现子域名共享，同时更新 ref 确保响应式
      const tokenValue = res.accessToken
      setCookie('token', tokenValue)
      setCookie('userId', res.userId)
      setCookie('expireTime', res.expireTime.toString())
      setCookie('loginTime', currentTime.toString())
      token.value = tokenValue // 更新 ref，触发响应式更新
      userId.value = res.userId
      expireTime.value = res.expireTime.toString()
      loginTime.value = currentTime.toString()
      showLoginModal.value = false
      getMemberInfo()
    }

    // 获取会员信息
    const getMemberInfo = () => {
      memberGetProfileApi().then((res: any) => {
        if (res.code === 0) {
          avatar.value = res.data.avatar
          nickname.value = res.data.nickname
          userInfo.value = res.data
          // 所有信息存储到 cookie，实现子域名共享
          setCookie('userInfo', JSON.stringify(res.data))
          setCookie('avatar', avatar.value)
          setCookie('nickname', nickname.value)
        } else {
          requestLogout()
        }
      })
    }

    // 手机登录
    const smsLogin = (mobile: string, code: string) => {
      authSmsLogin({ mobile, code }).then((res: any) => {
        if (res.code === 0) {
          const currentTime = Math.floor(Date.now() / 1000) // 当前时间戳（秒）
          // 所有信息存储到 cookie，实现子域名共享，同时更新 ref 确保响应式
          const tokenValue = res.data.accessToken
          setCookie('account', mobile)
          setCookie('token', tokenValue)
          setCookie('userId', res.data.userId)
          setCookie('expireTime', res.data.expireTime)
          setCookie('loginTime', currentTime.toString())
          account.value = mobile
          token.value = tokenValue // 更新 ref，触发响应式更新
          userId.value = res.data.userId
          expireTime.value = res.data.expireTime
          loginTime.value = currentTime.toString()
          showLoginModal.value = false
          getMemberInfo()
        } else {
          requestLogout()
          faToast.error(res.msg || '登录失败', { duration: 2000 })
        }
      })
    }

    // 手动登出
    const logout = () => {
      try {
        authLogout().then((res: any) => {
          if (res.code !== 0) {
            console.log(JSON.stringify(res))
          }
        })
      } finally {
        requestLogout()
      }
    }

    // 登出后清除状态
    const requestLogout = () => {
      // 删除所有 cookie 中的用户信息
      removeCookie('account')
      removeCookie('token')
      removeCookie('userId')
      removeCookie('expireTime')
      removeCookie('loginTime')
      removeCookie('userInfo')
      removeCookie('nickname')
      removeCookie('avatar')
      // 清空所有 ref，触发响应式更新
      account.value = ''
      token.value = ''
      avatar.value = ''
      userId.value = ''
      nickname.value = ''
      expireTime.value = ''
      loginTime.value = ''
      userInfo.value = {}
    }

    return {
      account,
      token,
      avatar,
      nickname,
      userId,
      expireTime,
      loginTime,
      userInfo,
      isLogin,
      isTokenExpired,
      isTokenValid,
      showLoginModal,
      accessToken,
      updateAccessToken,
      smsLogin,
      getMemberInfo,
      logout,
      requestLogout,
    }
  },
)
