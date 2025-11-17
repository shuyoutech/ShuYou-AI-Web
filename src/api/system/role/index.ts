import api from '@/utils/axios.ts'

import type {AxiosResponse} from "axios"
import type {
  BatchGrantMenuBo, BatchGrantUserBo,
  CancelGrantUserBo,
  RoleQuery,
  RoleBo,
  RoleVo
} from "@/api/system/role/types.ts";
import type {UserQuery, UserVo} from "@/api/system/user/types.ts";

/**
 * 角色管理-分页
 */
export function rolePageApi(data: PageQuery<RoleQuery>): Promise<AxiosResponse<PageResult<RoleVo>>> {
  return api({
    url: '/role/page',
    method: 'post',
    data: data
  });
}

/**
 * 角色管理-详情
 */
export function roleDetailApi(roleId: string): Promise<AxiosResponse<RoleVo>> {
  return api({
    url: '/role/detail/' + roleId,
    method: 'post'
  });
}


/**
 * 角色管理-新增
 */
export function roleSaveApi(data: RoleBo): Promise<AxiosResponse<string>> {
  return api({
    url: '/role/save',
    method: 'post',
    data: data
  });
}

/**
 * 角色管理-修改
 */
export function roleUpdateApi(data: RoleBo): Promise<AxiosResponse<boolean>> {
  return api({
    url: '/role/update',
    method: 'post',
    data: data
  });
}

/**
 * 角色管理-删除
 */
export function roleDeleteApi(data: string[]): Promise<AxiosResponse<boolean>> {
  return api({
    url: '/role/delete',
    method: 'post',
    data: data
  });
}

/**
 * 角色管理-状态
 */
export function roleStatusApi(data: UpdateStatusBo): Promise<AxiosResponse<boolean>> {
  return api({
    url: '/role/status',
    method: 'post',
    data: data
  });
}

/**
 * 角色管理-查询已授权用户列表
 */
export function roleGrantUserListApi(data: PageQuery<UserQuery>): Promise<AxiosResponse<PageResult<UserVo>>> {
  return api({
    url: '/role/grant-user-list',
    method: 'post',
    data: data
  });
}

/**
 * 角色管理-查询未授权用户列表
 */
export function roleUngrantUserListApi(data: PageQuery<UserQuery>): Promise<AxiosResponse<PageResult<UserVo>>> {
  return api({
    url: '/role/ungrant-user-list',
    method: 'post',
    data: data
  });
}

/**
 * 角色管理-取消授权用户
 */
export function roleCancelGrantUserApi(data: CancelGrantUserBo) {
  return api({
    url: '/role/cancel-grant-user',
    method: 'post',
    data: data
  });
}

/**
 * 角色管理-批量取消授权用户
 */
export function roleBatchCancelGrantUserApi(data: BatchGrantUserBo) {
  return api({
    url: '/role/batch-cancel-grant-user',
    method: 'post',
    data: data
  });
}

/**
 * 角色管理-批量授权用户
 */
export function roleBatchGrantUserApi(data: BatchGrantUserBo) {
  return api({
    url: '/role/batch-grant-user',
    method: 'post',
    data: data
  });
}

/**
 * 角色管理-批量授权菜单
 */
export function roleBatchGrantMenuApi(data: BatchGrantMenuBo) {
  return api({
    url: '/role/batch-grant-menu',
    method: 'post',
    data: data
  });
}
