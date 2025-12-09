import type {AxiosResponse} from "axios";
import api from "@/utils/axios.ts";

/**
 * 通用查询热点数据
 * type = ai_provider_chat 热门对话供应商 ProviderVo
 * type = ai_model_chat 热门对话模型 ModelVo
 * type = dict_*** 数据字典数据 OptionVo
 * @param type
 */
export function queryHotDataApi<T>(type: string): Promise<AxiosResponse<T[]>> {
  return api({
    url: '/api/query/hot/data/' + type,
    method: 'post',
  })
}

/**
 * 建议接口
 */
export function suggestApi(content: string) {
  return api({
    url: '/api/suggest',
    method: 'post',
    data: {
      content
    },
  })
}

