export interface InvoiceQuery {
  invoiceNo?: string; //发票号码
  invoiceStatus?: string; //发票状态
  startDate?: string;
  endDate?: string;
}

export interface InvoiceVo {
  id: string;           //发票ID
  createTime: string;
  invoiceStatus: string;
  invoiceType: string;
  invoiceNo: string;
  titleType: string;
  titleName: string;
  creditNo: string;
  amount: number;
  email: string;
  remark: string;
  invoiceUrl: string;
}

export interface InvoiceBo {
  invoiceType?: string;
  titleType?: string;
  titleName?: string;
  creditNo?: string;
  amount?: number;
  email?: string;
  remark?: string;
}

export interface InvoiceQuota {
  totalAmount?: number;
  usedAmount?: number;
  availableAmount?: number;
}

