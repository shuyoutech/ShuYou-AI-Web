import type { AxiosResponse } from 'axios'

import api from '@/utils/axios.ts'

/**
 * 数据字典下拉框
 */
export function dictOptionsApi(dictCode: string): Promise<AxiosResponse<Options[]>> {
  return api({
    url: '/common/dict/options/' + dictCode,
    method: 'post',
  })
}

/**
 * 下载模板文件
 */
export function templateFileApi(templateType: string) {
  return api({
    url: '/common/down/template',
    method: 'post',
    data: {
      templateType,
    },
    responseType: 'blob',
  })
}
