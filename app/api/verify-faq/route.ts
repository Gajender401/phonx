import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const VERIFICATION_TIMEOUT = 120000; // 2 minutes in milliseconds

export async function POST(request: NextRequest) {
  try {
    const { question, how_to_answer } = await request.json();

    if (!question || !how_to_answer) {
      return NextResponse.json(
        { error: 'Question and how_to_answer are required' },
        { status: 400 }
      );
    }

    // Create the prompt template
    const prompt = `
You are an insurance question-and-answer verifier.

Your job:
1. Check if the question and its provided answer logically match and are factually correct in an insurance context.
Do not be too harsh when comparing if the answer has the same context even if information may be missing it can parse the only time you should raise not approved is when the question and the answer are completely unrelated.
You can provide up to 4 suggestions but you can do 1 or 2 as well doesn't have to be 4
2. If they fit → return only:
{"status": "Approved"}

3. If they do NOT fit → return:
{
  "status": "Not Approved",
  "suggestions": {
    "1": "Make suggestion 1 (insurance-specific)",
    "2": "Make suggestion 2 (insurance-specific)",
    "3": "Make suggestion 3 (insurance-specific)",
    "4": "Make suggestion 4 (insurance-specific)"
  },
  "Question": "Rewrite the question and correct any errors within the sentence if any",
  "best_answer": "Write the corrected, most accurate insurance-related answer."

}

Inputs:
Question: ${question}
Answer: ${how_to_answer}

Rules:
- Always reply in valid JSON.
- Never add extra text outside the JSON.
- Keep answers relevant to insurance (health, car, life, travel, etc.).
- Suggestions must be practical, specific, and insurance-focused.
`;

    // Create a timeout promise
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Request timeout')), VERIFICATION_TIMEOUT);
    });

    // Create the OpenAI request promise
    const openaiPromise = openai.chat.completions.create({
      model: "gpt-4o-mini", // Using gpt-4o-mini as gpt-5-chat-latest might not exist
      messages: [{ role: "user", content: prompt }],
      temperature: 0.1, // Low temperature for more consistent responses
    });

    // Race between timeout and OpenAI request
    const completion = await Promise.race([openaiPromise, timeoutPromise]) as any;

    const response = completion.choices[0].message.content;

    if (!response) {
      throw new Error('No response from OpenAI');
    }

    // Parse the JSON response
    let parsedResponse;
    try {
      parsedResponse = JSON.parse(response.trim());
    } catch (parseError) {
      console.error('Failed to parse OpenAI response:', response);
      // Return a default "Not Approved" response if parsing fails
      parsedResponse = {
        status: "Not Approved",
        suggestions: {
          "1": "Please ensure your question and answer are clearly related to insurance topics.",
          "2": "Consider providing more specific details in your answer."
        },
        Question: question,
        best_answer: "Please provide an insurance-related answer."
      };
    }

    return NextResponse.json(parsedResponse);

  } catch (error: any) {
    console.error('FAQ verification error:', error);

    if (error.message === 'Request timeout') {
      return NextResponse.json(
        { error: 'Verification request timed out. Please try again.' },
        { status: 408 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to verify FAQ. Please try again.' },
      { status: 500 }
    );
  }
}
