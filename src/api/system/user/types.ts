/**
 * 用户查询参数
 */
export interface UserQuery {
  status?: string;
  username?: string;
  nickname?: string;
  name?: string;
  mobile?: string;
  email?: string;
  roleId?: string;
  neRoleId?: string;
  roleIds?: string[];
  orgId?: number;
  orgIds?: number[];
}

/**
 * 用户详情
 */
export interface UserVo {
  id?: string;
  createTime?: string;
  status?: string;
  statusName?: string;
  username?: string;
  nickname?: string;
  name?: string;
  mobile?: string;
  email?: string;
  avatar?: string;
  sex?: string;
  sexName?: string;
  orgId?: number;
  orgName?: string;
  address?: string;
  roleIds?: string[];
  roleNames?: string;
  postIds?: string[];
  postNames?: string;
  loginIp?: string;
  loginLocation?: string;
  loginDate?: string;
}

/**
 * 用户新增对象
 */
export interface UserBo {
  id?: string;
  status?: string;
  username?: string;
  password?: string;
  nickname?: string;
  name?: string;
  mobile?: string;
  email?: string;
  avatar?: string;
  sex?: string;
  orgId?: number;
  address?: string;
  roleIds?: string[];
  postIds?: string[];
}

/**
 * 用户个人信息对象
 */
export interface UserProfileBo {
  nickname: string;
  mobile: string;
  email: string;
  sex: string;
  address: string;
}

