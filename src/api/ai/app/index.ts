import type {AxiosResponse} from "axios";
import api from "@/utils/axios.ts";
import type {
  AppChatCompletionsBo,
  AppChatTestBo,
  AppQuery,
  AppBo,
  AppVo,
  AppChatConversationQuery, AppChatConversationVo
} from "@/api/ai/app/types.ts";

/**
 * 应用管理-分页
 */
export function appPageApi(data: PageQuery<AppQuery>): Promise<AxiosResponse<PageResult<AppVo>>> {
  return api({
    url: '/app/page',
    method: 'post',
    data: data
  });
}

/**
 * 应用管理-详情
 */
export function appDetailApi(appId: string): Promise<AxiosResponse<AppVo>> {
  return api({
    url: '/app/detail/' + appId,
    method: 'post'
  });
}

/**
 * 应用管理-新增
 */
export function appSaveApi(data: AppBo): Promise<AxiosResponse<string>> {
  return api({
    url: '/app/save',
    method: 'post',
    data: data
  });
}

/**
 * 应用管理-修改
 */
export function appUpdateApi(data: AppBo): Promise<AxiosResponse<boolean>> {
  return api({
    url: '/app/update',
    method: 'post',
    data: data
  });
}

/**
 * 应用管理-删除
 */
export function appDeleteApi(data: string[]): Promise<AxiosResponse<boolean>> {
  return api({
    url: '/app/delete',
    method: 'post',
    data: data
  });
}

/**
 * 应用管理-对话聊天测试
 */
export function appChatTestApi(data: AppChatTestBo) {
  return api({
    url: '/app/chat/test',
    method: 'post',
    data: data
  });
}

/**
 * 应用管理-对话聊天
 */
export function appChatCompletionsApi(data: AppChatCompletionsBo) {
  return api({
    url: '/app/chat/completions',
    method: 'post',
    data: data
  });
}

/**
 * 应用管理-对话窗口分页列表
 */
export function appChatConversationPageApi(data: PageQuery<AppChatConversationQuery>): Promise<AxiosResponse<PageResult<AppChatConversationVo>>> {
  return api({
    url: '/app/chat/conversation/page',
    method: 'post',
    data: data
  });
}


