import { ChangeDetectorRef, Component, ElementRef, OnInit, ViewChild, inject } from '@angular/core';
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

interface TrizPrinciple {
  id: number;
  name: string;
  description: string;
}

interface DeliveryRoute {
  name: string;
  status: 'Live' | 'Planning' | 'At risk';
  households: number;
  distance: string;
  load: string;
  reliability: string;
}

interface FieldSite {
  name: string;
  type: string;
  capacity: string;
  state: string;
}

interface StormCard {
  label: string;
  text: string;
  tone: 'event' | 'command' | 'policy' | 'risk';
}

interface TimelineStep {
  phase: string;
  outcome: string;
  owner: string;
}

interface PipelineStep {
  id: string;
  label: string;
}

@Component({
  imports: [CommonModule, FormsModule],
  selector: 'app-root',
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App implements OnInit {
  @ViewChild('planningPrompt') planningPrompt?: ElementRef<HTMLTextAreaElement>;

  private http = inject(HttpClient);
  private cdr = inject(ChangeDetectorRef);

  protected title = 'Build with AI Wroclaw';

  backendUrl = '/api';
  showSettings = false;
  activeView: 'tool' | 'eventStorming' = 'tool';

  messages: ChatMessage[] = [];
  userInput = '';
  sdg7Prompt = `Problem 3: Delivering Electricity to Remote Populations (SDG 7)

Hundreds of millions of people, mostly in rural areas, still lack access to electricity. Centralized power grids deliver stable, high-capacity electricity but are extremely costly and slow to extend across remote, low-density terrain. Alternative approaches like solar panels and battery systems can be deployed quickly almost anywhere, but currently fall short of matching a grid connection's reliability and capacity. Access to electricity underpins healthcare, education, small business, and food storage, impairing community development.

Your task: propose a way to deliver electricity that is both fast to deploy and reliably matches the demand of a growing rural population. And no! Batteries are not a solution. We dont want to produce even more waste.`;
  isLoading = false;
  history: any[] = [];

  pipelineSteps: PipelineStep[] = [
    { id: '01', label: 'Problem' },
    { id: '02', label: 'TRIZ' },
    { id: '03', label: 'SCAMPER' },
    { id: '04', label: 'Judge' },
    { id: '05', label: 'Results' },
  ];

  examples = [
    'Extending electricity access to remote rural villages without expensive grid infrastructure and without using batteries.',
    'Reducing maintenance cost while keeping rural clinic refrigeration and lighting reliable during faults.',
    'Deploying a village-scale energy system quickly while demand grows after businesses receive power.',
  ];

  routes: DeliveryRoute[] = [
    {
      name: 'North ridge feeder',
      status: 'Live',
      households: 2840,
      distance: '42 km',
      load: '1.8 MW',
      reliability: '97.4%',
    },
    {
      name: 'River valley microgrid',
      status: 'Planning',
      households: 3960,
      distance: '28 km',
      load: '2.4 MW',
      reliability: '95.9%',
    },
    {
      name: 'Forest health corridor',
      status: 'At risk',
      households: 1710,
      distance: '19 km',
      load: '940 kW',
      reliability: '91.2%',
    },
  ];

  sites: FieldSite[] = [
    {
      name: 'Solar hub A',
      type: 'Generation',
      capacity: '3.2 MWp',
      state: 'Commissioned',
    },
    {
      name: 'Biomass firming unit',
      type: 'Dispatchable source',
      capacity: '1.1 MW',
      state: 'Permitting',
    },
    {
      name: 'Clinic priority loop',
      type: 'Critical load',
      capacity: '24 facilities',
      state: 'Design lock',
    },
  ];

  stormCards: StormCard[] = [
    {
      label: 'Command',
      text: 'Prioritize clinic, school, cold-chain, and enterprise loads before household expansion.',
      tone: 'command',
    },
    {
      label: 'Domain event',
      text: 'Village demand doubles after first productive-use appliances come online.',
      tone: 'event',
    },
    {
      label: 'Policy',
      text: 'No electrochemical batteries: design for firming, scheduling, and maintainable redundancy.',
      tone: 'policy',
    },
    {
      label: 'Risk',
      text: 'Long feeder repairs can isolate ridge settlements during monsoon access windows.',
      tone: 'risk',
    },
    {
      label: 'Domain event',
      text: 'Local operator completes modular maintenance route and restores priority loop.',
      tone: 'event',
    },
    {
      label: 'Command',
      text: 'Generate TRIZ alternatives for fast deployment without sacrificing growing load capacity.',
      tone: 'command',
    },
  ];

  rolloutSteps: TimelineStep[] = [
    {
      phase: 'Discover',
      outcome: 'Map constraints, social load priorities, and terrain bottlenecks.',
      owner: 'Field team',
    },
    {
      phase: 'Storm',
      outcome: 'Turn events, commands, policies, and risks into design options.',
      owner: 'Facilitator',
    },
    {
      phase: 'Solve',
      outcome: 'Use TRIZ and SCAMPER to compare delivery strategies.',
      owner: 'AI planner',
    },
    {
      phase: 'Deploy',
      outcome: 'Sequence modular assets, operator training, and reliability checks.',
      owner: 'Implementation lead',
    },
  ];

  getAssistantText(res: any): string {
    if (res.result?.solutions?.length) {
      const solutionCount = res.result.solutions.length;
      const variantCount = this.getVariantCount(res.result);
      return `I found ${solutionCount} TRIZ solution${solutionCount === 1 ? '' : 's'} and ${variantCount} SCAMPER variant${variantCount === 1 ? '' : 's'}. Review the grouped results below.`;
    }

    return res.result?.summary || res.result?.finalRecommendations?.join('\n') || res.advice || '';
  }

  getHistorySummary(log: any): string {
    const summary = log.result?.summary || log.result?.finalRecommendations?.join(' ');
    const text = summary || log.advice || '';
    return text.length > 160 ? `${text.slice(0, 160)}...` : text;
  }

  getVariantCount(result: any): number {
    return (
      result?.solutions?.reduce(
        (total: number, solution: any) => total + (solution.scamperVariants?.length || 0),
        0
      ) || 0
    );
  }

  ngOnInit() {
    const savedBackendUrl = localStorage.getItem('buildwithai_backend_url');
    if (savedBackendUrl) {
      this.backendUrl = savedBackendUrl;
    }

    this.messages.push({
      sender: 'assistant',
      text: 'Welcome. Describe a rural electricity delivery contradiction, terrain constraint, load pattern, or maintenance bottleneck. I will use TRIZ principles and SCAMPER variants to structure possible solutions.',
      timestamp: new Date(),
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

  setView(view: 'tool' | 'eventStorming') {
    this.activeView = view;
  }

  usePrompt(prompt: string) {
    this.userInput = prompt;
    this.activeView = 'tool';
    setTimeout(() => {
      this.planningPrompt?.nativeElement.focus({ preventScroll: true });
    }, 0);
  }

  renderMarkdown(text: string): string {
    if (!text) return '';

    let html = text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

    html = html.replace(/^### (.*$)/gim, '<h4 class="md-h4">$1</h4>');
    html = html.replace(/^## (.*$)/gim, '<h3 class="md-h3">$1</h3>');
    html = html.replace(/^# (.*$)/gim, '<h2 class="md-h2">$1</h2>');
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/^\s*[*-]\s+(.*$)/gim, '<li class="md-li">$1</li>');
    html = html.replace(/\n/g, '<br>');

    return html;
  }

  send() {
    if (!this.userInput.trim() || this.isLoading) return;

    const userText = this.userInput.trim();
    this.userInput = '';
    this.isLoading = true;
    this.activeView = 'tool';

    this.messages = [
      ...this.messages,
      {
        sender: 'user',
        text: userText,
        timestamp: new Date(),
      }
    ];

    this.autoScrollToPlanner();

    this.http
      .post<any>(`${this.backendUrl}/solve`, {
        problemDescription: userText,
      })
      .subscribe({
        next: (res) => {
          this.messages = [
            ...this.messages,
            {
              sender: 'assistant',
              text: this.getAssistantText(res),
              id: res.id,
              principles: res.principles || [],
              result: res.result,
              rating: res.rating || 0,
              timestamp: new Date(res.createdAt || Date.now()),
            },
          ];

          this.isLoading = false;
          this.loadHistory();
          this.autoScrollToPlanner();
          this.cdr.detectChanges();
        },
        error: (err) => {
          this.isLoading = false;
          this.messages = [
            ...this.messages,
            {
              sender: 'assistant',
              text: `Failed to contact the planning backend. Check the API endpoint in Settings.\n(Error: ${err.message})`,
              timestamp: new Date(),
            },
          ];
          this.autoScrollToPlanner();
          this.cdr.detectChanges();
        },
      });
  }

  autoScrollToPlanner() {
    setTimeout(() => {
      document.querySelector('.planner-thread')?.scrollTo({
        top: document.querySelector('.planner-thread')?.scrollHeight || 0,
        behavior: 'smooth',
      });
    }, 100);
  }

  loadHistory() {
    this.http.get<any[]>(`${this.backendUrl}/history`).subscribe({
      next: (data) => {
        this.history = data;
      },
      error: (err) => {
        console.error('Failed to load planning history:', err);
      },
    });
  }

  rate(id: string, rating: number, msgItem?: ChatMessage, historyItem?: any) {
    this.http
      .post<any>(`${this.backendUrl}/solutions/${id}/rate`, { rating })
      .subscribe({
        next: () => {
          if (msgItem) {
            msgItem.rating = rating;
          }
          if (historyItem) {
            historyItem.rating = rating;
          }
          this.loadHistory();
        },
      });
  }

  rateMessage(msg: ChatMessage, rating: number) {
    if (msg.id) {
      this.rate(msg.id, rating, msg);
    }
  }
}
