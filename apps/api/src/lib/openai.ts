import OpenAI from 'openai';
import { config } from '../config';

let openai: OpenAI | null = null;

export function getOpenAI(): OpenAI {
  if (!config.openaiApiKey) {
    throw new Error('OPENAI_API_KEY is not configured');
  }

  if (!openai) {
    openai = new OpenAI({
      apiKey: config.openaiApiKey,
    });
  }

  return openai;
}

export async function generateHealthInsights(prompt: string): Promise<string> {
  const client = getOpenAI();

  const response = await client.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content: `You are a helpful health assistant. Provide clear, informative insights based on the user's health data.
Always remind users to consult with healthcare professionals for medical advice. Keep responses concise and actionable.`,
      },
      {
        role: 'user',
        content: prompt,
      },
    ],
    temperature: 0.7,
    max_tokens: 1000,
  });

  return response.choices[0]?.message?.content || '';
}

export async function analyzeSymptoms(symptoms: any[]): Promise<string> {
  const symptomsList = symptoms
    .map((s) => `- ${s.title} (Severity: ${s.severity}/10, Body Region: ${s.bodyRegion})`)
    .join('\n');

  const prompt = `Analyze the following symptoms and provide insights about potential patterns or connections:

${symptomsList}

Please provide:
1. Any notable patterns or trends
2. Suggestions for tracking or monitoring
3. General wellness recommendations

Remember to emphasize that this is not a diagnosis and users should consult healthcare professionals.`;

  return generateHealthInsights(prompt);
}

export async function generateHealthReport(data: {
  symptoms: any[];
  conditions: any[];
  medications: any[];
  vitals: any[];
}): Promise<string> {
  const { symptoms, conditions, medications, vitals } = data;

  const prompt = `Generate a comprehensive health summary report based on the following data:

CURRENT CONDITIONS:
${conditions.map((c) => `- ${c.name} (Since: ${c.diagnosedAt || 'Unknown'})`).join('\n') || 'None recorded'}

MEDICATIONS:
${medications.map((m) => `- ${m.name} (${m.dosage})`).join('\n') || 'None recorded'}

RECENT SYMPTOMS (Last 30 days):
${symptoms.slice(0, 10).map((s) => `- ${s.title} (Severity: ${s.severity}/10)`).join('\n') || 'None recorded'}

RECENT VITALS:
${vitals.slice(0, 5).map((v) => `- ${v.type}: ${v.value} ${v.unit || ''}`).join('\n') || 'None recorded'}

Please provide:
1. Overall health summary
2. Notable trends or patterns
3. Areas that may need attention
4. General wellness recommendations

Keep the report professional and remind users to share this with their healthcare provider.`;

  return generateHealthInsights(prompt);
}