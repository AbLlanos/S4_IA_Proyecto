import { AfterViewInit, Component, ElementRef, ViewEncapsulation, inject } from '@angular/core';
import { Ia } from '../../services/ia';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-chat-asistente',
  standalone: true,
  templateUrl: './chat-asistente.html',
  styleUrl: './chat-asistente.css',
  encapsulation: ViewEncapsulation.None,
})
export class ChatAsistente implements AfterViewInit {

  private ia = inject(Ia);


  constructor(private host: ElementRef<HTMLElement>, private http: HttpClient) { }

  ngAfterViewInit(): void {
    const root = this.host.nativeElement;
    const chatMessages = root.querySelector('.chat-messages') as HTMLDivElement;
    const sendBtn = root.querySelector('.send-btn') as HTMLButtonElement;
    const inputTextarea = root.querySelector('.input-textarea') as HTMLTextAreaElement;
    const fileUpload = root.querySelector('#file-upload') as HTMLInputElement;
    const attachedPreview = root.querySelector('.attached-preview') as HTMLDivElement;
    const welcomeState = root.querySelector('.welcome-state') as HTMLDivElement | null;
    const microBtn = root.querySelector('.micro-btn') as HTMLButtonElement;

    let attachedFile: File | null = null;

    // ── Estado grabación ──────────────────────────────────────────
    let mediaRecorder: MediaRecorder | null = null;
    let audioChunks: Blob[] = [];
    let isRecording = false;

    // ── Helpers UI ────────────────────────────────────────────────
    const scrollToBottom = () => {
      chatMessages.scrollTop = chatMessages.scrollHeight;
    };

    const addMessage = (content: string, from: 'user' | 'bot', file?: File) => {
      if (welcomeState) welcomeState.style.display = 'none';

      const msgRow = document.createElement('div');
      msgRow.className = `msg-row ${from}-row`;

      const avatar = document.createElement('div');
      avatar.className = `avatar ${from}-avatar`;
      avatar.textContent = from === 'user' ? 'U' : '🤖';

      const bubble = document.createElement('div');
      bubble.className = `msg-bubble ${from}-bubble`;

      if (file && file.type.startsWith('image/')) {
        const img = document.createElement('img');
        img.src = URL.createObjectURL(file);
        img.style.maxWidth = '200px';
        img.style.borderRadius = '12px';
        img.style.display = 'block';
        img.style.marginBottom = content ? '8px' : '0';
        bubble.appendChild(img);
      }

      if (content) {
        const p = document.createElement('p');
        p.className = 'msg-text';
        p.textContent = content;
        bubble.appendChild(p);
      }

      if (from === 'user') {
        msgRow.appendChild(bubble);
        msgRow.appendChild(avatar);
      } else {
        msgRow.appendChild(avatar);
        msgRow.appendChild(bubble);
      }

      chatMessages.appendChild(msgRow);
      scrollToBottom();
    };

    // ── Archivo adjunto (imagen) ───────────────────────────────────
    fileUpload?.addEventListener('change', (e: Event) => {
      const input = e.target as HTMLInputElement;
      attachedFile = input.files?.[0] || null;
      attachedPreview.innerHTML = '';
      if (attachedFile) {
        const preview = document.createElement('div');
        preview.textContent = `📎 ${attachedFile.name}`;
        attachedPreview.appendChild(preview);
      }
    });

    // ── Micrófono ─────────────────────────────────────────────────
    microBtn?.addEventListener('click', async () => {
      if (!isRecording) {
        // ── INICIAR grabación ──
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          mediaRecorder = new MediaRecorder(stream);
          audioChunks = [];

          mediaRecorder.ondataavailable = (e: BlobEvent) => {
            if (e.data.size > 0) audioChunks.push(e.data);
          };

          mediaRecorder.onstop = () => {
            // Detener todas las pistas del micrófono
            stream.getTracks().forEach(t => t.stop());

            const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });

            // Mostrar indicador de procesando
            addMessage('🎤 Audio enviado, transcribiendo...', 'user');

            this.ia.sendAudio(audioBlob).subscribe({
              next: (res) => {
                // Reemplazar el mensaje de espera con la transcripción real
                const lastUserRow = chatMessages.querySelectorAll('.user-row');
                const lastRow = lastUserRow[lastUserRow.length - 1];
                if (lastRow) {
                  const p = lastRow.querySelector('.msg-text');
                  if (p) p.textContent = `🎤 "${res.transcription}"`;
                }
                addMessage(res.response, 'bot');
              },
              error: (err) => {
                console.error('Error audio:', err);
                addMessage('❌ Error al procesar el audio.', 'bot');
              }
            });

            // Resetear estado visual
            microBtn.classList.remove('recording');
            microBtn.title = 'Grabar audio';
            isRecording = false;
          };

          mediaRecorder.start();
          isRecording = true;
          microBtn.classList.add('recording');  // CSS para indicar grabación
          microBtn.title = 'Detener grabación';

        } catch (err) {
          console.error('Micrófono no disponible:', err);
          addMessage('❌ No se pudo acceder al micrófono.', 'bot');
        }

      } else {
        // ── DETENER grabación ──
        mediaRecorder?.stop();
      }
    });

    // ── Enviar texto/imagen ───────────────────────────────────────
    const handleSend = () => {
      const text = inputTextarea.value.trim();
      if (!text && !attachedFile) return;

      if (attachedFile) {
        const fileCopy = attachedFile;
        addMessage(text, 'user', fileCopy);

        this.ia.sendImage(fileCopy, text).subscribe(res => {
          addMessage(res.response, 'bot');
        });

        attachedFile = null;
        attachedPreview.innerHTML = '';
        fileUpload.value = '';
        inputTextarea.value = '';
        return;
      }

      addMessage(text, 'user');
      this.ia.sendText(text).subscribe(res => {
        addMessage(res.response, 'bot');
      });

      inputTextarea.value = '';
    };

    sendBtn?.addEventListener('click', handleSend);

    inputTextarea?.addEventListener('keydown', (e: KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    });
  }

}