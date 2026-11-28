import Swal from 'sweetalert2';
import { MergeResponse } from '../models/cart.model';
import { showToast } from './toast';

// Tells the customer what happened when their browser cart was merged
export function showMergeNotice(result: MergeResponse | null): void {
  // null means there was no browser cart to merge
  if (!result) {
    return;
  }

  const problems: string[] = [];

  if (result.skipped.length > 0) {
    problems.push(
      `${result.skipped.length} item(s) could not be added (unavailable, out of stock or already at the maximum)`,
    );
  }
  if (result.adjusted.length > 0) {
    problems.push(
      `${result.adjusted.length} item(s) were reduced to the available stock`,
    );
  }

  // Everything was merged without changes: a small message is enough
  if (problems.length === 0) {
    showToast('success', 'Your cart was added to your account');
    return;
  }

  // Something changed: use a message the customer has to read and close
  Swal.fire({
    icon: 'info',
    title: 'Your cart was updated',
    text: `${problems.join('. ')}.`,
    confirmButtonText: 'OK',
  });
}
