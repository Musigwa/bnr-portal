import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { logForensic } from '@/common/utils/forensic-logger';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const message =
      exception instanceof HttpException
        ? exception.getResponse()
        : 'Internal server error';

    if (status === 500) {
      Logger.error(
        'Unhandled Exception:',
        exception instanceof Error ? exception.stack : String(exception),
        'GlobalExceptionFilter',
      );
      logForensic('Unhandled Exception caught by GlobalFilter', exception);
    }

    response.status(status).json({
      statusCode: status,
      message:
        typeof message === 'object'
          ? (message as { message: string }).message
          : message,
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }
}
