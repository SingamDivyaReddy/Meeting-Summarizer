// app/api/summarize/route.ts

import { NextRequest, NextResponse } from 'next/server';
import Groq from 'groq-sdk';

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

export async function POST(req: NextRequest) {
  try {
    const { transcript, prompt } = await req.json();

    if (!transcript || !prompt) {
      return NextResponse.json({ error: 'Transcript and prompt are required.' }, { status: 400 });
    }

    const chatCompletion = await groq.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: 'You are a helpful assistant designed to summarize meeting transcripts based on user-provided instructions. Be clear, concise, and structured.',
        },
        {
          role: 'user',
          content: `Instruction: "${prompt}". \n\nTranscript to summarize:\n${transcript}`,
        },
      ],
      model: 'llama3-8b-8192', // Or any other suitable model like 'mixtral-8x7b-32768'
    });

    const summary = chatCompletion.choices[0]?.message?.content || 'No summary generated.';

    return NextResponse.json({ summary });
  } catch (error) {
    console.error('Error generating summary:', error);
    return NextResponse.json({ error: 'Failed to generate summary.' }, { status: 500 });
  }
}