

// 是否为对象
export const isObject = (value: any) => {
  const type = typeof value;
  return value !== null && (type === "object" || type === "function");
};

// 是否为数组
export const isArray = (value: any) => {
  const _isArray =
    Array.isArray ||
    ((_arg) => Object.prototype.toString.call(_arg) === "[object Array]");
  return _isArray(value);
};

// 是否为空
export const isEmpty = (value: any) => {
  if (value === null || value === undefined || value === "") return true;
  if (isObject(value)) return Object.keys(value).length === 0;
  if (isArray(value)) return value.length === 0;
  return false;
};

// 获取baseUrl
export function getBaseUrl() {
  let baseUrl =
    window.location.href.indexOf("#") > -1
      ? window.location.href.split("#")[0]
      : window.location.href;
  return baseUrl;
}


export default {
  isEmpty,
  getBaseUrl,
};
