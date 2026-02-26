import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class Ia {

  private apiUrl = 'http://localhost:8000/chat';

  constructor(private http: HttpClient) { }

  sendText(message: string): Observable<any> {
    const formData = new FormData();
    formData.append('message', message);
    return this.http.post(`${this.apiUrl}/text`, formData);
  }

  sendImage(file: File, instruction: string): Observable<any> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('instruction', instruction || '');
    return this.http.post(`${this.apiUrl}/image`, formData);
  }

  confirmOrder(lastResponse: string): Observable<any> {
    const formData = new FormData();
    formData.append('last_response', lastResponse);
    return this.http.post(`${this.apiUrl}/confirm`, formData);
  }
}