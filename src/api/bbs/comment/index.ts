import type {AxiosResponse} from "axios";
import api from "@/utils/axios.ts";
import type {PostCommentQuery, PostCommentVo} from "@/api/bbs/comment/types.ts";

/**
 * 帖子评论管理-评论分页列表
 */
export function commentPageApi(data: PageQuery<PostCommentQuery>): Promise<AxiosResponse<PageResult<Tree<PostCommentVo>>>> {
  return api({
    url: '/bbs/comment/page',
    method: 'post',
    data: data
  });
}

/**
 * 帖子评论管理-点赞评论
 */
export function commentLikeApi(commentId: string) {
  return api({
    url: '/bbs/comment/like/' + commentId,
    method: 'post'
  });
}

/**
 * 帖子评论管理-取消点赞评论
 */
export function commentUnlikeApi(commentId: string) {
  return api({
    url: '/bbs/comment/unlike/' + commentId,
    method: 'post'
  });
}


/**
 * 帖子评论管理-删除评论
 */
export function commentDeleteApi(commentId: string) {
  return api({
    url: '/bbs/comment/delete',
    method: 'post',
    data: [commentId],
  });
}
