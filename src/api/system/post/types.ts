/**
 * 岗位查询参数
 */
export interface PostQuery {
  name?: string;
  code?: string;
}

/**
 * 岗位详情
 */
export interface PostVo {
  id: string;
  status: string;
  code: string; //岗位编码
  name: string; //岗位名称
  sort: number; //岗位排序
  remark: string; //岗位描述
}

/**
 * 岗位新增对象
 */
export interface PostBo {
  id?: string;
  status?: string;
  code?: string; //岗位编码
  name?: string; //岗位名称
  sort?: number; //岗位排序
  remark?: string; //岗位描述
}
