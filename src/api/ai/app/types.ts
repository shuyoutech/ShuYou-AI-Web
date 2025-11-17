import type {KnowledgeVo} from '@/api/ai/knowledge/types.ts'
import type {ModelVo} from '@/api/ai/model/types.ts'

/**
 * 应用查询参数
 */
export interface AppQuery {
  name?: string // 应用名称
}

/**
 * 应用详情
 */
export interface AppVo {
  id: string // 应用ID
  type: string // 应用类型
  typeName: string // 应用类型
  name: string // 应用名称
  icon: string // 应用图标
  remark: string // 应用描述
  chatModelId: string// 对话模型ID
  chatModel: ModelVo
  knowledgeId: string// 知识库ID
  knowledge: KnowledgeVo
  promptText: string // 提示词
}

/**
 * 应用新增对象
 */
export interface AppBo {
  id?: string // 应用ID
  type?: string // 应用类型
  name?: string // 应用名称
  icon?: string // 应用图标
  remark?: string // 应用描述
  chatModelId?: string// 对话模型ID
  knowledgeId?: string// 知识库ID
  promptText?: string // 提示词
}

export interface AppChatTestBo {
  appId: string // 应用ID
  chatModelId: string // 对话模型ID
  knowledgeId: string // 知识库ID
  promptText: string // 提示词
  conversationId?: string // 会话ID
  messages: AppChatMessage[]// 消息列表
}

export interface AppChatMessage {
  type?: string // 消息类型
  content?: string // 消息内容
  imageUrl?: string// 图片地址
  audioUrl?: string// 音频地址
}

export interface AppChatCompletionsBo {
  appId: string // 应用ID
  conversationId?: string // 会话ID
  role: string // 角色
  messages: AppChatMessage[]// 消息列表
}

/**
 * 应用对话窗口查询参数
 */
export interface AppChatConversationQuery {
  appId?: string // 应用ID
}

/**
 * 应用对话窗口详情
 */
export interface AppChatConversationVo {
  id: string // 应用ID
  appId: string // 应用ID
  title: string // 标题
  source: string // 来源
  sourceName: string // 来源名称
}
