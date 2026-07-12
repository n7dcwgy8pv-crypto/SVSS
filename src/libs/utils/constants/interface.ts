import { ResponseData } from './enum';

// Interface definitions
export interface ApiResponse<T> {
  statusCode: number;
  message: string;
  data: T;
}

export interface HandleResponseOptions<T = unknown> {
  statusCode?: number;
  status: ResponseData;
  messageKey?: string;
  message?: string | string[];
  data?: T;
  error?: unknown;
}
