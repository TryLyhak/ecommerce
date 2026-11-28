import { HttpErrorResponse } from '@angular/common/http';

// All the messages in an error, ready to show to the customer
export function apiErrorMessages(error: unknown): string[] {
  if (error instanceof HttpErrorResponse) {
    if (error.status === 0) {
      return ['Cannot reach the server. Please try again later.'];
    }
    if (error.status === 404) {
      return ['We could not find that. It may have been removed.'];
    }
    // Laravel validation errors: { errors: { cart: ["Only 3 of Pixel Lite in stock."] } }
    const errors = error.error?.errors;
    if (errors && typeof errors === 'object') {
      const all = (Object.values(errors) as string[][]).flat();
      if (all.length > 0) {
        return all;
      }
    }
    if (error.error?.message) {
      return [error.error.message];
    }
    return ['Something went wrong. Please try again.'];
  }
  if (error instanceof Error) {
    return [error.message];
  }
  return ['Something went wrong. Please try again.'];
}

// All the messages joined into one text
export function apiErrorMessage(error: unknown): string {
  return apiErrorMessages(error).join(' ');
}
