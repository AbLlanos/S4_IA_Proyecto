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

    // ── NUEVO: Typing dots mientras espera ────────────────────────
    const createTypingBubble = () => {
      if (welcomeState) welcomeState.style.display = 'none';

      const msgRow = document.createElement('div');
      msgRow.className = 'msg-row bot-row typing-row';

      const avatar = document.createElement('div');
      avatar.className = 'avatar bot-avatar';
      avatar.textContent = '🤖';

      const bubble = document.createElement('div');
      bubble.className = 'msg-bubble bot-bubble typing-bubble';
      bubble.innerHTML = `
        <div class="typing-dots">
          <span></span><span></span><span></span>
        </div>
      `;

      msgRow.appendChild(avatar);
      msgRow.appendChild(bubble);
      chatMessages.appendChild(msgRow);
      scrollToBottom();
      return msgRow;
    };

    // ── NUEVO: Streaming fetch usando ReadableStream ───────────────
    const streamBotResponse = async (
      endpoint: string,
      formData: FormData
    ): Promise<void> => {
      if (welcomeState) welcomeState.style.display = 'none';

      // ← PRIMERO mostrar typing dots
      const typingRow = document.createElement('div');
      typingRow.className = 'msg-row bot-row';
      const typingAvatar = document.createElement('div');
      typingAvatar.className = 'avatar bot-avatar';
      typingAvatar.textContent = '🤖';
      const typingBubble = document.createElement('div');
      typingBubble.className = 'msg-bubble bot-bubble typing-bubble';
      typingBubble.innerHTML = `<div class="typing-dots"><span></span><span></span><span></span></div>`;
      typingRow.appendChild(typingAvatar);
      typingRow.appendChild(typingBubble);
      chatMessages.appendChild(typingRow);
      scrollToBottom();

      // Preparar burbuja de respuesta (oculta)
      const msgRow = document.createElement('div');
      msgRow.className = 'msg-row bot-row';
      const avatar = document.createElement('div');
      avatar.className = 'avatar bot-avatar';
      avatar.textContent = '🤖';
      const bubble = document.createElement('div');
      bubble.className = 'msg-bubble bot-bubble';
      const p = document.createElement('p');
      p.className = 'msg-text';
      p.textContent = '';
      bubble.appendChild(p);
      msgRow.appendChild(avatar);
      msgRow.appendChild(bubble);

      try {
        const response = await fetch(endpoint, {
          method: 'POST',
          body: formData,
        });

        if (!response.ok || !response.body) {
          typingRow.remove();
          p.textContent = '❌ Error al conectar.';
          chatMessages.appendChild(msgRow);
          return;
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder('utf-8');
        let buffer = '';
        let firstChunk = true;

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });

          // ← Al llegar el primer chunk, quitar dots y mostrar burbuja real
          if (firstChunk) {
            typingRow.remove();
            chatMessages.appendChild(msgRow);
            firstChunk = false;
          }

          p.textContent = buffer;
          scrollToBottom();
        }

        buffer += decoder.decode();
        p.textContent = buffer;
        scrollToBottom();

      } catch (err) {
        typingRow.remove();
        console.error('Stream error:', err);
        p.textContent = '❌ Error al obtener respuesta.';
        chatMessages.appendChild(msgRow);
      }
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
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          mediaRecorder = new MediaRecorder(stream);
          audioChunks = [];

          mediaRecorder.ondataavailable = (e: BlobEvent) => {
            if (e.data.size > 0) audioChunks.push(e.data);
          };

          mediaRecorder.onstop = () => {
            stream.getTracks().forEach(t => t.stop());

            const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
            addMessage('🎤 Audio enviado, transcribiendo...', 'user');

            // Audio sigue usando subscribe (no streaming)
            const typingBubble = createTypingBubble();
            this.ia.sendAudio(audioBlob).subscribe({
              next: (res) => {
                typingBubble.remove();
                const lastUserRow = chatMessages.querySelectorAll('.user-row');
                const lastRow = lastUserRow[lastUserRow.length - 1];
                if (lastRow) {
                  const p = lastRow.querySelector('.msg-text');
                  if (p) p.textContent = `🎤 "${res.transcription}"`;
                }
                addMessage(res.response, 'bot');
              },
              error: (err) => {
                typingBubble.remove();
                console.error('Error audio:', err);
                addMessage('❌ Error al procesar el audio.', 'bot');
              }
            });

            microBtn.classList.remove('recording');
            microBtn.title = 'Grabar audio';
            isRecording = false;
          };

          mediaRecorder.start();
          isRecording = true;
          microBtn.classList.add('recording');
          microBtn.title = 'Detener grabación';

        } catch (err) {
          console.error('Micrófono no disponible:', err);
          addMessage('❌ No se pudo acceder al micrófono.', 'bot');
        }

      } else {
        mediaRecorder?.stop();
      }
    });

    // ── Enviar texto/imagen ───────────────────────────────────────
    const handleSend = async () => {
      const text = inputTextarea.value.trim();
      if (!text && !attachedFile) return;

      if (attachedFile) {
        // Imagen: sigue usando subscribe (respuesta completa)
        const fileCopy = attachedFile;
        addMessage(text, 'user', fileCopy);

        const typingBubble = createTypingBubble();
        this.ia.sendImage(fileCopy, text).subscribe({
          next: (res) => {
            typingBubble.remove();
            addMessage(res.response, 'bot');
          },
          error: (err) => {
            typingBubble.remove();
            addMessage('❌ Error al procesar imagen.', 'bot');
          }
        });

        attachedFile = null;
        attachedPreview.innerHTML = '';
        fileUpload.value = '';
        inputTextarea.value = '';
        return;
      }

      // Texto: streaming palabra por palabra ✅
      addMessage(text, 'user');
      inputTextarea.value = '';

      const formData = new FormData();
      formData.append('message', text);
      formData.append('session_id', this.ia.getSessionId());

      await streamBotResponse('http://localhost:8000/chat/text', formData);
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
