/**
 * 机构查询参数
 */
export interface OrgQuery {
  status?: string;
  parentId?: number;
  type?: string;
  name?: string;
}

/**
 * 机构详情
 */
export interface OrgVo {
  id: number;
  rootId: number;
  parentId: number;
  treePath: string;
  treeLevel: number;
  createTime: string;
  status: string;
  statusName: string;
  type: string;
  typeName: string;
  name: string;
  sort: number;
  directorId: string;
  directorName: string;
}

/**
 * 机构新增对象
 */
export interface OrgBo {
  id?: number;
  status?: string;
  parentId?: number;
  type?: string;
  name?: string;
  sort?: string;
  directorId?: string;
}
