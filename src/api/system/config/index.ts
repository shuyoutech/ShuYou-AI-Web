import type {AxiosResponse} from "axios";
import api from "@/utils/axios.ts";
import type {ConfigQuery, ConfigBo, ConfigVo} from "@/api/system/config/types.ts";

/**
 * 参数配置管理-分页
 */
export function configPageApi(data: PageQuery<ConfigQuery>): Promise<AxiosResponse<PageResult<ConfigVo>>> {
  return api({
    url: '/config/page',
    method: 'post',
    data: data
  });
}

/**
 * 参数配置管理-详情
 */
export function configDetailApi(configId: string): Promise<AxiosResponse<ConfigVo>> {
  return api({
    url: '/config/detail/' + configId,
    method: 'post'
  });
}

/**
 * 参数配置管理-新增
 */
export function configSaveApi(data: ConfigBo): Promise<AxiosResponse<string>> {
  return api({
    url: '/config/save',
    method: 'post',
    data: data
  });
}

/**
 * 参数配置管理-修改
 */
export function configUpdateApi(data: ConfigBo): Promise<AxiosResponse<boolean>> {
  return api({
    url: '/config/update',
    method: 'post',
    data: data
  });
}

/**
 * 参数配置管理-删除
 */
export function configDeleteApi(data: string[]): Promise<AxiosResponse<boolean>> {
  return api({
    url: '/config/delete',
    method: 'post',
    data: data
  });
}
