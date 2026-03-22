import { HttpClient } from '@angular/common/http';
import { inject, Inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import {
  OrderItem,
  OrderDataResponse,
  InstrumentItem,
  ContractTypeItem,
} from './models/table-data.models';

// TODO: relocate to /services
@Injectable({
  providedIn: 'root',
})
export class GeekSoftApiService {
  private readonly httpClient = inject(HttpClient);

  private readonly BASE_API_URL = 'https://geeksoft.pl/assets/2026-task/';

  getOrders(): Observable<OrderItem[]> {
    return this.httpClient
      .get<OrderDataResponse>(`${this.BASE_API_URL}order-data.json`)
      .pipe(map(({ data }) => [...data]));
  }

  getInstruments(): Observable<InstrumentItem[]> {
    return this.httpClient.get<InstrumentItem[]>(
      `${this.BASE_API_URL}instruments.json`,
    );
  }

  getContractTypes(): Observable<ContractTypeItem[]> {
    return this.httpClient.get<ContractTypeItem[]>(
      `${this.BASE_API_URL}contract-types.json`,
    );
  }
}
