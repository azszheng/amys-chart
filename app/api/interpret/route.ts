import Anthropic from '@anthropic-ai/sdk';
import type { NatalChart } from '@/lib/astro/types';
import type { InterpretSection, InterpretMode } from '@/lib/ai/prompts';
import { buildSystemPrompt, buildChartContext } from '@/lib/ai/prompts';

export const maxDuration = 60;

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const MODEL = process.env.CLAUDE_MODEL ?? 'claude-sonnet-4-6';

const MAX_TOKENS: Record<InterpretMode, number> = {
  essence:    400,
  deepdive:   800,
  astrologer: 1200,
};

function getLifeStageNote(age: number): string {
  if (age < 25) return `This person is ${age} — navigating identity formation, separating from family conditioning, and the first serious confrontations with authentic selfhood. Calibrate for emerging adulthood: themes of belonging, insecurity, early relational patterning, and the not-yet-formed sense of self.`;
  if (age < 28) return `This person is ${age} — mid-to-late twenties, building real autonomy, confronting the first serious relational patterns, approaching the Saturn return. Calibrate for pre-return pressure: career direction, relational choices, and the growing gap between who they were raised to be and who they actually are.`;
  if (age <= 30) return `This person is ${age} — in or near their Saturn return. Calibrate for the rite of passage into real adulthood: accountability, restructuring, shedding inherited roles, discovering what they can actually build on.`;
  if (age < 40) return `This person is ${age} — in their thirties, a period typically organized around embodiment, healing early wounds, deepening commitments, and building structures that reflect who they actually are. Calibrate for developing maturity and path-building.`;
  if (age < 50) return `This person is ${age} — approaching or in the Uranus opposition and midlife individuation. Calibrate for liberation themes: dismantling false roles, reclaiming unlived parts of the self, and the question of what the second half of life is actually for.`;
  return `This person is ${age} — in their fifties or beyond. Calibrate for integration, legacy, and synthesis: what endures, what is ready to be released, and the shift from accumulation to wisdom.`;
}

export async function POST(req: Request) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return new Response(JSON.stringify({ error: 'ANTHROPIC_API_KEY not configured' }), { status: 503 });
  }

  const { chart, section, mode = 'deepdive' }: { chart: NatalChart; section: InterpretSection; mode: InterpretMode } = await req.json();

  const birthYear = parseInt(chart.input.date?.slice(0, 4) ?? '1990', 10);
  const age = new Date().getFullYear() - birthYear;
  const lifeStageNote = age >= 10 && age <= 100 ? getLifeStageNote(age) : '';

  const systemPrompt = buildSystemPrompt(mode, lifeStageNote);
  const chartContext = buildChartContext(chart);
  const maxTokens = MAX_TOKENS[mode] ?? 800;
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      try {
        const response = client.messages.stream({
          model: MODEL,
          max_tokens: maxTokens,
          system: [
            { type: 'text', text: systemPrompt, cache_control: { type: 'ephemeral' } },
          ],
          messages: [{
            role: 'user',
            content: [
              { type: 'text', text: `CHART DATA:\n${chartContext}`, cache_control: { type: 'ephemeral' } },
              { type: 'text', text: section.prompt },
            ],
          }],
        } as Parameters<typeof client.messages.stream>[0]);

        for await (const event of response) {
          if (
            event.type === 'content_block_delta' &&
            event.delta.type === 'text_delta'
          ) {
            const chunk = `data: ${JSON.stringify({ token: event.delta.text })}\n\n`;
            controller.enqueue(encoder.encode(chunk));
          }
        }

        controller.enqueue(encoder.encode('data: [DONE]\n\n'));
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: msg })}\n\n`));
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}
