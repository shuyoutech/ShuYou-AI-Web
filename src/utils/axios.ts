import axios from 'axios'

// 请求重试配置
const MAX_RETRY_COUNT = 3 // 最大重试次数
const RETRY_DELAY = 1000 // 重试延迟时间（毫秒）

// 扩展 AxiosRequestConfig 类型
declare module 'axios' {
  export interface AxiosRequestConfig {
    retry?: boolean
    retryCount?: number
  }
}

const api = axios.create({
  baseURL: (import.meta.env.DEV && import.meta.env.VITE_OPEN_PROXY) ? '/proxy/' : import.meta.env.VITE_APP_API_BASEURL,
  timeout: 1800000,
  responseType: 'json',
})

api.interceptors.request.use(
  (request) => {
    // 全局拦截请求发送前提交的参数
    const userStore = useUserStore()
    // 检查 token 是否过期
    if (userStore.isLogin && userStore.isTokenExpired()) {
      console.warn('Token 已过期，自动登出')
      userStore.requestLogout()
      userStore.showLoginModal = true
      return Promise.reject(new Error('Token 已过期'))
    }

    // 设置请求头
    if (request.headers && userStore.isTokenValid) {
      request.headers.satoken = userStore.token
    }
    return request
  },
  (error: any) => {
    return Promise.reject(error)
  },
)

api.interceptors.response.use(
  (response) => {
    if (response?.status === 200) {
      if (response.data.code >= 401 && response.data.code <= 403) {
        useUserStore().requestLogout()
        useUserStore().showLoginModal = true
        return Promise.reject(response.data)
      }
      if (response.data.code === 0) {
        if (response.headers['content-disposition']) {
          return Promise.resolve(response)
        }
      }
      return Promise.resolve(response.data)
    }

    return Promise.reject(response)
  },
  async (error) => {
    // 获取请求配置
    const config = error.config

    // 如果配置不存在或未启用重试，则直接处理错误
    if (!config || !config.retry) {
      console.error(error)
      await Promise.reject(error)
    }

    // 设置重试次数
    config.retryCount = config.retryCount || 0

    // 判断是否超过重试次数
    if (config.retryCount >= MAX_RETRY_COUNT) {
      console.error(error)
      await Promise.reject(error)
    }

    // 重试次数自增
    config.retryCount += 1

    // 延迟重试
    await new Promise(resolve => setTimeout(resolve, RETRY_DELAY))

    // 重新发起请求
    return api(config)
  },
)

export default api
