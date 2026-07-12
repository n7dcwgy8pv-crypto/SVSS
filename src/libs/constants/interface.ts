// Interface definitions
export interface ApiResponse<T> {
  statusCode: number;
  message: string;
  data: T;
}
