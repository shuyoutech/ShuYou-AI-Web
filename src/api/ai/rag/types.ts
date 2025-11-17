import {ragKnowledgeDocPreviewApi} from "@/api/ai/rag/index.ts";
import type {ModelVo} from "@/api/ai/model/types.ts";
import type {KnowledgeVo} from "@/api/ai/knowledge/types.ts";

/**
 * 知识库查询参数
 */
export interface RagKnowledgeQuery {
  name?: string // 知识库名称
  type?: string // 知识库类型
}

/**
 * 知识库详情
 */
export interface RagKnowledgeVo {
  id: string // 知识库ID
  createTime: string // 创建时间
  name: string // 知识库名称
  type: string // 知识库类型
  remark: string // 知识库描述
  dataSourceId: string //向量数据库ID
  dataSourceName: string // 向量数据库名称
  searchConfigJson: string //搜索配置
  tableConfigJson: string //表数据配置
}

/**
 * 知识库新增对象
 */
export interface RagKnowledgeBo {
  id?: string
  name?: string // 知识库名称
  type?: string // 知识库类型
  remark?: string //
  tableConfig?: RagKnowledgeTableConfig[] //
  searchConfigJson?: string
}

export interface RagKnowledgeTableConfig {
  key?: string
  name?: string
  type?: string
  enableSearch?: boolean
  enableLlm?: boolean
}

/**
 * 知识库文档查询参数
 */
export interface RagKnowledgeDocQuery {
  knowledgeId?: string// 知识库ID
  name?: string // 文档名称
}

/**
 * 知识库文档详情
 */
export interface RagKnowledgeDocVo {
  id: string // 知识库文档ID
  createTime: string // 创建时间
  knowledgeId: string// 知识库ID
  type: string // 文档类型
  name: string // 文档名称
  fileId: string // 文件ID
  fileType: string //
  fileSize: string //
  status: string// 切片状态
  chunkNum: number // 切片数量
}

/**
 * 知识库文档新增对象
 */
export interface RagKnowledgeDocBo {
  id?: string // 知识库文档ID
  knowledgeId?: string// 知识库ID
  docName?: string // 文档名称
  docFileId?: string // 文件ID
  docContent?: string // 文档内容
  sliceStatus?: string// 切片状态
  sliceNum?: number // 切片数量
}

/**
 * 知识库文档切片查询参数
 */
export interface RagDataQuery {
  knowledgeId?: string // 知识库ID
  docId?: string // 文档ID
}

/**
 * 知识库文档切片详情
 */
export interface RagDataVo {
  id: string // 知识库文档切片ID
  createTime: string // 创建时间
  knowledgeId: string// 知识库ID
  docId: string // 文档ID
  content: string // 切片内容
  metadata: string // 结构化数据  {"name":"Java","remark":"Java"}
  chunkIndex: number//
  vectorId: string // 向量库的ID
}

export interface RagDocPreviewBo {
  knowledgeId?: string// 知识库ID
  fileIds?: string[]
  chunkSplitMode?: string
  maxSegmentSize?: number
  maxOverlapSize?: number
  regex?: string
}

export interface RagDocImportBo {
  knowledgeId?: string// 知识库ID
  files?: RagDocImportFile[]
}

export interface RagDocImportFile {
  fileName?: string
  fileId?: string
  fileType?: string
  fileSize?: string
  texts?: string[]
  tableRows?: any[]
}


export interface RagDataSearchBo {
  knowledgeId?: string// 知识库ID
  text?: string
}


/**
 * 应用查询参数
 */
export interface RagAppQuery {
  name?: string // 应用名称
}

/**
 * 应用详情
 */
export interface RagAppVo {
  id?: string // 应用ID
  name?: string // 应用名称
  icon?: string // 应用图标
  remark?: string // 应用描述
  chatModelId?: string// 对话模型ID
  chatModel?: ModelVo //模型对象
  chatModelConfigJson?: string // 对话模型配置
  knowledgeId?: string// 知识库ID
  knowledge?: RagKnowledgeVo //知识库对象
}

/**
 * 应用新增对象
 */
export interface RagAppBo {
  id?: string // 应用ID
  name?: string // 应用名称
  icon?: string // 应用图标
  remark?: string // 应用描述
  chatModelId?: string// 对话模型ID
  chatModelConfigJson?: string // 对话模型配置
  knowledgeId?: string// 知识库ID
}

