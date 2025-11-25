import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

async function extractTextFromPDFBase64(base64Data: string): Promise<string> {
  // Decode base64 to ArrayBuffer
  const binaryString = atob(base64Data);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  
  // Use pdf-parse from esm.sh CDN
  const pdfParse = await import('https://esm.sh/pdf-parse@1.1.1');
  const data = await pdfParse.default(bytes.buffer);
  
  return data.text;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { extractedText, pdfBase64, isPdf } = await req.json();
    
    let textToAnalyze = extractedText;

    // If it's a PDF, extract text from base64
    if (isPdf && pdfBase64) {
      console.log('Extracting text from PDF base64...');
      textToAnalyze = await extractTextFromPDFBase64(pdfBase64);
      console.log('Extracted text length:', textToAnalyze.length);
    }
    
    if (!textToAnalyze || textToAnalyze.trim().length === 0) {
      throw new Error('No text content extracted from document');
    }

    const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');
    if (!GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY is not configured');
    }

    const systemPrompt = `You are an AI exam intelligence system for Electronics & Communication Engineering.
Analyze the given Previous Year Questions and return ONLY valid JSON with:

1. A cleaned canonical version of each question
2. Topic tags for each (network-theory, signal-system, analog-electronics, digital-electronics, communication-system, electromagnetics, microprocessor, etc.)
3. An importance score (0.0–1.0)
4. Topic frequency and weightage
5. Overall difficulty estimate (easy/medium/hard)
6. Predict 5–12 most likely questions for next year with probability and reason.

Return ONLY JSON. No explanations.`;

    console.log('Calling Gemini API...');
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: `${systemPrompt}\n\nPrevious Year Questions to analyze:\n\n${textToAnalyze}`
          }]
        }],
        generationConfig: {
          temperature: 0.2,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 8192,
        }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Gemini API error:', response.status, errorText);
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const data = await response.json();
    const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!generatedText) {
      throw new Error('No response from Gemini API');
    }

    console.log('Gemini response received');

    // Extract JSON from response (removing markdown code blocks if present)
    let jsonText = generatedText.trim();
    if (jsonText.startsWith('```json')) {
      jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?$/g, '');
    } else if (jsonText.startsWith('```')) {
      jsonText = jsonText.replace(/```\n?/g, '');
    }

    const analysisResult = JSON.parse(jsonText);

    return new Response(JSON.stringify({ analysis: analysisResult }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in analyze-pyq function:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error occurred' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
