import type {AxiosResponse} from "axios";
import api from "@/utils/axios.ts";
import type {InvoiceQuery, InvoiceBo, InvoiceVo, InvoiceQuota} from "@/api/system/invoice/types.ts";

/**
 * 发票管理-分页
 */
export function invoicePageApi(data: PageQuery<InvoiceQuery>): Promise<AxiosResponse<PageResult<InvoiceVo>>> {
  return api({
    url: '/invoice/page',
    method: 'post',
    data: data
  });
}

/**
 * 发票管理-详情
 */
export function invoiceDetailApi(invoiceId: string): Promise<AxiosResponse<InvoiceVo>> {
  return api({
    url: '/invoice/detail/' + invoiceId,
    method: 'post'
  });
}

/**
 * 发票管理-获取开票额度
 */
export function invoiceQuotaApi(): Promise<AxiosResponse<InvoiceQuota>> {
  return api({
    url: '/invoice/quota',
    method: 'post'
  });
}

/**
 * 发票管理-申请
 */
export function invoiceApplyApi(data: InvoiceBo): Promise<AxiosResponse<string>> {
  return api({
    url: '/invoice/apply',
    method: 'post',
    data: data
  });
}

/**
 * 发票管理-删除
 */
export function invoiceDeleteApi(data: string[]): Promise<AxiosResponse<boolean>> {
  return api({
    url: '/invoice/delete',
    method: 'post',
    data: data
  });
}
