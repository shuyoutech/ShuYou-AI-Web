import type {AxiosResponse} from "axios";
import api from "@/utils/axios.ts";
import type {ApiKeyBo, ApiKeyQuery, ApiKeyVo} from "@/api/ai/apikey/types.ts";

/**
 * API KEY管理-分页
 */
export function apiKeyPageApi(data: PageQuery<ApiKeyQuery>): Promise<AxiosResponse<PageResult<ApiKeyVo>>> {
  return api({
    url: '/api-key/page',
    method: 'post',
    data: data
  });
}

/**
 * API KEY管理-详情
 */
export function apiKeyDetailApi(apiKeyId: string): Promise<AxiosResponse<ApiKeyVo>> {
  return api({
    url: '/api-key/detail/' + apiKeyId,
    method: 'post'
  });
}

/**
 * API KEY管理-新增
 */
export function apiKeySaveApi(data: ApiKeyBo): Promise<AxiosResponse<string>> {
  return api({
    url: '/api-key/save',
    method: 'post',
    data: data
  });
}

/**
 * API KEY管理-修改
 */
export function apiKeyUpdateApi(data: ApiKeyBo): Promise<AxiosResponse<boolean>> {
  return api({
    url: '/api-key/update',
    method: 'post',
    data: data
  });
}

/**
 * API KEY管理-删除
 */
export function apiKeyDeleteApi(data: string[]): Promise<AxiosResponse<boolean>> {
  return api({
    url: '/api-key/delete',
    method: 'post',
    data: data
  });
}
