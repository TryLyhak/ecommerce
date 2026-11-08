import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'selectedCount',
  standalone: true,
})
export class SelectedCountPipe implements PipeTransform {
  transform(items: any[]): number {
    return items
      .filter((item) => item.selected)
      .reduce((count, item) => count + (item.quantity || 1), 0);
  }
}
