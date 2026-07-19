import { Component, Input, HostListener, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ChatbotService, ChatMessage } from '../../services/chatbot/chatbot.service';
import { ThemeService } from '../../services/theme/theme.service';

@Component({
  selector: 'app-chatbot-widget',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './chatbot-widget.component.html',
  styleUrls: ['./chatbot-widget.component.scss'],
})
export class ChatbotWidgetComponent {
  @Input() propertyId: string | null = null;
  @Input() checkIn = '';
  @Input() checkOut = '';
  @Input() userLat: number | null = null;
  @Input() userLng: number | null = null;

  isOpen = false;
  message = '';
  loading = false;
  messages: ChatMessage[] = [];
  history: ChatMessage[] = [];

  panelWidth = 380;
  panelHeight = 520;
  minWidth = 300;
  minHeight = 300;
  maxWidth = 700;
  maxHeight = 800;

  private resizing: 'top' | 'left' | 'corner' | null = null;
  private resizeStartX = 0;
  private resizeStartY = 0;
  private resizeStartW = 0;
  private resizeStartH = 0;

  quickPrompts = [
    { label: 'Compare all room types', action: 'compare' },
    { label: 'What events are near this lodge?', action: 'events' },
    { label: 'Which room is best value?', action: 'bestValue' },
    { label: 'Why do prices change?', action: 'pricingExplain' },
  ];

  constructor(
    private readonly chatbotService: ChatbotService,
    public readonly themeService: ThemeService,
    private readonly elementRef: ElementRef,
  ) {}

  @HostListener('document:keydown.escape', ['$event'])
  onEscape(): void {
    this.isOpen = false;
  }

  @HostListener('document:mousemove', ['$event'])
  onMouseMove(event: MouseEvent): void {
    if (!this.resizing) return;

    const dx = this.resizeStartX - event.clientX;
    const dy = this.resizeStartY - event.clientY;

    if (this.resizing === 'top' || this.resizing === 'corner') {
      const newH = Math.min(this.maxHeight, Math.max(this.minHeight, this.resizeStartH + dy));
      this.panelHeight = newH;
    }

    if (this.resizing === 'left' || this.resizing === 'corner') {
      const newW = Math.min(this.maxWidth, Math.max(this.minWidth, this.resizeStartW + dx));
      this.panelWidth = newW;
    }
  }

  @HostListener('document:mouseup')
  onMouseUp(): void {
    this.resizing = null;
    document.body.style.userSelect = '';
    document.body.style.cursor = '';
  }

  startResize(edge: 'top' | 'left' | 'corner', event: MouseEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.resizing = edge;
    this.resizeStartX = event.clientX;
    this.resizeStartY = event.clientY;
    this.resizeStartW = this.panelWidth;
    this.resizeStartH = this.panelHeight;
    document.body.style.userSelect = 'none';
    document.body.style.cursor = edge === 'top' ? 'ns-resize' : edge === 'left' ? 'ew-resize' : 'nwse-resize';
  }

  toggle(): void {
    this.isOpen = !this.isOpen;
    if (this.isOpen && this.messages.length === 0) {
      this.addBotMessage('Hi! I\'m your HotelIQ assistant. I can help you compare rooms, check pricing, find nearby events, or answer questions about the lodges. How can I help you today?');
    }
  }

  sendQuick(action: string): void {
    switch (action) {
      case 'compare':
        this.sendMessage('Compare all room types for my stay and tell me which is best value');
        break;
      case 'events':
        this.sendMessage('What events are happening near this lodge around my travel dates?');
        break;
      case 'bestValue':
        this.sendMessage('Which room gives me the best value for money considering amenities and pricing?');
        break;
      case 'pricingExplain':
        this.sendMessage('Why do the room prices differ and what factors affect the pricing?');
        break;
    }
  }

  sendMessage(text?: string): void {
    const msg = text || this.message.trim();
    if (!msg) return;

    this.addUserMessage(msg);
    this.message = '';
    this.loading = true;

    if (msg.toLowerCase().includes('compare') && this.propertyId && this.checkIn && this.checkOut) {
      this.chatbotService.compareRooms(this.propertyId, this.checkIn, this.checkOut).subscribe({
        next: (res) => {
          this.loading = false;
          this.addBotMessage(res.reply);
          this.addToHistory('user', msg);
          this.addToHistory('assistant', res.reply);
        },
        error: () => {
          this.loading = false;
          this.addBotMessage('Sorry, I couldn\'t compare rooms right now. Please try again.');
        },
      });
    } else {
      this.chatbotService.sendMessage(msg, this.propertyId || undefined, this.history, this.userLat ?? undefined, this.userLng ?? undefined).subscribe({
        next: (res) => {
          this.loading = false;
          this.addBotMessage(res.reply);
          this.addToHistory('user', msg);
          this.addToHistory('assistant', res.reply);
        },
        error: () => {
          this.loading = false;
          this.addBotMessage('Sorry, I\'m having trouble responding. Please try again.');
        },
      });
    }
  }

  private addUserMessage(text: string): void {
    this.messages.push({ role: 'user', content: text });
    setTimeout(() => this.scrollToBottom(), 50);
  }

  private addBotMessage(text: string): void {
    this.messages.push({ role: 'assistant', content: text });
    setTimeout(() => this.scrollToBottom(), 50);
  }

  private addToHistory(role: 'user' | 'assistant', content: string): void {
    this.history.push({ role, content });
    if (this.history.length > 10) {
      this.history = this.history.slice(-10);
    }
  }

  private scrollToBottom(): void {
    try {
      const el = this.elementRef.nativeElement.querySelector('.chat-messages');
      if (el) el.scrollTop = el.scrollHeight;
    } catch {}
  }

  onKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.sendMessage();
    }
  }
}
