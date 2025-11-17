/**
 * 角色查询参数
 */
export interface RoleQuery {
  code?: string;
  name?: string;
}

/**
 * 角色详情
 */
export interface RoleVo {
  id: string;
  createTime: string;
  status: string;
  statusName: string;
  code: string;
  name: string;
  sort: number;
  remark: string;
  dataScope: string;
  menuIds: number[];
  orgIds: number[];
}

/**
 * 角色新增对象
 */
export interface RoleBo {
  id?: string;
  status?: string;
  code?: string;
  name?: string;
  sort?: number;
  remark?: string;
  dataScope?: string;
  menuIds?: number[];
  orgIds?: number[];
}

export interface CancelGrantUserBo {
  roleId: string; //角色ID
  userId: string; //用户ID
}

export interface BatchGrantUserBo {
  roleId: string; //角色ID
  userIds: string[]; //用户IDS
}

export interface BatchGrantMenuBo {
  roleId: string; //角色ID
  menuIds: number[]; //菜单IDS
}


