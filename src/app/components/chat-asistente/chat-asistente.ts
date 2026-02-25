import { AfterViewInit, Component, ElementRef, ViewEncapsulation } from '@angular/core';

@Component({
  selector: 'app-chat-asistente',
  standalone: true,
  imports: [],
  templateUrl: './chat-asistente.html',
  styleUrl: './chat-asistente.css',
  encapsulation: ViewEncapsulation.None,
})
export class ChatAsistente implements AfterViewInit {

  constructor(private host: ElementRef<HTMLElement>) { }

  ngAfterViewInit(): void {
    const root = this.host.nativeElement;
    const chatMessages = root.querySelector('.chat-messages') as HTMLDivElement;
    const sendBtn = root.querySelector('.send-btn') as HTMLButtonElement;
    const inputTextarea = root.querySelector('.input-textarea') as HTMLTextAreaElement;
    const fileUpload = root.querySelector('#file-upload') as HTMLInputElement;
    const attachedPreview = root.querySelector('.attached-preview') as HTMLDivElement;
    const welcomeState = root.querySelector('.welcome-state') as HTMLDivElement | null;

    let attachedFile: File | null = null;

    // --- lógica de respuestas predefinidas ---
    const getBotReply = (text: string): string => {
      const msg = (text || '').toLowerCase();

      if (msg.includes('precio') || msg.includes('$') || msg.includes('cost')) {
        return 'Estamos procesando tu solicitud de precio, en breve verás el valor del producto.';
      }

      if (msg.includes('stock') || msg.includes('disponible') || msg.includes('hay')) {
        return 'Tu producto está en stock o verificándose en bodega.';
      }

      return 'No encontramos este producto, por favor envía una foto o más detalles.';
    };

    const scrollToBottom = () => {
      if (!chatMessages) return;
      chatMessages.scrollTop = chatMessages.scrollHeight;
    };

    const addMessage = (content: string, from: 'user' | 'bot' = 'user', file?: File) => {
      if (welcomeState) {
        welcomeState.style.display = 'none';
      }

      const msgRow = document.createElement('div');
      msgRow.className = `msg-row ${from}-row`;

      const avatar = document.createElement('div');
      avatar.className = `avatar ${from}-avatar`;
      avatar.textContent = from === 'user' ? 'U' : '🤖';

      const bubble = document.createElement('div');
      bubble.className = `msg-bubble ${from}-bubble`;

      if (file) {
        if (file.type.startsWith('image/')) {
          const img = document.createElement('img');
          img.src = URL.createObjectURL(file);
          img.style.maxWidth = '200px';
          img.style.borderRadius = '12px';
          bubble.appendChild(img);
        } else if (file.type.startsWith('audio/')) {
          const audio = document.createElement('audio');
          audio.src = URL.createObjectURL(file);
          audio.controls = true;
          bubble.appendChild(audio);
        }
      } else if (content) {
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

    // Manejo selección archivo
    if (fileUpload) {
      fileUpload.addEventListener('change', (e: Event) => {
        const input = e.target as HTMLInputElement;
        attachedFile = input.files && input.files[0] ? input.files[0] : null;
        attachedPreview.innerHTML = '';

        if (attachedFile) {
          const fileType = attachedFile.type;
          const preview = document.createElement('div');
          preview.classList.add('file-preview');
          preview.style.padding = '6px 12px';
          preview.style.background = 'rgba(14, 165, 233, 0.15)';
          preview.style.borderRadius = '8px';
          preview.style.fontSize = '0.85rem';

          if (fileType.startsWith('image/')) {
            preview.textContent = `📷 ${attachedFile.name}`;
          } else if (fileType.startsWith('audio/')) {
            preview.textContent = `🎤 ${attachedFile.name}`;
          } else {
            preview.textContent = `📎 ${attachedFile.name}`;
          }
          attachedPreview.appendChild(preview);
        }
      });
    }

    const handleSend = () => {
      const text = inputTextarea.value.trim();
      if (!attachedFile && !text) return;

      // SIEMPRE envía imagen + texto si hay ambos
      if (attachedFile) {
        const fileCopy = attachedFile;
        attachedFile = null;
        attachedPreview.innerHTML = '';
        fileUpload.value = '';

        // Imagen PRIMERO, luego texto ABAJO
        addMessage('', 'user', fileCopy);
        if (text) {
          setTimeout(() => addMessage(text, 'user'), 100);
        }

        setTimeout(() => {
          const reply = getBotReply(text || fileCopy.name || '');
          addMessage(reply, 'bot');
        }, 700);

        inputTextarea.value = '';  // Limpia
        inputTextarea.style.height = 'auto';  // ← RESET altura
        inputTextarea.style.height = '22px';  // ← Tamaño normal (min-height)
        return;
      }

      // Solo texto
      const soloText = text;
      inputTextarea.value = '';
      inputTextarea.style.height = 'auto';  // ← RESET altura
      inputTextarea.style.height = '22px';  // ← Tamaño normal (min-height)

      addMessage(soloText, 'user');
      setTimeout(() => {
        const reply = getBotReply(soloText);
        addMessage(reply, 'bot');
      }, 600);
    };





    // Click botón enviar
    if (sendBtn) {
      sendBtn.addEventListener('click', handleSend);
    }

    // Auto-expansión de textarea
    const adjustHeight = () => {
      inputTextarea.style.height = 'auto';  // Reset
      inputTextarea.style.height = Math.min(inputTextarea.scrollHeight, 110) + 'px';
    };

    inputTextarea.addEventListener('input', adjustHeight);
    inputTextarea.addEventListener('paste', () => setTimeout(adjustHeight, 0));

    // Llama al inicio
    adjustHeight();



    // Enter en textarea
    if (inputTextarea) {
      inputTextarea.addEventListener('keydown', (e: KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          handleSend();
        }
      });
    }
  }

}
