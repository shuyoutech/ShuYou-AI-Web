import type {AigcPromptQuery, AigcPromptVo} from "@/api/ai/prompt/types.ts";
import api from "@/utils/axios.ts";
import type {AxiosResponse} from "axios";

/**
 * 提示词模板管理-分页
 */
export function promptPageApi(data: PageQuery<AigcPromptQuery>): Promise<AxiosResponse<PageResult<AigcPromptVo>>> {
  return api({
    url: '/aigc/prompt/template/page',
    method: 'post',
    data: data
  });
}
