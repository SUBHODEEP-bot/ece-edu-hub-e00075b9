import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

async function extractTextFromPDFBase64(base64Data: string): Promise<string> {
  try {
    // Decode base64 to Uint8Array
    const binaryString = atob(base64Data);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    
    console.log('PDF bytes length:', bytes.length);
    
    // Use a simple regex-based text extraction for PDFs
    // This extracts visible text from PDF structure
    const text = new TextDecoder().decode(bytes);
    
    // Extract text between stream objects and filter out binary data
    const textMatches = text.match(/\((.*?)\)/g) || [];
    const extractedText = textMatches
      .map(match => match.slice(1, -1))
      .filter(text => text.length > 2 && /[a-zA-Z0-9]/.test(text))
      .join(' ')
      .replace(/\\n/g, '\n')
      .replace(/\s+/g, ' ')
      .trim();
    
    if (extractedText.length < 50) {
      throw new Error('Insufficient text extracted from PDF. Please ensure the PDF contains readable text.');
    }
    
    return extractedText;
  } catch (error) {
    console.error('PDF extraction error:', error);
    throw new Error(`Failed to extract text from PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
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

    console.log('API Key exists, length:', GEMINI_API_KEY.length);

    const systemPrompt = `Analyze the entire Previous Year Question Paper and provide exam preparation insights.

Your task:
1. Extract ALL questions from the paper
2. Identify the TOP 10-15 MOST IMPORTANT questions (highest priority for students)
3. Find the MOST IMPORTANT topics with highest marks/frequency
4. Predict 8-12 questions most likely to appear in next exam based on patterns

Return ONLY this JSON:

{
  "topicWeightage": [{"topic": "Topic Name", "count": 15, "percentage": 35.0}],
  "difficulty": "easy|medium|hard",
  "repeatedQuestions": [{"question": "Full important question text", "topic": "topic-name", "importance": 0.95}],
  "predictedQuestions": [{"question": "Predicted question", "probability": 0.85, "reason": "Why likely to appear", "topic": "topic-name"}]
}

Rules:
- Sort repeatedQuestions by importance (0.0-1.0, highest first) - minimum 10 questions
- Sort topicWeightage by percentage (highest first) - top 5-8 topics
- predictedQuestions should have 8-12 items sorted by probability
- Return ONLY valid JSON, no markdown, no text outside JSON`;

    console.log('Calling Gemini API with model: gemini-2.0-flash');
    
    // Use gemini-2.0-flash model with v1beta endpoint
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;
    
    const response = await fetch(apiUrl, {
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
      console.error('Please verify your GEMINI_API_KEY is valid at: https://aistudio.google.com/app/apikey');
      throw new Error(`Gemini API error: ${response.status} - ${errorText}`);
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

    let analysisResult;
    try {
      analysisResult = JSON.parse(jsonText);
    } catch (parseError) {
      console.error('JSON parse error:', parseError);
      console.error('Failed JSON text (first 500 chars):', jsonText.substring(0, 500));
      console.error('Failed JSON text (last 500 chars):', jsonText.substring(jsonText.length - 500));
      
      // Try to fix common JSON issues
      try {
        // Remove trailing commas before closing braces/brackets
        const fixedJson = jsonText
          .replace(/,(\s*[}\]])/g, '$1')
          .replace(/(['"])?([a-zA-Z0-9_]+)(['"])?:/g, '"$2":'); // Fix unquoted keys
        
        analysisResult = JSON.parse(fixedJson);
        console.log('Successfully parsed JSON after fixes');
      } catch (secondError) {
        throw new Error('Failed to parse AI response as valid JSON. Please try again with a different document or smaller file.');
      }
    }

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
