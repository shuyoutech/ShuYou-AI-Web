/**
 * Cookie工具函数
 * 用于在父域名（.shuyoutech.com）上设置和获取cookie，实现子域名间共享
 */

// 父域名配置
const PARENT_DOMAIN = import.meta.env.DEV ? '' : '.shuyoutech.com'

// Cookie前缀配置（与localStorage保持一致）
const COOKIE_PREFIX = import.meta.env.VITE_APP_STORAGE_PREFIX || ''

/**
 * 获取cookie值
 * @param name cookie名称（会自动添加前缀）
 * @returns cookie值，如果不存在则返回空字符串
 */
export function getCookie(name: string): string {
  const fullName = `${COOKIE_PREFIX}${name}`
  const nameEQ = `${fullName}=`
  const ca = document.cookie.split(';')
  for (let i = 0; i < ca.length; i++) {
    let c = ca[i]
    while (c.charAt(0) === ' ') {
      c = c.substring(1, c.length)
    }
    if (c.indexOf(nameEQ) === 0) {
      return c.substring(nameEQ.length, c.length)
    }
  }
  return ''
}

/**
 * 设置cookie
 * @param name cookie名称（会自动添加前缀）
 * @param value cookie值
 * @param days 过期天数（可选，默认1天）
 * @param domain 域名（可选，默认使用父域名）
 */
export function setCookie(
  name: string,
  value: string,
  days: number = 1,
  domain: string = PARENT_DOMAIN,
): void {
  const fullName = `${COOKIE_PREFIX}${name}`
  const expires = new Date()
  expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000)
  document.cookie = `${fullName}=${value};expires=${expires.toUTCString()};domain=${domain};path=/;SameSite=Lax`
}

/**
 * 删除cookie
 * @param name cookie名称（会自动添加前缀）
 * @param domain 域名（可选，默认使用父域名）
 */
export function removeCookie(name: string, domain: string = PARENT_DOMAIN): void {
  const fullName = `${COOKIE_PREFIX}${name}`
  document.cookie = `${fullName}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;domain=${domain};path=/;SameSite=Lax`
}

/**
 * 检查cookie是否存在
 * @param name cookie名称（会自动添加前缀）
 * @returns 如果cookie存在返回true，否则返回false
 */
export function hasCookie(name: string): boolean {
  return getCookie(name) !== ''
}
