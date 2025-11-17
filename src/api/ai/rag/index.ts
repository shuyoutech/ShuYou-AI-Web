import type {AxiosResponse} from "axios";
import api from "@/utils/axios.ts";
import type {
  RagAppQuery, RagAppVo,
  RagDataQuery, RagDataSearchBo, RagDataVo, RagDocImportBo, RagDocPreviewBo,
  RagKnowledgeBo,
  RagKnowledgeDocQuery,
  RagKnowledgeDocVo,
  RagKnowledgeQuery,
  RagKnowledgeVo
} from "@/api/ai/rag/types.ts";

/**
 * 知识库管理-分页
 */
export function ragKnowledgePageApi(data: PageQuery<RagKnowledgeQuery>): Promise<AxiosResponse<PageResult<RagKnowledgeVo>>> {
  return api({
    url: '/aigc/rag/knowledge/page',
    method: 'post',
    data: data
  });
}

/**
 * 知识库管理-详情
 */
export function ragKnowledgeDetailApi(knowledgeId: string): Promise<AxiosResponse<RagKnowledgeVo>> {
  return api({
    url: '/aigc/rag/knowledge/detail/' + knowledgeId,
    method: 'post'
  });
}

/**
 * 知识库管理-新增
 */
export function ragKnowledgeSaveApi(data: RagKnowledgeBo): Promise<AxiosResponse<string>> {
  return api({
    url: '/aigc/rag/knowledge/save',
    method: 'post',
    data: data
  });
}

/**
 * 知识库管理-修改
 */
export function ragKnowledgeUpdateApi(data: RagKnowledgeBo): Promise<AxiosResponse<boolean>> {
  return api({
    url: '/aigc/rag/knowledge/update',
    method: 'post',
    data: data
  });
}

/**
 * 知识库管理-删除
 */
export function ragKnowledgeDeleteApi(data: string[]): Promise<AxiosResponse<boolean>> {
  return api({
    url: '/aigc/rag/knowledge/delete',
    method: 'post',
    data: data
  });
}

/**
 * 知识库文档管理-分页
 */
export function ragKnowledgeDocPageApi(data: PageQuery<RagKnowledgeDocQuery>): Promise<AxiosResponse<PageResult<RagKnowledgeDocVo>>> {
  return api({
    url: '/aigc/rag/document/page',
    method: 'post',
    data: data
  });
}

/**
 * 知识库文档切片管理-分页
 */
export function ragKnowledgeDataPageApi(data: PageQuery<RagDataQuery>): Promise<AxiosResponse<PageResult<RagDataVo>>> {
  return api({
    url: '/aigc/rag/data/page',
    method: 'post',
    data: data
  });
}

/**
 * 预览知识库文档
 */
export function ragKnowledgeDocPreviewApi(data: RagDocPreviewBo): Promise<AxiosResponse<any>> {
  return api({
    url: '/aigc/rag/document/preview',
    method: 'post',
    data: data
  });
}

/**
 * 导入知识库文档
 */
export function ragKnowledgeDocImportApi(data: RagDocImportBo): Promise<AxiosResponse<any>> {
  return api({
    url: '/aigc/rag/document/import',
    method: 'post',
    data: data
  });
}

/**
 * 检索知识库文档
 */
export function ragDataSearchApi(data: RagDataSearchBo): Promise<AxiosResponse<any[]>> {
  return api({
    url: '/aigc/rag/data/search',
    method: 'post',
    data: data
  });
}

/**
 * RAG应用-分页
 */
export function ragAppPageApi(data: PageQuery<RagAppQuery>): Promise<AxiosResponse<PageResult<RagAppVo>>> {
  return api({
    url: '/aigc/rag/app/page',
    method: 'post',
    data: data
  });
}

/**
 * RAG应用-详情
 */
export function ragAppDetailApi(appId: string): Promise<AxiosResponse<RagAppVo>> {
  return api({
    url: '/aigc/rag/app/detail/' + appId,
    method: 'post'
  });
}


/**
 * RAG应用-新增
 */
export function ragAppSaveApi(data: RagAppBo): Promise<AxiosResponse<string>> {
  return api({
    url: '/aigc/rag/app/save',
    method: 'post',
    data: data
  });
}

/**
 * RAG应用-修改
 */
export function ragAppUpdateApi(data: RagAppBo): Promise<AxiosResponse<boolean>> {
  return api({
    url: '/aigc/rag/app/update',
    method: 'post',
    data: data
  });
}

/**
 * RAG应用-删除
 */
export function ragAppDeleteApi(data: string[]): Promise<AxiosResponse<boolean>> {
  return api({
    url: '/aigc/rag/app/delete',
    method: 'post',
    data: data
  });
}
