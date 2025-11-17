/**
 * 字典类型查询参数
 */
export interface DictTypeQuery {
  code?: string;
  name?: string;
}

/**
 * 字典类型详情
 */
export interface DictTypeVo {
  id: string;
  code: string;
  name: string;
  remark: string;
}

/**
 * 字典类型新增对象
 */
export interface DictTypeBo {
  id?: string;
  code?: string;
  name?: string;
  remark?: string;
}

/**
 * 字典数据查询参数
 */
export interface DictDataQuery {
  dictTypeId?: string;
  label?: string;
}

/**
 * 字典数据详情
 */
export interface DictDataVo {
  id: string;
  dictTypeId: string;
  label: string;
  value: string;
  sort: number;
}

/**
 * 字典数据新增对象
 */
export interface DictDataBo {
  id?: string;
  dictTypeId?: string;
  label?: string;
  value?: string;
  sort?: number;
}


