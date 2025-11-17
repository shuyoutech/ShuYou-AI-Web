import type {AxiosResponse} from "axios";
import api from "@/utils/axios.ts";
import type {ProviderQuery, ProviderBo, ProviderVo} from "@/api/ai/provider/types.ts";

/**
 * 供应商管理-分页
 */
export function providerPageApi(data: PageQuery<ProviderQuery>): Promise<AxiosResponse<PageResult<ProviderVo>>> {
  return api({
    url: '/provider/page',
    method: 'post',
    data: data
  });
}

/**
 * 供应商管理-详情
 */
export function providerDetailApi(providerId: string): Promise<AxiosResponse<ProviderVo>> {
  return api({
    url: '/provider/detail/' + providerId,
    method: 'post'
  });
}

/**
 * 供应商管理-新增
 */
export function providerSaveApi(data: ProviderBo): Promise<AxiosResponse<string>> {
  return api({
    url: '/provider/save',
    method: 'post',
    data: data
  });
}

/**
 * 供应商管理-修改
 */
export function providerUpdateApi(data: ProviderBo): Promise<AxiosResponse<boolean>> {
  return api({
    url: '/provider/update',
    method: 'post',
    data: data
  });
}

/**
 * 供应商管理-删除
 */
export function providerDeleteApi(data: string[]): Promise<AxiosResponse<boolean>> {
  return api({
    url: '/provider/delete',
    method: 'post',
    data: data
  });
}
