import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { PrismaService } from './prisma.service';
import { Prisma } from '@prisma/client';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class AppService {
  private adkAgentUrl = process.env.ADK_AGENT_URL || 'http://localhost:8081';

  constructor(
    private readonly prisma: PrismaService,
    private readonly httpService: HttpService
  ) {}

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

          // Clean, on-the-fly metadata parsing: check if the AI response mentioned any standard TRIZ principles!
          // This allows us to keep the database logging simple, yet highly structured.
          const lowerAdvice = agentAdvice.toLowerCase();
          if (lowerAdvice.includes('principle 10') || lowerAdvice.includes('prior action')) {
            parsedPrinciples.push({
              id: 10,
              name: 'Prior Action',
              description: 'Perform the required change of an object before it is needed.',
            });
          }
          if (lowerAdvice.includes('principle 2') || lowerAdvice.includes('taking out')) {
            parsedPrinciples.push({
              id: 2,
              name: 'Taking Out',
              description: 'Separate the troublesome part/property from the object.',
            });
          }
          if (lowerAdvice.includes('principle 26') || lowerAdvice.includes('copying')) {
            parsedPrinciples.push({
              id: 26,
              name: 'Copying',
              description: 'Use a simpler/cheaper copy instead of an expensive/fragile object.',
            });
          }
          if (lowerAdvice.includes('principle 35') || lowerAdvice.includes('parameter changes')) {
            parsedPrinciples.push({
              id: 35,
              name: 'Parameter Changes',
              description: 'Change physical state, concentration, density, temperature, or volume.',
            });
          }
        } else {
          agentAdvice = JSON.stringify(events);
        }
      } else {
        agentAdvice = JSON.stringify(response.data);
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
