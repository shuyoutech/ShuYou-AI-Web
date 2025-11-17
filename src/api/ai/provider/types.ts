/**
 * 供应商查询参数
 */
export interface ProviderQuery {
  code?: string; //供应商编码
  name?: string; //供应商名称
  status?: string;//供应商状态
}

/**
 * 供应商详情
 */
export interface ProviderVo {
  id: string;   //供应商ID
  code: string; //供应商编码
  name: string; //供应商名称
  icon: string; //供应商图标
  sort: number; //供应商排序
  remark: string; //供应商描述
  modelCount: number;//模型数量
}

/**
 * 供应商新增对象
 */
export interface ProviderBo {
  id?: string;   //供应商ID
  code?: string; //供应商编码
  name?: string; //供应商名称
  icon?: string; //供应商图标
  sort?: number; //供应商排序
  remark?: string; //供应商描述
}
