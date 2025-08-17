// app/api/parse-word/route.ts

import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file provided.' }, { status: 400 });
    }

    if (!file.type.includes('word') && !file.name.endsWith('.docx') && !file.name.endsWith('.doc')) {
      return NextResponse.json({ error: 'File must be a Word document (.doc or .docx).' }, { status: 400 });
    }

    try {
      // Try to import mammoth (will work if library is installed)
      const mammoth = require('mammoth');
      
      // Convert file to buffer
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      
      // Parse Word document
      const result = await mammoth.extractRawText({ buffer });
      const text = result.value;
      
      if (!text || text.trim().length === 0) {
        return NextResponse.json({ error: 'No text content found in Word document.' }, { status: 400 });
      }
      
      return NextResponse.json({ text: text.trim() });
      
    } catch (importError) {
      // If mammoth is not installed, return helpful error
      return NextResponse.json({ 
        error: 'Word document parsing library not installed. Please run: npm install mammoth' 
      }, { status: 501 });
    }

  } catch (error) {
    console.error('Error parsing Word document:', error);
    return NextResponse.json({ 
      error: 'Failed to parse Word document.' 
    }, { status: 500 });
  }
}
