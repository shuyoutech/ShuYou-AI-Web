import {authAccessToken, authLogout, authSmsLogin} from "@/api/auth";
import {memberGetProfileApi} from "@/api/member";
import type {MemberUserVo} from "@/api/member/types.ts";

export const useUserStore = defineStore(
  // 唯一ID
  'user',
  () => {
    const account = ref(localStorage.getItem('account') ?? '')
    const token = ref(localStorage.getItem('token') ?? '')
    const avatar = ref(localStorage.getItem('avatar') ?? '')
    const nickname = ref(localStorage.getItem('nickname') ?? '')
    const userId = ref(localStorage.getItem('userId') ?? '')
    const expireTime = ref(localStorage.getItem('expireTime') ?? '') // token有效期（秒）
    const loginTime = ref(localStorage.getItem('loginTime') ?? '') // 登录时间戳（秒）
    const userInfo = ref<MemberUserVo>(localStorage.getItem('userInfo') ? JSON.parse(<string>localStorage.getItem('userInfo')) : {})
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
          localStorage.setItem('token', res.data.accessToken)
          localStorage.setItem('userId', res.data.userId)
          localStorage.setItem('expireTime', res.data.expireTime)
          localStorage.setItem('loginTime', currentTime.toString())
          token.value = res.data.accessToken
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

    // 获取会员信息
    const getMemberInfo = () => {
      memberGetProfileApi().then((res: any) => {
        if (res.code === 0) {
          avatar.value = res.data.avatar
          nickname.value = res.data.nickname
          userInfo.value = res.data
          localStorage.setItem('userInfo', JSON.stringify(res.data))
          localStorage.setItem('avatar', avatar.value)
          localStorage.setItem('nickname', nickname.value)
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
          localStorage.setItem('account', mobile)
          localStorage.setItem('token', res.data.accessToken)
          localStorage.setItem('userId', res.data.userId)
          localStorage.setItem('expireTime', res.data.expireTime)
          localStorage.setItem('loginTime', currentTime.toString())
          account.value = mobile
          token.value = res.data.accessToken
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
      localStorage.removeItem('account')
      localStorage.removeItem('token')
      localStorage.removeItem('userId')
      localStorage.removeItem('expireTime')
      localStorage.removeItem('loginTime')
      localStorage.removeItem('userInfo')
      localStorage.removeItem('nickname')
      localStorage.removeItem('avatar')
      token.value = ''
      account.value = ''
      avatar.value = ''
      userId.value = ''
      nickname.value = ''
      expireTime.value = ''
      loginTime.value = ''
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
      smsLogin,
      getMemberInfo,
      logout,
      requestLogout,
    }
  },
)
