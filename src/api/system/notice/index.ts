import type { AxiosResponse } from 'axios'
import type { NoticeBo, NoticeQuery, NoticeVo } from '@/api/system/notice/types.ts'
import api from '@/utils/axios.ts'

/**
 * 通知公告管理-分页
 */
export function noticePageApi(data: PageQuery<NoticeQuery>): Promise<AxiosResponse<PageResult<NoticeVo>>> {
  return api({
    url: '/notice/page',
    method: 'post',
    data,
  })
}

/**
 * 通知公告管理-详情
 */
export function noticeDetailApi(noticeId: string): Promise<AxiosResponse<NoticeVo>> {
  return api({
    url: `/notice/detail/${noticeId}`,
    method: 'post',
  })
}

/**
 * 通知公告管理-新增
 */
export function noticeSaveApi(data: NoticeBo): Promise<AxiosResponse<string>> {
  return api({
    url: '/notice/save',
    method: 'post',
    data,
  })
}

/**
 * 通知公告管理-修改
 */
export function noticeUpdateApi(data: NoticeBo): Promise<AxiosResponse<boolean>> {
  return api({
    url: '/notice/update',
    method: 'post',
    data,
  })
}

/**
 * 通知公告管理-删除
 */
export function noticeDeleteApi(data: string[]): Promise<AxiosResponse<boolean>> {
  return api({
    url: '/notice/delete',
    method: 'post',
    data,
  })
}

/**
 * 通知公告管理-状态
 */
export function noticeStatusApi(data: UpdateStatusBo): Promise<AxiosResponse<boolean>> {
  return api({
    url: '/notice/status',
    method: 'post',
    data,
  })
}
