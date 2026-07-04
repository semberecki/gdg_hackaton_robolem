import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { PrismaService } from './prisma.service';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class AppService {
  private adkAgentUrl = process.env.ADK_AGENT_URL || 'http://localhost:8081';

  constructor(
    private readonly prisma: PrismaService,
    private readonly httpService: HttpService
  ) {}

  private parseAgentJson(raw: string): any | null {
    const trimmed = raw.trim();
    if (!trimmed) {
      return null;
    }

    const fenced = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
    const candidate = fenced ? fenced[1].trim() : trimmed;

    try {
      return JSON.parse(candidate);
    } catch {
      const firstBrace = candidate.indexOf('{');
      const lastBrace = candidate.lastIndexOf('}');
      if (firstBrace === -1 || lastBrace <= firstBrace) {
        return null;
      }

      try {
        return JSON.parse(candidate.slice(firstBrace, lastBrace + 1));
      } catch {
        return null;
      }
    }
  }

  private extractPrinciples(result: any): any[] {
    const principles = result?.triz?.principles || result?.solutions;
    if (!Array.isArray(principles)) {
      return [];
    }

    return principles.map((principle: any) => ({
      id: principle.id ?? principle.principleId ?? null,
      name: principle.name ?? principle.principleName ?? '',
      description: principle.description ?? principle.principleDescription ?? '',
    }));
  }

  // ==========================================
  // Conversational Solving & Contradictions
  // ==========================================
  async solveContradiction(dto: { problemDescription: string }) {
    const guestUserId = 'guest-user';
    const defaultSessionId = 'global-session';

    const adkUrl = `${this.adkAgentUrl}/run`;

    // Standard Google ADK /run Request Body Payload
    const requestPayload = {
      appName: 'triz_agent',
      userId: guestUserId,
      sessionId: defaultSessionId,
      newMessage: {
        role: 'user',
        parts: [
          {
            text: dto.problemDescription,
          },
        ],
      },
    };

    let agentAdvice = '';
    let parsedPrinciples: any[] = [];
    let structuredResult: any | null = null;

    try {
      // Automatically pre-initialize the session in the ADK agent if it does not exist
      const sessionInitUrl = `${this.adkAgentUrl}/apps/triz_agent/users/${guestUserId}/sessions/${defaultSessionId}`;
      try {
        await firstValueFrom(this.httpService.post(sessionInitUrl, {}));
      } catch (err) {
        // Safe to ignore if session already exists
      }

      // Execute the direct run POST endpoint
      const response = await firstValueFrom(
        this.httpService.post(adkUrl, requestPayload)
      );

      const events = response.data;
      if (Array.isArray(events) && events.length > 0) {
        // Find the last event returned by the model to extract the finalized response text
        const modelEvent = [...events].reverse().find(
          (evt: any) => evt.content?.role === 'model' || evt.author === 'root_agent'
        );

        if (modelEvent && modelEvent.content?.parts?.[0]?.text) {
          agentAdvice = modelEvent.content.parts[0].text;
          structuredResult = this.parseAgentJson(agentAdvice);

          parsedPrinciples = this.extractPrinciples(structuredResult);
        } else {
          agentAdvice = JSON.stringify(events);
          structuredResult = this.parseAgentJson(agentAdvice);
        }
      } else {
        agentAdvice = JSON.stringify(response.data);
        structuredResult = this.parseAgentJson(agentAdvice);
      }
    } catch (error: any) {
      console.error('Error invoking ADK agent:', error.message);
      if (error.response?.data) {
        console.error('ADK detailed error payload:', JSON.stringify(error.response.data));
      }
      agentAdvice = `Failed to contact the AI problem solver. (Error: ${error.message}). Please ensure the ADK Agent API is running and configured correctly.`;
    }

    // Store the contradiction and solved advice directly in Cloud SQL
    return this.prisma.contradiction.create({
      data: {
        problemDescription: dto.problemDescription,
        principles: parsedPrinciples.length > 0 ? parsedPrinciples : [],
        result: structuredResult,
        advice: agentAdvice,
      },
    });
  }

  async getHistory() {
    return this.prisma.contradiction.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async rateSolution(id: string, rating: number) {
    return this.prisma.contradiction.update({
      where: { id },
      data: { rating },
    });
  }
}
