import type {AxiosResponse} from "axios";
import type {
  AigcModelChatMsg,
  AigcSumUsageVo, AigcUsageMonthVo, AigcUsageQuery, AigcUsageRecordVo, AudioMessageVo, AudioModelBo,
  ChatConversationVo,
  ChatMessageVo,
  ChatModelBo, ImageMessageVo,
  ImageModelBo, VideoMessageVo, VideoModelBo
} from "@/api/ai/aigc/types.ts";
import api from "@/utils/axios.ts";

/**
 * 对话管理-对话接口
 */
export function chatApi(data: ChatModelBo): Promise<AxiosResponse<AigcModelChatMsg>> {
  return api({
    url: '/v1/chat',
    method: 'post',
    data: data,
  });
}

/**
 * 对话管理-对话窗口分页列表
 */
export function chatConversationPageApi(data: any): Promise<AxiosResponse<PageResult<ChatConversationVo>>> {
  return api({
    url: '/chat/conversation/page',
    method: 'post',
    data,
  })
}

/**
 * 对话管理-详情
 */
export function chatConversationDetailApi(conversationId: string): Promise<AxiosResponse<ChatConversationVo>> {
  return api({
    url: '/chat/conversation/detail/' + conversationId,
    method: 'post'
  });
}

/**
 * 对话管理-修改对话窗口
 */
export function chatConversationUpdateApi(conversationId: string, title: string): Promise<AxiosResponse<boolean>> {
  return api({
    url: '/chat/conversation/update',
    method: 'post',
    data: {
      id: conversationId,
      title,
    },
  })
}

/**
 * 对话管理-修改对话窗口
 */
export function chatConversationDeleteApi(conversationId: string): Promise<AxiosResponse<boolean>> {
  return api({
    url: '/chat/conversation/delete',
    method: 'post',
    data: [conversationId],
  });
}

/**
 * 对话管理-清除对话窗口
 */
export function chatConversationClearApi() {
  return api({
    url: '/chat/conversation/clear',
    method: 'post',
  });
}

/**
 * 对话管理-对话消息分页列表
 */
export function chatMessagePageApi(data: any): Promise<AxiosResponse<PageResult<ChatMessageVo>>> {
  return api({
    url: '/aigc/chat/message/page',
    method: 'post',
    data,
  });
}

/**
 * 绘画管理-分页列表
 */
export function imageMessagePageApi(data: any): Promise<AxiosResponse<PageResult<ImageMessageVo>>> {
  return api({
    url: '/aigc/image/message/page',
    method: 'post',
    data,
  });
}

/**
 * 视频管理-分页列表
 */
export function videoMessagePageApi(data: any): Promise<AxiosResponse<PageResult<VideoMessageVo>>> {
  return api({
    url: '/aigc/video/message/page',
    method: 'post',
    data,
  });
}

/**
 * 音频管理-分页列表
 */
export function audioMessagePageApi(data: any): Promise<AxiosResponse<PageResult<AudioMessageVo>>> {
  return api({
    url: '/aigc/audio/message/page',
    method: 'post',
    data,
  });
}

/**
 * 图片接口
 */
export function imageApi(data: ImageModelBo): Promise<AxiosResponse<string[]>> {
  return api({
    url: '/v1/image',
    method: 'post',
    data: data,
  });
}

/**
 * 音频接口
 */
export function audioApi(data: AudioModelBo) {
  return api({
    url: '/v1/audio',
    method: 'post',
    data: data,
  });
}

/**
 * 视频接口
 */
export function videoApi(data: VideoModelBo) {
  return api({
    url: '/v1/video',
    method: 'post',
    data: data,
  });
}

/**
 * AI中心管理-用量汇总
 */
export function aigcSumUsageApi(): Promise<AxiosResponse<AigcSumUsageVo>> {
  return api({
    url: '/aigc/model/usage/summary',
    method: 'post',
  });
}

/**
 * AI中心管理-按月统计使用量
 */
export function aigcUsageByMonthApi(date: string): Promise<AxiosResponse<AigcUsageMonthVo>> {
  return api({
    url: '/aigc/model/usage/month',
    method: 'post',
    data: {
      date: date
    }
  });
}

/**
 * AI中心管理-算力用量记录分页
 */
export function aigcUsagePageApi(data: PageQuery<AigcUsageQuery>): Promise<AxiosResponse<PageResult<AigcUsageRecordVo>>> {
  return api({
    url: '/aigc/model/usage/page',
    method: 'post',
    data,
  })
}
