export interface AuthLoginReq {
  username: string
  password: string;
}

export interface AuthLoginRes {
  accessToken: string;
  userId: string;
  expireTime: number
}

export interface AuthAuthorizeReq {
  type: string;
  callBack: string
}

export interface AuthAccessTokenReq {
  type: string;
  code: string
}

export interface AuthAccessTokenRes {
  accessToken: string;
  userId: string;
  expireTime: number
}

export interface AuthSmsSendReq {
  mobile: string
  templateCode: string;
}

export interface AuthSmsLoginReq {
  mobile: string
  code: string;
}

export interface AuthSmsLoginRes {
  accessToken: string;
  userId: string;
  expireTime: number
}
