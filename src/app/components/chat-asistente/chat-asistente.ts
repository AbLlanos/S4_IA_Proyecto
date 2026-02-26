import { AfterViewInit, Component, ElementRef, ViewEncapsulation, inject } from '@angular/core';
import { Ia } from '../../services/ia';


@Component({
  selector: 'app-chat-asistente',
  standalone: true,
  templateUrl: './chat-asistente.html',
  styleUrl: './chat-asistente.css',
  encapsulation: ViewEncapsulation.None,
})
export class ChatAsistente implements AfterViewInit {

  private ia = inject(Ia);

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

      if (file) {
        if (file.type.startsWith('image/')) {
          const img = document.createElement('img');
          img.src = URL.createObjectURL(file);
          img.style.maxWidth = '200px';
          img.style.borderRadius = '12px';
          bubble.appendChild(img);
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

    const handleSend = () => {

      const text = inputTextarea.value.trim();
      if (!text && !attachedFile) return;

      // Si hay imagen
      if (attachedFile) {
        const fileCopy = attachedFile;
        addMessage('', 'user', fileCopy);

        this.ia.sendImage(fileCopy, text).subscribe(res => {
          addMessage(res.response, 'bot');
        });

        attachedFile = null;
        attachedPreview.innerHTML = '';
        fileUpload.value = '';
        inputTextarea.value = '';
        return;
      }

      // Solo texto
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