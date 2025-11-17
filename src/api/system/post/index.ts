import type {AxiosResponse} from "axios";
import api from "@/utils/axios.ts";
import type {PostQuery, PostBo, PostVo} from "@/api/system/post/types.ts";

/**
 * 岗位管理-分页
 */
export function postPageApi(data: PageQuery<PostQuery>): Promise<AxiosResponse<PageResult<PostVo>>> {
  return api({
    url: '/post/page',
    method: 'post',
    data: data
  });
}

/**
 * 岗位管理-详情
 */
export function postDetailApi(postId: string): Promise<AxiosResponse<PostVo>> {
  return api({
    url: '/post/detail/' + postId,
    method: 'post'
  });
}

/**
 * 岗位管理-新增
 */
export function postSaveApi(data: PostBo): Promise<AxiosResponse<string>> {
  return api({
    url: '/post/save',
    method: 'post',
    data: data
  });
}

/**
 * 岗位管理-修改
 */
export function postUpdateApi(data: PostBo): Promise<AxiosResponse<boolean>> {
  return api({
    url: '/post/update',
    method: 'post',
    data: data
  });
}

/**
 * 岗位管理-删除
 */
export function postDeleteApi(data: string[]): Promise<AxiosResponse<boolean>> {
  return api({
    url: '/post/delete',
    method: 'post',
    data: data
  });
}
