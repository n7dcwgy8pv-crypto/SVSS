import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import type { HttpAdapterHost } from '@nestjs/core';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

@Catch()
export class AllExceptionFilter implements ExceptionFilter {
  constructor(private readonly httpAdapter: HttpAdapterHost['httpAdapter']) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();

    let httpStatus = HttpStatus.INTERNAL_SERVER_ERROR;
    let messages: string[] = [];

    if (exception instanceof HttpException) {
      httpStatus = exception.getStatus();
      const raw = exception.getResponse();

      if (typeof raw === 'string') {
        messages = [raw];
      } else if (isRecord(raw)) {
        if (typeof raw.message === 'string') {
          messages = [raw.message];
        } else if (Array.isArray(raw.message)) {
          messages = raw.message as string[];
        }
      }
    } else if (isRecord(exception)) {
      // Mongoose duplicate key error
      if (exception['code'] === 11000) {
        httpStatus = HttpStatus.CONFLICT;
        if (isRecord(exception['keyValue'])) {
          const key = Object.keys(exception['keyValue'])[0] ?? 'field';
          const formatted = key
            .replace(/_/g, ' ')
            .replace(/([A-Z])/g, ' $1')
            .replace(/^./, (s: string) => s.toUpperCase())
            .trim();
          messages = [`${formatted} already exists.`];
        } else {
          messages = ['Duplicate record found.'];
        }
      } else if (typeof exception['message'] === 'string') {
        messages = [exception['message']];
      } else if (Array.isArray(exception['message'])) {
        messages = exception['message'] as string[];
      } else {
        messages = ['An unexpected error occurred.'];
      }
    } else {
      messages = ['An unexpected error occurred.'];
    }

    const summary = messages.join(', ') || 'An unexpected error occurred.';

    // Spec-compliant envelope: { success: false, message, errors? }
    const body: Record<string, unknown> = {
      success: false,
      message: summary,
    };

    // Only include field-level `errors` array on 400 / 422
    if (
      (httpStatus === HttpStatus.BAD_REQUEST ||
        httpStatus === HttpStatus.UNPROCESSABLE_ENTITY) &&
      messages.length > 0
    ) {
      body.errors = messages.map((msg) => ({ message: msg }));
    }

    this.httpAdapter.reply(ctx.getResponse(), body, httpStatus);
  }
}
