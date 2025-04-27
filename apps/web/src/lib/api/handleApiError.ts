
import { getLogger } from '@/lib/logger';

const errorLogger = getLogger('api:error');

// We cannot call useToast() here directly because this is not a React component/hook context!
// So we ONLY log here. Toasting must be done inside pages/hooks when API calls fail.

export function handleApiError(error: unknown, context?: string) {
  const message =
    (error as any)?.response?.data?.error?.message ||
    (error as any)?.message ||
    'Unexpected error';

  errorLogger.error('API error occurred', {
    context,
    error: serializeError(error),
  });

  throw error;
}

function serializeError(error: unknown) {
  if (error instanceof Error) {
    return { message: error.message, stack: error.stack };
  }
  return error;
}

