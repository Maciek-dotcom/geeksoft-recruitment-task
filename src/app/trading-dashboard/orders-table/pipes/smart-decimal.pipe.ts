import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'smartDecimal' })
export class SmartDecimalPipe implements PipeTransform {
  transform(value: number, minDecimals = 4): string {
    if (value === 0) return '0';

    const abs = Math.abs(value);

    // check how many decimals are needed to display value without cutting significant digits, but at least minDecimals
    const neededDecimals =
      abs >= 1
        ? minDecimals
        : Math.max(minDecimals, Math.ceil(-Math.log10(abs)));

    return value.toFixed(neededDecimals);
  }
}
