export interface ConfigQuery {
  name?: string;
  key?: string;
}

export interface ConfigVo {
  id: string;
  name: string;
  key: string;
  value: string;
  remark: string;
}

export interface ConfigBo {
  id?: string;
  name?: string;
  key?: string;
  value?: string;
  remark?: string;
}
