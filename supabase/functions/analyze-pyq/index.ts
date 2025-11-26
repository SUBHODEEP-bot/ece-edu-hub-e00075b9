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
    
    // Convert to text
    const text = new TextDecoder('utf-8', { fatal: false }).decode(bytes);
    
    // Enhanced PDF text extraction
    // Extract text between parentheses (most common in PDFs for actual content)
    const textPattern = /\(([^()]+)\)/g;
    const extractedParts: string[] = [];
    
    let match;
    while ((match = textPattern.exec(text)) !== null) {
      if (match[1]) {
        // Clean up PDF escape sequences
        let cleaned = match[1]
          .replace(/\\n/g, '\n')
          .replace(/\\r/g, '\n')
          .replace(/\\t/g, ' ')
          .replace(/\\\(/g, '(')
          .replace(/\\\)/g, ')')
          .replace(/\\\\/g, '\\')
          .trim();
        
        // Only include if it contains meaningful text (has letters and some length)
        if (cleaned.length > 2 && /[a-zA-Z]/.test(cleaned)) {
          extractedParts.push(cleaned);
        }
      }
    }
    
    // Join with spaces and clean up
    const extractedText = extractedParts
      .join(' ')
      .replace(/\s+/g, ' ')
      .replace(/\n+/g, '\n')
      .trim();
    
    console.log('Extracted text sample (first 200 chars):', extractedText.substring(0, 200));
    console.log('Extracted text sample (last 200 chars):', extractedText.substring(Math.max(0, extractedText.length - 200)));
    
    if (extractedText.length < 100) {
      throw new Error('Could not extract sufficient text from PDF. The PDF might be image-based or encrypted. Please try a text-based PDF or convert to TXT file.');
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

    const systemPrompt = `You are analyzing a Previous Year Question Paper. The content below is extracted from the PDF.

CRITICAL - YOU MUST FOLLOW THESE INSTRUCTIONS EXACTLY:

1. READ the text carefully and identify ALL questions present
2. For "repeatedQuestions": Copy the EXACT question text word-for-word from the paper
3. For "topic": Extract the ACTUAL subject/topic from each question (e.g., "Diode Circuits", "Transistor Biasing", "Amplifiers", "Digital Circuits", "Signal Processing")
4. For "topicWeightage": Count how many questions belong to each topic
5. For "predictedQuestions": Create NEW questions based on the topics and patterns you found

ABSOLUTELY FORBIDDEN:
- DO NOT use placeholder text like "Actual full question text from the paper"
- DO NOT use generic topics like "Unidentified Topic 1"
- DO NOT make up questions that aren't there
- The "repeatedQuestions" field MUST contain word-for-word questions from the paper

REQUIRED OUTPUT FORMAT (JSON only):
{
  "topicWeightage": [
    {"topic": "Real Topic Name from Questions", "count": 5, "percentage": 25.0}
  ],
  "difficulty": "easy|medium|hard",
  "repeatedQuestions": [
    {"question": "EXACT question text copied from paper", "topic": "specific-topic", "importance": 0.95}
  ],
  "predictedQuestions": [
    {"question": "New predicted question", "probability": 0.85, "reason": "Why this might appear", "topic": "topic-name"}
  ]
}

Minimum requirements:
- 10+ questions in repeatedQuestions (real questions from paper)
- 5-8 topics in topicWeightage
- 8-12 predicted questions
- Return ONLY valid JSON, no other text`;

    console.log('Calling Gemini API with optimized settings for deep analysis');
    
    // Use gemini-2.0-flash with optimized settings for comprehensive analysis
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
          temperature: 0.1,      // Lower for more focused, deterministic analysis
          topK: 64,              // Higher for better quality
          topP: 0.98,            // Higher for comprehensive responses
          maxOutputTokens: 16384, // Maximum tokens for detailed analysis
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
      status: 200,
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
