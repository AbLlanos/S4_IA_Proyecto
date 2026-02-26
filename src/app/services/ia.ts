import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class Ia {
  private apiUrl = 'http://localhost:8000/chat';
  private sessionId = crypto.randomUUID(); // ID único por sesión de usuario

  constructor(private http: HttpClient) { }

  sendText(message: string): Observable<any> {
    const formData = new FormData();
    formData.append('message', message);
    formData.append('session_id', this.sessionId);
    return this.http.post(`${this.apiUrl}/text`, formData);
  }

  sendImage(file: File, instruction: string): Observable<any> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('instruction', instruction || '');
    formData.append('session_id', this.sessionId);
    return this.http.post(`${this.apiUrl}/image`, formData);
  }

  confirmOrder(lastResponse: string): Observable<any> {
    const formData = new FormData();
    formData.append('last_response', lastResponse);
    return this.http.post(`${this.apiUrl}/confirm`, formData);
  }

  sendAudio(audioBlob: Blob): Observable<any> {
    const formData = new FormData();
    formData.append('file', audioBlob, 'audio.webm');
    formData.append('session_id', this.sessionId);
    return this.http.post(`${this.apiUrl}/audio`, formData);
  }

  streamText(message: string): Observable<any> {
    const formData = new FormData();
    formData.append('message', message);
    formData.append('session_id', this.sessionId);
    return new Observable(observer => {
      const eventSource = new EventSource(`${this.apiUrl}/text?message=${encodeURIComponent(message)}&session_id=${this.sessionId}`);
      eventSource.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.done) {
          eventSource.close();
          observer.complete();
        } else {
          observer.next(data);
        }
      };
      eventSource.onerror = (err) => {
        eventSource.close();
        observer.error(err);
      };
      return () => eventSource.close();
    });
  }

  getSessionId(): string {
    return this.sessionId;
  }



}
