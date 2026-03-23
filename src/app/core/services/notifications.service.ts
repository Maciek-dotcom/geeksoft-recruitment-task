import { Injectable, inject } from '@angular/core';
import { MatSnackBar, MatSnackBarConfig } from '@angular/material/snack-bar';

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private readonly snackbar = inject(MatSnackBar);

  private readonly defaultConfig: MatSnackBarConfig = {
    verticalPosition: 'top',
    horizontalPosition: 'center',
    duration: 2000,
  };

  closePosition(orderIds: number | number[]): void {
    const ids = Array.isArray(orderIds) ? orderIds : [orderIds];

    const text =
      ids.length === 1
        ? `Zamknięto zlecenie nr: ${ids[0]}`
        : `Zamknięto zlecenia: ${ids.join(', ')}`;

    this.snackbar.open(text, undefined, this.defaultConfig);
  }
}
