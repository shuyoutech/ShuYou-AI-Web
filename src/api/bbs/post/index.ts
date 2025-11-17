import type {AxiosResponse} from "axios";
import api from "@/utils/axios.ts";
import type {PostQuery, PostReviewBo, PostSaveBo, PostUpdateBo, PostVo} from "@/api/bbs/post/types.ts";

/**
 * 帖子管理-分页
 */
export function postPageApi(data: PageQuery<PostQuery>): Promise<AxiosResponse<PageResult<PostVo>>> {
  return api({
    url: '/bbs/post/page',
    method: 'post',
    data: data,
  });
}

/**
 * 帖子管理-详情
 */
export function postDetailApi(postId: string): Promise<AxiosResponse<PostVo>> {
  return api({
    url: '/bbs/post/detail/' + postId,
    method: 'post'
  });
}

/**
 * 帖子管理-新增
 */
export function postSaveApi(data: PostSaveBo): Promise<AxiosResponse<string>> {
  return api({
    url: '/bbs/post/save',
    method: 'post',
    data: data
  });
}

/**
 * 帖子管理-修改
 */
export function postUpdateApi(data: PostUpdateBo): Promise<AxiosResponse<boolean>> {
  return api({
    url: '/bbs/post/update',
    method: 'post',
    data: data
  });
}

/**
 * 帖子管理-删除
 */
export function postDeleteApi(data: string[]): Promise<AxiosResponse<boolean>> {
  return api({
    url: '/bbs/post/delete',
    method: 'post',
    data: data
  });
}

/**
 * 帖子管理-审核帖子
 */
export function postReviewApi(data: PostReviewBo) {
  return api({
    url: '/bbs/post/review',
    method: 'post',
    data: data
  });
}

/**
 * 帖子管理-评论帖子
 */
export function postCommentApi(postId: string, commentContent: string) {
  return api({
    url: '/bbs/post/comment',
    method: 'post',
    data: {
      postId: postId,
      commentContent: commentContent,
    }
  });
}

/**
 * 帖子管理-回复帖子
 */
export function postReplyApi(postId: string, commentId: string, replyContent: string) {
  return api({
    url: '/bbs/post/reply',
    method: 'post',
    data: {
      postId: postId,
      commentId: commentId,
      replyContent: replyContent,
    }
  });
}

/**
 * 帖子管理-点赞帖子
 */
export function postLikeApi(postId: string) {
  return api({
    url: '/bbs/post/like/' + postId,
    method: 'post'
  });
}

/**
 * 帖子管理-取消点赞帖子
 */
export function postUnlikeApi(postId: string) {
  return api({
    url: '/bbs/post/unlike/' + postId,
    method: 'post'
  });
}
