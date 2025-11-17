import api from '@/utils/axios.ts'

import type {AxiosResponse} from "axios"
import type {GameVo} from "@/api/game/types.ts";

/**
 * 游戏管理-获取热门游戏列表
 */
export function gameHotListApi(): Promise<AxiosResponse<GameVo[]>> {
  return api({
    url: '/api/game/hot-list',
    method: 'post',
  });
}
