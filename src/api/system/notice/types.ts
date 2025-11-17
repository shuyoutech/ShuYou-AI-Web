/**
 * 通知公告查询参数
 */
export interface NoticeQuery {
  type?: string
  title?: string
}

/**
 * 通知公告详情
 */
export interface NoticeVo {
  id: string
  status: string
  type: string // 公告类型
  title: string // 公告标题
  content: string // 公告内容
}

/**
 * 通知公告新增对象
 */
export interface NoticeBo {
  id?: string
  status?: string
  type?: string // 公告类型
  title?: string // 公告标题
  content?: string // 公告内容
}
