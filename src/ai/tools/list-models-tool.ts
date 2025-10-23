
'use server';

import {ai} from '@/ai/genkit';
import {listModels} from 'genkit';
import {z} from 'zod';

export const listModelsTool = ai.defineTool(
  {
    name: 'listModelsTool',
    description: 'List available AI models',
    inputSchema: z.void(),
    outputSchema: z.array(z.string()),
  },
  async () => {
    const models = await listModels();
    return models
      .map(m => m.name.replace('googleai/', ''))
      .filter(m => m.startsWith('gemini'));
  }
);
