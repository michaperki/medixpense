
// lib/api/error.ts
export function extractError(err: unknown) {
  if (err instanceof Error) {
    return { error: err.message, err };
  }
  return {
    error: typeof err === 'string' ? err : 'Unknown error',
    err
  };
}
