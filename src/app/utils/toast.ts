import Swal from 'sweetalert2';

// A small message in the top-right corner that disappears after 2.5 seconds
export function showToast(
  icon: 'success' | 'error' | 'info' | 'warning',
  title: string,
): void {
  Swal.fire({
    toast: true,
    position: 'top-end',
    icon,
    title,
    showConfirmButton: false,
    timer: 2500,
    timerProgressBar: true,
  });
}
