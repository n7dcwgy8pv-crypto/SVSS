import { HttpStatus } from '@nestjs/common';
import { ResponseData } from 'src/libs/utils/constants/enum';
import { HandleResponseOptions } from '../utils/constants/interface';

export function HandleResponse<T = unknown>(
  statusCode: number,
  status: ResponseData,
  messageKey?: string,
  message?: string,
  data?: T,
  error?: unknown,
): HandleResponseOptions<T> {
  return {
    statusCode: statusCode || HttpStatus.OK,
    status,
    messageKey: messageKey || undefined,
    message: message || undefined,
    data: data || undefined,
    error: error || undefined,
  };
}
