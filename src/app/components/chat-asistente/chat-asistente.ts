import { AfterViewInit, Component, ElementRef, ViewEncapsulation } from '@angular/core';

@Component({
  selector: 'app-chat-asistente',
  standalone: true,
  templateUrl: './chat-asistente.html',
  styleUrls: ['./chat-asistente.css'],
  encapsulation: ViewEncapsulation.None,
})
export class ChatAsistente implements AfterViewInit {
  cart: { name: string; qty: number; price: number }[] = [];
  lastAddedIndex: number = -1;

  constructor(private host: ElementRef<HTMLElement>) {}

  ngAfterViewInit(): void {
    const root = this.host.nativeElement;
    const chatMessages = root.querySelector('.chat-messages') as HTMLDivElement;
    const sendBtn = root.querySelector('.send-btn') as HTMLButtonElement;
    const inputTextarea = root.querySelector('.input-textarea') as HTMLTextAreaElement;
    const fileUpload = root.querySelector('#file-upload') as HTMLInputElement;
    const attachedPreview = root.querySelector('.attached-preview') as HTMLDivElement;
    const welcomeState = root.querySelector('.welcome-state') as HTMLDivElement | null;

    let attachedFile: File | null = null;

    const scrollToBottom = () => {
      chatMessages.scrollTop = chatMessages.scrollHeight;
    };

    const addMessage = (content: string, from: 'user' | 'bot' = 'user', file?: File) => {
      if (welcomeState) welcomeState.style.display = 'none';

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
      } else {
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

    fileUpload.addEventListener('change', (e: Event) => {
      const input = e.target as HTMLInputElement;
      attachedFile = input.files && input.files[0] ? input.files[0] : null;
      attachedPreview.innerHTML = '';

      if (attachedFile) {
        const preview = document.createElement('div');
        preview.textContent = attachedFile.type.startsWith('image/') ? `📷 ${attachedFile.name}` :
                              attachedFile.type.startsWith('audio/') ? `🎤 ${attachedFile.name}` : `📎 ${attachedFile.name}`;
        preview.style.padding = '6px 12px';
        preview.style.background = 'rgba(14, 165, 233, 0.15)';
        preview.style.borderRadius = '8px';
        attachedPreview.appendChild(preview);
      }
    });

    const sendToBackend = async (text: string, file?: File) => {
      const formData = new FormData();
      if (file) formData.append('file', file);
      if (text) formData.append('text', text);

      try {
        const res = await fetch('http://localhost:5000/predict', {
          method: 'POST',
          body: formData,
        });
        const data = await res.json();
        return data.prediction || data.error;
      } catch {
        return 'Error conectando con el servidor';
      }
    };

    const handleSend = async () => {
      const text = inputTextarea.value.trim();
      if (!attachedFile && !text) return;

      // Agregar mensaje usuario
      if (attachedFile) {
        addMessage('', 'user', attachedFile);
      }
      if (text) addMessage(text, 'user');

      const fileCopy = attachedFile;
      attachedFile = null;
      attachedPreview.innerHTML = '';
      fileUpload.value = '';

      // Llamar backend
      const reply = await sendToBackend(text, fileCopy || undefined);
      addMessage(reply, 'bot');

      // --- Ejemplo de carrito y "añade X más" ---
      if (text.toLowerCase().includes('añade 2 más')) {
        if (this.lastAddedIndex >= 0) {
          this.cart[this.lastAddedIndex].qty += 2;
        }
      } else {
        // Si el mensaje menciona un producto nuevo, agrégalo
        // Ejemplo simple: detectar "jugo", "mantequilla"...
        if (text.toLowerCase().includes('mantequilla')) {
          this.cart.push({ name: 'Mantequilla 200g', qty: 1, price: 1.98 });
          this.lastAddedIndex = this.cart.length - 1;
        } else if (text.toLowerCase().includes('jugo')) {
          this.cart.push({ name: 'Jugo en caja 1L', qty: 1, price: 1.20 });
          this.lastAddedIndex = this.cart.length - 1;
        }
      }

      inputTextarea.value = '';
      inputTextarea.style.height = 'auto';
      inputTextarea.style.height = '22px';
    };

    sendBtn.addEventListener('click', handleSend);

    inputTextarea.addEventListener('keydown', (e: KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    });

    // Auto-expansión de textarea
    const adjustHeight = () => {
      inputTextarea.style.height = 'auto';
      inputTextarea.style.height = Math.min(inputTextarea.scrollHeight, 110) + 'px';
    };
    inputTextarea.addEventListener('input', adjustHeight);
    inputTextarea.addEventListener('paste', () => setTimeout(adjustHeight, 0));
    adjustHeight();
  }
}