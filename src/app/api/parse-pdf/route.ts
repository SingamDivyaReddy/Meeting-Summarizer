// app/api/parse-pdf/route.ts

import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file provided.' }, { status: 400 });
    }

    if (!file.type.includes('pdf') && !file.name.endsWith('.pdf')) {
      return NextResponse.json({ error: 'File must be a PDF.' }, { status: 400 });
    }

    // Check file size (limit to 10MB to avoid memory issues)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: 'PDF file too large. Please use a file smaller than 10MB.' }, { status: 400 });
    }

    // For now, return a helpful message about PDF parsing limitations
    return NextResponse.json({ 
      error: 'PDF parsing is currently experiencing technical difficulties. Please try one of these alternatives:\n\n1. Convert your PDF to a text file (.txt) and upload that instead\n2. Copy and paste the text content directly into the transcript area\n3. Use a Word document (.docx) if available\n\nWe are working to resolve this issue. Thank you for your patience.' 
    }, { status: 503 });

  } catch (error) {
    console.error('Error in PDF route:', error);
    return NextResponse.json({ 
      error: 'Failed to process PDF file. Please try uploading a text file (.txt) instead.' 
    }, { status: 500 });
  }
}
