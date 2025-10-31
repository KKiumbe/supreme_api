// src/controllers/meters/types.ts

export interface CreateMeterInput {
  serialNumber: string;
  model?: string;
  installationDate?: string; // YYYY-MM-DD
  lastInspectedAt?: string;  // YYYY-MM-DD
  status?: "installed" | "removed" | "faulty" | "inactive";
  meterSize?: number;
  connectionId?: number;
  meta?: Record<string, any>;
}

export interface UpdateMeterInput {
  serialNumber?: string;
  model?: string;
  installationDate?: Date;
  lastInspectedAt?: Date;
  status?: "installed" | "removed" | "faulty" | "inactive";
  meterSize?: number;
  connectionId?: number | null;
  meta?: Record<string, any>;
}

export interface MeterResponse {
  id: number;
  serialNumber: string;
  model: string | null;
  installationDate: Date | null;
  lastInspectedAt: Date | null;
  status: string;
  meterSize: number | null;
  createdAt: Date;
  tenantId: number;
  connectionId: number | null;
  meta: Record<string, any>;
  connection?: {
    id: number;
    connectionNumber: number;
    customer?: {
      id: string;
      customerName: string;
      accountNumber: string;
    } | null;
  } | null;
  
}

export interface GetMetersQuery {
  page?: number;
  limit?: number;
  search?: string;
  status?: "installed" | "removed" | "faulty" | "inactive";
  connectionId?: number;
  customerId?: string;
}

export interface GetMetersResponse {
  meters: MeterResponse[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}