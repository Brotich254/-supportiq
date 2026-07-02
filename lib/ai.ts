import OpenAI from 'openai';
import { db } from './db';

export const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

/**
 * Generate embedding for a text string.
 * Used for knowledge base semantic search.
 */
export async function embed(text: string): Promise<number[]> {
  const res = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: text.slice(0, 8000), // token limit safety
  });
  return res.data[0].embedding;
}

/**
 * Find the most relevant knowledge docs for a query using cosine similarity.
 * Uses raw SQL with pgvector because Prisma doesn't support vector ops yet.
 */
export async function searchKnowledge(orgId: string, query: string, limit = 5) {
  const queryEmbedding = await embed(query);
  const vectorStr = `[${queryEmbedding.join(',')}]`;

  // pgvector cosine distance: <=> operator
  const results = await db.$queryRaw<{ id: string; title: string; content: string; distance: number }[]>`
    SELECT id, title, content,
           embedding <=> ${vectorStr}::vector AS distance
    FROM "KnowledgeDoc"
    WHERE "orgId" = ${orgId}
      AND embedding IS NOT NULL
    ORDER BY distance ASC
    LIMIT ${limit}
  `;

  return results.filter((r) => r.distance < 0.4); // only return relevant results
}

/**
 * Build the system prompt for a given org with knowledge context.
 */
export function buildSystemPrompt(
  orgName: string,
  greeting: string,
  knowledgeDocs: { title: string; content: string }[]
): string {
  const context = knowledgeDocs.length > 0
    ? `\n\nHere is the knowledge base you can use to answer questions:\n\n${
        knowledgeDocs.map((d) => `## ${d.title}\n${d.content}`).join('\n\n')
      }`
    : '';

  return `You are a helpful customer support AI assistant for ${orgName}.

Your greeting: "${greeting}"

Core behavior:
- Be concise, friendly, and professional
- Answer questions based on the provided knowledge base
- If you don't know the answer or the question is complex/sensitive, say: "I'd like to connect you with a human agent who can better assist you." and set escalate=true in your response
- Never make up information not in the knowledge base
- Keep responses under 150 words unless a detailed explanation is needed
- If the customer seems frustrated, always offer to escalate

Response format: JSON with fields:
{
  "message": "your response text",
  "escalate": false,
  "confidence": 0.9
}${context}`;
}

export interface AIResponse {
  message: string;
  escalate: boolean;
  confidence: number;
}

/**
 * Get AI response for a conversation turn.
 */
export async function getAIResponse(
  orgId: string,
  orgName: string,
  greeting: string,
  conversationHistory: { role: 'user' | 'assistant'; content: string }[],
  userMessage: string
): Promise<AIResponse> {
  // Semantic search for relevant docs
  const relevantDocs = await searchKnowledge(orgId, userMessage);

  const systemPrompt = buildSystemPrompt(orgName, greeting, relevantDocs);

  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: systemPrompt },
      ...conversationHistory.slice(-10), // last 10 messages for context
      { role: 'user', content: userMessage },
    ],
    temperature: 0.3,
    max_tokens: 500,
    response_format: { type: 'json_object' },
  });

  try {
    const parsed = JSON.parse(response.choices[0].message.content || '{}');
    return {
      message: parsed.message || "I'm sorry, I couldn't process that. Let me connect you with an agent.",
      escalate: parsed.escalate === true,
      confidence: typeof parsed.confidence === 'number' ? parsed.confidence : 0.5,
    };
  } catch {
    return {
      message: "I'm having trouble processing your request. Let me connect you with a human agent.",
      escalate: true,
      confidence: 0,
    };
  }
}
