import api from '@/utils/axios.ts'

import type {AxiosResponse} from "axios"
import type {
  OrgQuery, OrgBo, OrgVo,
} from "@/api/system/org/types.ts";

/**
 * 机构管理-机构树
 */
export function orgTreeApi(data: OrgQuery): Promise<AxiosResponse<Tree<OrgVo>[]>> {
  return api({
    url: '/org/tree',
    method: 'post',
    data: data
  });
}

/**
 * 机构管理-分页
 */
export function orgPageApi(data: PageQuery<OrgQuery>): Promise<AxiosResponse<PageResult<OrgVo>>> {
  return api({
    url: '/org/page',
    method: 'post',
    data: data
  });
}

/**
 * 机构管理-详情
 */
export function orgDetailApi(orgId: number): Promise<AxiosResponse<OrgVo>> {
  return api({
    url: '/org/detail/' + orgId,
    method: 'post'
  });
}

/**
 * 机构管理-新增
 */
export function orgSaveApi(data: OrgBo): Promise<AxiosResponse<number>> {
  return api({
    url: '/org/save',
    method: 'post',
    data: data
  });
}

/**
 * 机构管理-修改
 */
export function orgUpdateApi(data: OrgBo): Promise<AxiosResponse<boolean>> {
  return api({
    url: '/org/update',
    method: 'post',
    data: data
  });
}

/**
 * 机构管理-删除
 */
export function orgDeleteApi(data: number[]): Promise<AxiosResponse<boolean>> {
  return api({
    url: '/org/delete',
    method: 'post',
    data: data
  });
}

/**
 * 机构管理-状态修改
 */
export function orgStatusApi(data: UpdateStatusBo): Promise<AxiosResponse<boolean>> {
  return api({
    url: '/org/status',
    method: 'post',
    data: data
  });
}

