import { Request, Response } from 'express';
import { AIAgentService, ChatMessage } from '../services/aiAgentService.js';

export const chat = async (req: Request, res: Response) => {
  const { messages, api_key } = req.body;

  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: 'Body must include a "messages" array.' });
  }

  const aiService = AIAgentService.getInstance();
  const result = await aiService.chat(messages as ChatMessage[], api_key as string | undefined);

  return res.json(result);
};

export const getStatus = async (req: Request, res: Response) => {
  const aiService = AIAgentService.getInstance();
  const status = aiService.getApiKeyStatus();
  return res.json(status);
};

export const setConfig = async (req: Request, res: Response) => {
  const { api_key } = req.body;
  if (!api_key || typeof api_key !== 'string') {
    return res.status(400).json({ error: 'Valid "api_key" string required.' });
  }

  const aiService = AIAgentService.getInstance();
  aiService.setApiKey(api_key);
  const status = aiService.getApiKeyStatus();

  return res.json({
    message: 'Groq API Key successfully configured for AI Tactical Agent.',
    ...status
  });
};
