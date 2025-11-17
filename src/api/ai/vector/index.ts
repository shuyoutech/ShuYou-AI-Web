import type {AxiosResponse} from "axios";
import api from "@/utils/axios.ts";
import type {VectorQuery, VectorBo, VectorVo} from "@/api/ai/vector/types.ts";

/**
 * 向量数据库管理-分页
 */
export function vectorPageApi(data: PageQuery<VectorQuery>): Promise<AxiosResponse<PageResult<VectorVo>>> {
  return api({
    url: '/vector/page',
    method: 'post',
    data: data
  });
}

/**
 * 向量数据库管理-详情
 */
export function vectorDetailApi(vectorId: string): Promise<AxiosResponse<VectorVo>> {
  return api({
    url: '/vector/detail/' + vectorId,
    method: 'post'
  });
}

/**
 * 向量数据库管理-新增
 */
export function vectorSaveApi(data: VectorBo): Promise<AxiosResponse<string>> {
  return api({
    url: '/vector/save',
    method: 'post',
    data: data
  });
}

/**
 * 向量数据库管理-修改
 */
export function vectorUpdateApi(data: VectorBo): Promise<AxiosResponse<boolean>> {
  return api({
    url: '/vector/update',
    method: 'post',
    data: data
  });
}

/**
 * 向量数据库管理-删除
 */
export function vectorDeleteApi(data: string[]): Promise<AxiosResponse<boolean>> {
  return api({
    url: '/vector/delete',
    method: 'post',
    data: data
  });
}

/**
 * 向量数据库管理-连接数据库是否正常
 */
export function vectorConnectApi(vectorId: string): Promise<AxiosResponse<boolean>> {
  return api({
    url: '/vector/connect' + vectorId,
    method: 'post',
  });
}

