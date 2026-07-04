import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface ChatMessage {
  sender: 'user' | 'assistant';
  text: string;
  id?: string;
  principles?: any[];
  result?: any;
  rating?: number;
  timestamp: Date;
}

@Component({
  imports: [CommonModule, FormsModule],
  selector: 'app-root',
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App implements OnInit {
  protected title = 'BuildWithAI Chat';
  
  // Dynamic API configuration - relative path routes through Nginx proxy
  backendUrl = '/api';
  showSettings = false;

  // Conversational Messages Stream
  messages: ChatMessage[] = [];
  userInput = '';
  isLoading = false;

  // Global solution logs (sidebar/bottom)
  history: any[] = [];

  constructor(private http: HttpClient, private cdr: ChangeDetectorRef) {}

  // Pure-TS lightweight markdown renderer for clean, fast rendering without dependencies
  renderMarkdown(text: string): string {
    if (!text) return '';
    
    // 1. Escape HTML first to prevent raw script injections (keeps it secure!)
    let html = text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

    // 2. Format Headers (### -> h4, ## -> h3, # -> h2)
    html = html.replace(/^### (.*$)/gim, '<h4 class="md-h4">$1</h4>');
    html = html.replace(/^## (.*$)/gim, '<h3 class="md-h3">$1</h3>');
    html = html.replace(/^# (.*$)/gim, '<h2 class="md-h2">$1</h2>');

    // 3. Format Bold text (**text** -> <strong>text</strong>)
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

    // 4. Format List Items (• or * or - at start of line)
    html = html.replace(/^\s*[\*•\-]\s+(.*$)/gim, '<li class="md-li">$1</li>');

    // 5. Format Line Breaks
    html = html.replace(/\n/g, '<br>');

    return html;
  }

  getAssistantText(res: any): string {
    return res.result?.summary || res.result?.finalRecommendations?.join('\n') || res.advice || '';
  }

  getHistorySummary(log: any): string {
    const summary = log.result?.summary || log.result?.finalRecommendations?.join(' ');
    const text = summary || log.advice || '';
    return text.length > 160 ? `${text.slice(0, 160)}...` : text;
  }

  ngOnInit() {
    // Restore backend URL if saved
    const savedBackendUrl = localStorage.getItem('buildwithai_backend_url');
    if (savedBackendUrl) {
      this.backendUrl = savedBackendUrl;
    }

    // Insert welcome greeting from BuildWithAI
    this.messages.push({
      sender: 'assistant',
      text: "Hello! I am BuildWithAI, your conversational engineering companion. Ask me general questions, or describe an engineering problem statement (e.g., 'I want speeds to improve, but memory is worsening') to trigger my built-in TRIZ MCP tool and generate customized software recommendations!",
      timestamp: new Date()
    });

    this.loadHistory();
  }

  saveSettings() {
    localStorage.setItem('buildwithai_backend_url', this.backendUrl);
    this.showSettings = false;
    this.loadHistory();
  }

  resetSettings() {
    this.backendUrl = '/api';
    localStorage.removeItem('buildwithai_backend_url');
    this.showSettings = false;
    this.loadHistory();
  }

  // ==========================================
  // Conversational Dispatcher
  // ==========================================
  send() {
    if (!this.userInput.trim() || this.isLoading) return;

    const userText = this.userInput.trim();
    this.userInput = '';
    this.isLoading = true;
// Render user bubble immediately with an immutable array reference
this.messages = [
  ...this.messages,
  {
    sender: 'user',
    text: userText,
    timestamp: new Date()
  }
];

console.log('Angular solving request initiated for input:', userText);
this.autoScrollToBottom();

// Fire POST call to backend
this.http.post<any>(`${this.backendUrl}/solve`, {
  problemDescription: userText
}).subscribe({
  next: (res) => {
    console.log('Angular received successful JSON payload:', res);

    // Render AI bubble with an immutable array reference
    this.messages = [
      ...this.messages,
      {
        sender: 'assistant',
        text: this.getAssistantText(res),
        id: res.id,
        principles: res.principles || [],
        result: res.result,
        rating: res.rating || 0,
        timestamp: new Date(res.createdAt)
      }
    ];

    this.isLoading = false;
    console.log('Angular state updated. isLoading set to false. Pushed assistant message.');
    this.loadHistory();
    this.autoScrollToBottom();
    this.cdr.detectChanges();
  },
  error: (err) => {
    console.error('Angular received HTTP error payload:', err);
    this.isLoading = false;
    this.messages = [
      ...this.messages,
      {
        sender: 'assistant',
        text: `🚨 Failed to contact backend. Please double check your Endpoint under Settings.\n(Error: ${err.message})`,
        timestamp: new Date()
      }
    ];
    this.autoScrollToBottom();
    this.cdr.detectChanges();
  }
});
}

autoScrollToBottom() {
  setTimeout(() => {
    try {
      const contentArea = document.querySelector('.content-area');
      if (contentArea) {
        contentArea.scrollTo({
          top: contentArea.scrollHeight,
          behavior: 'smooth'
        });
      }
    } catch (e) {
      console.error('Auto-scroll failed:', e);
    }
  }, 100);
}

loadHistory() {
    this.http.get<any[]>(`${this.backendUrl}/history`).subscribe({
      next: (data) => {
        this.history = data;
      },
      error: (err) => {
        console.error('Failed to load global history:', err);
      }
    });
  }

  rate(id: string, rating: number, msgItem?: ChatMessage, historyItem?: any) {
    this.http.post<any>(`${this.backendUrl}/solutions/${id}/rate`, { rating }).subscribe({
      next: (updatedRecord) => {
        if (msgItem) {
          msgItem.rating = rating;
        }
        if (historyItem) {
          historyItem.rating = rating;
        }
        this.loadHistory();
      }
    });
  }
}
