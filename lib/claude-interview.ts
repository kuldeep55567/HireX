// lib/claude-interview.ts
import Anthropic from "@anthropic-ai/sdk";
const anthropic = new Anthropic({
  apiKey: process.env.NEXT_PUBLIC_CLAUDE_API_KEY,
});
interface UserResponse {
  questionId: number;
  questionText: string;
  userAnswer: string;
  timeSpent: number;
}

interface FeedbackCategory {
  score: number;
  feedback: string;
}

interface AnalysisResult {
  technicalKnowledge: FeedbackCategory;
  communicationSkills: FeedbackCategory;
  problemSolving: FeedbackCategory;
  relevantExperience: FeedbackCategory;
  culturalFit: FeedbackCategory;
  criticalThinking: FeedbackCategory;
  clarityOfThought: FeedbackCategory;
  completenessOfAnswers: FeedbackCategory;
  confidence: FeedbackCategory;
  overallImpression: FeedbackCategory;
  totalScore: number;
  overallFeedback: string;
}

/**
 * Analyze interview responses with Claude API
 * @param responses User's interview responses
 * @param jobTitle Job title
 * @param roundType Type of interview round
 * @param roundTitle Title of the interview round
 * @param apiKey Claude API key
 * @returns Promise with the analysis result
 */
export async function analyzeInterviewWithClaude(
  responses: UserResponse[],
  jobTitle: string,
  roundType: string,
  roundTitle: string,
): Promise<AnalysisResult> {
  try {
    // Create the prompt for Claude
    const prompt = `You are an expert interview assessor. Please analyze the following interview responses for a "${roundTitle}" interview.
      
      Job: ${jobTitle}
      Round type: ${roundType}
      
      The candidate provided the following responses:
      
      ${responses.map((response, index) => `
      Question ${index + 1}: ${response.questionText}
      Time taken: ${response.timeSpent} seconds
      Answer: ${response.userAnswer}
      `).join('\n\n')}
      
      Please provide a comprehensive analysis of the candidate's responses, including:
      1. Technical knowledge (score out of 10)
      2. Communication skills (score out of 10)
      3. Problem-solving ability (score out of 10)
      4. Relevant experience (score out of 10)
      5. Cultural fit (score out of 10)
      6. Critical thinking (score out of 10)
      7. Clarity of thought (score out of 10)
      8. Completeness of answers (score out of 10)
      9. Confidence (score out of 10)
      10. Overall impression (score out of 10)
      
      For each category, provide a brief explanation of the score.
      Finally, provide an overall assessment and recommendation.
      
      Format your response as valid JSON with the following structure:
      {
        "technicalKnowledge": { "score": 0 },
        "communicationSkills": { "score": 0 },
        "problemSolving": { "score": 0 },
        "relevantExperience": { "score": 0 },
        "culturalFit": { "score": 0 },
        "criticalThinking": { "score": 0 },
        "clarityOfThought": { "score": 0 },
        "completenessOfAnswers": { "score": 0 },
        "confidence": { "score": 0 },
        "overallImpression": { "score": 0 },
        "totalScore": 0,
        "overallFeedback": ""
      }`;
    const msg = await anthropic.messages.create({
      model: "claude-3-5-haiku-20241022",
      max_tokens: 8192,
      temperature: 1,
      messages: [
        {
          "role": "user",
          "content": [
            {
              "type": "text",
              "text": prompt
            }
          ]
        }
      ]
    });
    // Extract text from the content block, handling different block types
    let analysisText = '';
    // Since we're not providing an assistant message, Claude's response will be in content[0]
    const contentBlock = msg.content[0];
    
    if (contentBlock && 'type' in contentBlock) {
      if (contentBlock.type === 'text' && 'text' in contentBlock) {
        analysisText = contentBlock.text;
      } else {
        // Handle other content types if needed
        console.warn('Unexpected content type in Claude response:', contentBlock.type);
      }
    }

    console.log('Raw Claude response:', analysisText);

    // Extract JSON from response - handle different formats
    let jsonStr = '';
    
    // Try to find JSON in code blocks first
    const jsonBlockMatch = analysisText.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonBlockMatch && jsonBlockMatch[1]) {
      jsonStr = jsonBlockMatch[1].trim();
    } else {
      // Try to find JSON with curly braces
      const jsonBraceMatch = analysisText.match(/(\{[\s\S]*\})/);
      if (jsonBraceMatch && jsonBraceMatch[1]) {
        jsonStr = jsonBraceMatch[1].trim();
      } else {
        // If we can't find JSON, throw an error
        console.error('Claude response content:', analysisText);
        throw new Error('Could not extract JSON from Claude response');
      }
    }
    
    // Clean up the JSON string
    jsonStr = jsonStr.replace(/^[\s\n]*|[\s\n]*$/g, '');
    const analysisResult = JSON.parse(jsonStr) as AnalysisResult;

    // Calculate total score
    let totalScore = 0;
    let categoryCount = 0;

    const categories = [
      'technicalKnowledge', 'communicationSkills', 'problemSolving',
      'relevantExperience', 'culturalFit', 'criticalThinking',
      'clarityOfThought', 'completenessOfAnswers', 'confidence', 'overallImpression'
    ];

    categories.forEach(category => {
      if (analysisResult[category as keyof AnalysisResult]) {
        totalScore += (analysisResult[category as keyof AnalysisResult] as FeedbackCategory).score;
        categoryCount++;
      }
    });

    // If totalScore isn't already provided, calculate it
    if (!analysisResult.totalScore) {
      analysisResult.totalScore = Math.round((totalScore / (categoryCount * 10)) * 100);
    }

    return analysisResult;
  } catch (error) {
    console.error('Error calling Claude API:', error);
    throw error;
  }
}