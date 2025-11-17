import type {AxiosResponse} from "axios";
import api from "@/utils/axios.ts";
import type {ModelQuery, ModelBo, ModelVo} from "@/api/ai/model/types.ts";

/**
 * 模型管理-分页
 */
export function modelPageApi(data: PageQuery<ModelQuery>): Promise<AxiosResponse<PageResult<ModelVo>>> {
  return api({
    url: '/model/page',
    method: 'post',
    data: data
  });
}

/**
 * 模型管理-详情
 */
export function modelDetailApi(modelId: string): Promise<AxiosResponse<ModelVo>> {
  return api({
    url: '/model/detail/' + modelId,
    method: 'post'
  });
}

/**
 * 模型管理-新增
 */
export function modelSaveApi(data: ModelBo): Promise<AxiosResponse<string>> {
  return api({
    url: '/model/save',
    method: 'post',
    data: data
  });
}

/**
 * 模型管理-修改
 */
export function modelUpdateApi(data: ModelBo): Promise<AxiosResponse<boolean>> {
  return api({
    url: '/model/update',
    method: 'post',
    data: data
  });
}

/**
 * 模型管理-删除
 */
export function modelDeleteApi(data: string[]): Promise<AxiosResponse<boolean>> {
  return api({
    url: '/model/delete',
    method: 'post',
    data: data
  });
}

/**
 * 模型管理-热门模型列表
 */
export function hotModelListApi(): Promise<AxiosResponse<ModelVo[]>> {
  return api({
    url: '/api/query/hot/data/ai_provider_model_chat',
    method: 'post'
  });
}

/**
 * 模型管理-模型树
 */
export function modelTreeApi(data: ModelQuery): Promise<AxiosResponse<Tree<ModelVo>[]>> {
  return api({
    url: '/model/tree',
    method: 'post',
    data: data
  });
}
