export interface CreateCustomerInput {
  accountNumber: string;
  customerName: string;
  email?: string;
  phoneNumber: string;
  customerKraPin?: string;
  customerDob?: string | Date;
  customerDeposit?: number | string;
  customerTariffId?: string;
  customerDiscoType?: string;
  customerIdNo?: string;
  hasSewer?: boolean;
  hasWater?: boolean;
  tariffCategoryId?: string;
  customerSchemeId?: number;
  customerZoneId?: number;
  customerRouteId?: number;
}
