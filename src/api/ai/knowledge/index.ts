import type {AxiosResponse} from "axios";
import api from "@/utils/axios.ts";
import type {
  KnowledgeDocQuery,
  KnowledgeDocBo,
  KnowledgeDocSliceQuery,
  KnowledgeDocSliceBo,
  KnowledgeDocSliceVo,
  KnowledgeDocVo,
  KnowledgeQuery,
  KnowledgeBo,
  KnowledgeVo
} from "@/api/ai/knowledge/types.ts";

/**
 * 知识库管理-分页
 */
export function knowledgePageApi(data: PageQuery<KnowledgeQuery>): Promise<AxiosResponse<PageResult<KnowledgeVo>>> {
  return api({
    url: '/knowledge/page',
    method: 'post',
    data: data
  });
}

/**
 * 知识库管理-详情
 */
export function knowledgeDetailApi(knowledgeId: string): Promise<AxiosResponse<KnowledgeVo>> {
  return api({
    url: '/knowledge/detail/' + knowledgeId,
    method: 'post'
  });
}

/**
 * 知识库管理-新增
 */
export function knowledgeSaveApi(data: KnowledgeBo): Promise<AxiosResponse<string>> {
  return api({
    url: '/knowledge/save',
    method: 'post',
    data: data
  });
}

/**
 * 知识库管理-修改
 */
export function knowledgeUpdateApi(data: KnowledgeBo): Promise<AxiosResponse<boolean>> {
  return api({
    url: '/knowledge/update',
    method: 'post',
    data: data
  });
}

/**
 * 知识库管理-删除
 */
export function knowledgeDeleteApi(data: string[]): Promise<AxiosResponse<boolean>> {
  return api({
    url: '/knowledge/delete',
    method: 'post',
    data: data
  });
}

/**
 * 知识库文档管理-分页
 */
export function knowledgeDocPageApi(data: PageQuery<KnowledgeDocQuery>): Promise<AxiosResponse<PageResult<KnowledgeDocVo>>> {
  return api({
    url: '/knowledge/doc/page',
    method: 'post',
    data: data
  });
}

/**
 * 知识库文档管理-详情
 */
export function knowledgeDocDetailApi(knowledgeDocId: string): Promise<AxiosResponse<KnowledgeDocVo>> {
  return api({
    url: '/knowledge/doc/detail/' + knowledgeDocId,
    method: 'post'
  });
}

/**
 * 知识库文档管理-新增
 */
export function knowledgeDocSaveApi(data: KnowledgeDocBo): Promise<AxiosResponse<string>> {
  return api({
    url: '/knowledge/doc/save',
    method: 'post',
    data: data
  });
}

/**
 * 知识库文档管理-修改
 */
export function knowledgeDocUpdateApi(data: KnowledgeDocBo): Promise<AxiosResponse<boolean>> {
  return api({
    url: '/knowledge/doc/update',
    method: 'post',
    data: data
  });
}

/**
 * 知识库文档管理-删除
 */
export function knowledgeDocDeleteApi(data: string[]): Promise<AxiosResponse<boolean>> {
  return api({
    url: '/knowledge/doc/delete',
    method: 'post',
    data: data
  });
}

/**
 * 知识库文档切片管理-分页
 */
export function knowledgeDocSlicePageApi(data: PageQuery<KnowledgeDocSliceQuery>): Promise<AxiosResponse<PageResult<KnowledgeDocSliceVo>>> {
  return api({
    url: '/knowledge/doc/slice/page',
    method: 'post',
    data: data
  });
}

/**
 * 知识库文档切片管理-详情
 */
export function knowledgeDocSliceDetailApi(knowledgeDocSliceId: string): Promise<AxiosResponse<KnowledgeDocSliceVo>> {
  return api({
    url: '/knowledge/doc/slice/detail/' + knowledgeDocSliceId,
    method: 'post'
  });
}

/**
 * 知识库文档切片管理-新增
 */
export function knowledgeDocSliceSaveApi(data: KnowledgeDocSliceBo): Promise<AxiosResponse<string>> {
  return api({
    url: '/knowledge/doc/slice/save',
    method: 'post',
    data: data
  });
}

/**
 * 知识库文档切片管理-修改
 */
export function knowledgeDocSliceUpdateApi(data: KnowledgeDocSliceBo): Promise<AxiosResponse<boolean>> {
  return api({
    url: '/knowledge/doc/slice/update',
    method: 'post',
    data: data
  });
}

/**
 * 知识库文档切片管理-删除
 */
export function knowledgeDocSliceDeleteApi(data: string[]): Promise<AxiosResponse<boolean>> {
  return api({
    url: '/knowledge/doc/slice/delete',
    method: 'post',
    data: data
  });
}

