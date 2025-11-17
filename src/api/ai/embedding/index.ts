import type {AxiosResponse} from "axios";
import api from "@/utils/axios.ts";
import type {
  EmbeddingFileBo,
  EmbeddingSearchBo,
  EmbeddingSearchVo,
  EmbeddingTextBo
} from "@/api/ai/embedding/types.ts";

/**
 * 文档向量化管理-导入知识库文本
 */
export function embeddingTextApi(data: EmbeddingTextBo) {
  return api({
    url: '/embedding/text',
    method: 'post',
    data: data
  });
}

/**
 * 文档向量化管理-导入知识库文件
 */
export function embeddingFileApi(data: EmbeddingFileBo) {
  return api({
    url: '/embedding/file',
    method: 'post',
    data: data
  });
}

/**
 * 文档向量化管理-检索知识库文档
 */
export function embeddingSearchApi(data: EmbeddingSearchBo): Promise<AxiosResponse<EmbeddingSearchVo>> {
  return api({
    url: '/embedding/search',
    method: 'post',
    data: data
  });
}
