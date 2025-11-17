import type {AxiosResponse} from "axios";
import api from "@/utils/axios.ts";
import type {MenuQuery, MenuBo, MenuVo} from "@/api/system/menu/types.ts";

/**
 * 菜单管理-菜单树
 */
export function menuTreeApi(data: MenuQuery): Promise<AxiosResponse<Tree<MenuVo>[]>> {
    return api({
        url: '/menu/tree',
        method: 'post',
        data: data
    });
}

/**
 * 菜单管理-分页
 */
export function menuPageApi(data: PageQuery<MenuQuery>): Promise<AxiosResponse<PageResult<MenuVo>>> {
    return api({
        url: '/menu/page',
        method: 'post',
        data: data
    });
}

/**
 * 菜单管理-详情
 */
export function menuDetailApi(menuId: number): Promise<AxiosResponse<MenuVo>> {
    return api({
        url: '/menu/detail/' + menuId,
        method: 'post'
    });
}

/**
 * 菜单管理-新增
 */
export function menuSaveApi(data: MenuBo): Promise<AxiosResponse<number>> {
    return api({
        url: '/menu/save',
        method: 'post',
        data: data
    });
}

/**
 * 菜单管理-修改
 */
export function menuUpdateApi(data: MenuBo): Promise<AxiosResponse<boolean>> {
    return api({
        url: '/menu/update',
        method: 'post',
        data: data
    });
}

/**
 * 菜单管理-删除
 */
export function menuDeleteApi(data: number[]): Promise<AxiosResponse<boolean>> {
    return api({
        url: '/menu/delete',
        method: 'post',
        data: data
    });
}

/**
 * 菜单管理-状态
 */
export function menuStatusApi(data: UpdateStatusBo): Promise<AxiosResponse<boolean>> {
    return api({
        url: '/menu/status',
        method: 'post',
        data: data
    });
}
