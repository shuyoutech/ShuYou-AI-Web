export interface GameVo {
  id: string;                   //游戏ID
  name: string;                 //游戏名
  type: string;                 //游戏类型
  initial: string;              //游戏名字首字母
  icon: string;                 //游戏图标
  goodsTypes: string[];         //商品类型
  crossAreas: string[];         //跨区
  areaServers: GameAreaServer[];//游戏区服
  races: string[];              //游戏种族阵营
  roles: string[];              //游戏角色职业"
  platformIds: string[];        //点赞次数
  hotFlag: boolean;             //是否热门游戏
}

export interface GameAreaServer {
  gameArea: string;  //游戏区
  gameServer: string;//游戏服
  crossArea: string; //跨区
}
