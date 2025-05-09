// lib/claude-api.ts

/**
 * Helper function to call Claude API for generating interview questions
 * @param prompt The prompt to send to Claude API
 * @param apiKey Your Claude API key
 * @returns Promise with the response from Claude
 */
export async function generateQuestionsWithClaude(prompt: string, apiKey: string) {
    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: 'claude-3-sonnet-20240229',
          max_tokens: 4000,
          temperature: 0.7,
          system: "You are an expert at creating job interview questions. Your task is to generate high-quality, relevant interview questions based on the job description and requirements provided. For multiple-choice questions, always provide 4 options with one correct answer, clearly marked. For coding or technical questions, ensure they are accurate and match the difficulty level specified. When asked for JSON output, provide clean, valid JSON that can be parsed directly.",
          messages: [
            {
              role: 'user',
              content: prompt
            }
          ]
        })
      });
  
      if (!response.ok) {
        throw new Error(`API request failed with status: ${response.status}`);
      }
  
      const data = await response.json();
      return data.content[0].text;
    } catch (error) {
      console.error('Error calling Claude API:', error);
      throw error;
    }
  }
  
  /**
   * Parse Claude's response to extract JSON data
   * This helps with handling the various ways Claude might format its JSON output
   */
  export function parseClaudeResponse(response: string) {
    try {
      // Try to find JSON in the response first
      const jsonRegex = /```json\n([\s\S]*?)```|```([\s\S]*?)```|\{[\s\S]*\}/;
      const match = response.match(jsonRegex);
      
      if (match) {
        // If we found JSON in code blocks, use that
        const jsonStr = match[1] || match[2] || match[0];
        return JSON.parse(jsonStr);
      }
      
      // If no JSON was found in code blocks, try to parse the entire response
      return JSON.parse(response);
    } catch (error) {
      console.error('Error parsing Claude response:', error);
      throw new Error('Failed to parse questions from Claude API response');
    }
  }
  
  /**
   * Format the questions from Claude into the structure needed for the database
   */
  export function formatQuestionsForDB(parsedResponse: any, interviewStageId: number) {
    try {
      // Handle different possible response structures
      const questions = Array.isArray(parsedResponse) 
        ? parsedResponse 
        : parsedResponse.questions || [];
      
      return questions.map((q: any) => ({
        interview_stage_id: interviewStageId,
        question_text: q.question || q.question_text || q.text,
        options: q.options || q.answers || [],
        correct_option_index: q.correct_option_index || q.correct_answer_index || 0,
        question_type: q.question_type || q.type || "MCQ",
        difficulty_level: q.difficulty_level || q.difficulty || "Medium",
        marks: q.marks || q.points || 1,
        time_limit_seconds: q.time_limit_seconds || q.time_limit || 30,
        expected_keywords: q.expected_keywords || q.keywords || null
      }));
    } catch (error) {
      console.error('Error formatting questions:', error);
      throw new Error('Failed to format questions for database');
    }
  }