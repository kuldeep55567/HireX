// lib/claude-interview.ts
import Anthropic from "@anthropic-ai/sdk";
const anthropic = new Anthropic({
  apiKey: process.env.CLAUDE_API_KEY,
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


export async function generateQuestions(
  jobTitle: string, 
  experience: string,
  questionsCount: number, 
  difficulty: string = "Mixed", 
  roundType: string, 
  jobDescription: string,
) {
  // Determine question type based on roundType
  let questionType : string = "Interview"
  if (roundType.toLowerCase() === "mcq" || roundType.toLowerCase() === "quiz") {
    questionType = "MCQ";
  }
  
  const prompt = `
As an AI interview question generator for HireX, create ${questionsCount} high-quality ${questionType} questions for a ${jobTitle} position requiring ${experience} of experience. The questions should be ${difficulty} difficulty.

Job Description: ${jobDescription}

${questionType === "MCQ" ? `
For each Multiple Choice Question (MCQ), provide:
 - question_text: The actual question
 - options: An array of 4 possible answers
 - correct_option_index: The index (0-3) of the correct answer
 - difficulty_level: "${difficulty}"
 - marks: A value between 1-5 depending on difficulty (Easy: 1, Medium: 3, Hard: 5)
 - time_limit_seconds: Suggested time to answer (Easy: 15, Medium: 30, Hard: 45)
 - question_type: "MCQ"
 - expected_keywords: null (not applicable for MCQs)
` : `
For each Interview question, provide:
 - question_text: The actual question
 - options: null (not applicable for open-ended questions)
 - correct_option_index: 0 (not applicable for open-ended questions)
 - difficulty_level: "${difficulty}"
 - marks: A value between 1-10 depending on complexity (Easy: 3, Medium: 5, Hard: 10)
 - time_limit_seconds: Suggested time to answer (Easy: 60, Medium: 120, Hard: 180)
 - question_type: "Interview"
 - expected_keywords: An array of 4-6 keywords that should appear in a good answer
`}

Your response MUST ONLY contain a valid JSON array, with no explanations before or after. The array should contain objects representing questions with all the fields above. The format should be ready to insert into our database without further processing.

Example of the expected format:
${questionType === "MCQ" ? `
[
  {
    "question_text": "Which metric best measures brand awareness?",
    "options": ["Conversion rate", "Net Promoter Score", "Impressions", "Average order value"],
    "correct_option_index": 2,
    "difficulty_level": "Medium",
    "marks": 3,
    "time_limit_seconds": 30,
    "question_type": "MCQ",
    "expected_keywords": null
  }
]` : `
[
  {
    "question_text": "How would you approach launching a new product in a saturated market?",
    "options": null,
    "correct_option_index": 0,
    "difficulty_level": "Hard",
    "marks": 5,
    "time_limit_seconds": 180,
    "question_type": "Interview",
    "expected_keywords": ["positioning", "target audience", "channels", "differentiation", "competitive analysis", "unique value proposition"]
  }
]`}

IMPORTANT: Return ONLY the JSON array with no additional text before or after.
Focus on questions that are relevant to the actual job responsibilities and avoid generic questions.
All questions should be of type "${questionType}" only.
`;
console.log(prompt);
  try {
      const msg = await anthropic.messages.create({
          model: "claude-3-5-haiku-20241022",
          max_tokens: 8192,
          temperature: 0.7, // Slightly creative but mostly consistent
          system: `You are an expert interview question generator for technical and non-technical roles. You ONLY create ${questionType} questions, not mixed types. You MUST respond with ONLY a valid JSON array.`,
          messages: [
              {
                  "role": "user",
                  "content": prompt
              }
          ]
      });

      // Extract the content from Claude's response
      let content = '';
      if (msg.content && msg.content.length > 0) {
          const contentBlock = msg.content[0];
          if (contentBlock && 'text' in contentBlock) {
              content = contentBlock.text;
          }
      }
      
      // Clean the content to get just the JSON
      content = content.trim();
      
      // If content starts with a bracket, assume it's JSON
      if (content.startsWith('[') && content.endsWith(']')) {
          try {
              const parsedQuestions = JSON.parse(content);
              
              // Ensure all questions are of the correct type and format
              const validQuestions = parsedQuestions.map((q: any) => {
                // For Interview questions, ensure options is null
                if (q.question_type === "Interview" || q.question_type === "Open-ended") {
                  return {
                    ...q,
                    options: null,
                    correct_option_index: 0
                  };
                }
                return q;
              });
              
              // If we lost questions in the filtering, log a warning
              if (validQuestions.length < parsedQuestions.length) {
                  console.warn(`Filtered out ${parsedQuestions.length - validQuestions.length} questions of incorrect type`);
              }
              
              return validQuestions;
          } catch (jsonError) {
              console.error("Failed to parse JSON:", jsonError);
          }
      }
      
      // Fallback: Try to find the JSON array in the content using regex
      const jsonRegex = /\[\s*\{[\s\S]*\}\s*\]/g;
      const match = content.match(jsonRegex);
      
      if (match && match[0]) {
          try {
              const parsedQuestions = JSON.parse(match[0]);
              // Map questions to ensure Interview questions don't have options
              const formattedQuestions = parsedQuestions.map((q: any) => {
                  if (q.question_type === "Interview" || q.question_type === "Open-ended") {
                      return {
                          ...q,
                          options: null,
                          correct_option_index: 0
                      };
                  }
                  return q;
              });
              return formattedQuestions.filter((q: any) => q.question_type === questionType ||  
                  (questionType === "Open-ended" && q.question_type === "Interview") ||
                  (questionType === "Interview" && q.question_type === "Open-ended"));
          } catch (jsonError) {
              console.error("Failed to parse JSON from regex match:", jsonError);
          }
      }
      
      // If we're here, we need a more robust extraction method
      // Try to find the first '[' and last ']' and extract everything between
      const startBracket = content.indexOf('[');
      const endBracket = content.lastIndexOf(']');
      
      if (startBracket !== -1 && endBracket !== -1 && startBracket < endBracket) {
          const jsonString = content.substring(startBracket, endBracket + 1);
          try {
              const parsedQuestions = JSON.parse(jsonString);
              // Map questions to ensure Interview questions don't have options
              const formattedQuestions = parsedQuestions.map((q: any) => {
                  if (q.question_type === "Interview" || q.question_type === "Open-ended") {
                      return {
                          ...q,
                          options: null,
                          correct_option_index: 0
                      };
                  }
                  return q;
              });
              return formattedQuestions.filter((q: any) => q.question_type === questionType || 
                  (questionType === "Open-ended" && q.question_type === "Interview") ||
                  (questionType === "Interview" && q.question_type === "Open-ended"));
          } catch (jsonError) {
              console.error("Failed to parse JSON using bracket extraction:", jsonError);
          }
      }
      
      // Last resort: Create a default set of questions
      console.error("Could not extract valid JSON from Claude's response. Using default questions.");
      return createDefaultQuestions(jobTitle, difficulty, questionsCount, questionType);
  } catch (error) {
      console.error("Error generating questions:", error);
      return createDefaultQuestions(jobTitle, difficulty, questionsCount, questionType);
  }
}

// Fallback function to create default questions if parsing fails
function createDefaultQuestions(jobTitle: string, difficulty: string, count: number, questionType: string) {
  const questions = [];
  
  for (let i = 0; i < count; i++) {
    if (questionType === "MCQ") {
      questions.push({
        question_text: `Default MCQ question #${i+1} for ${jobTitle} position`,
        options: ["Option A", "Option B", "Option C", "Option D"],
        correct_option_index: 0,
        difficulty_level: difficulty,
        marks: difficulty === "Easy" ? 1 : difficulty === "Medium" ? 3 : 5,
        time_limit_seconds: difficulty === "Easy" ? 15 : difficulty === "Medium" ? 30 : 45,
        question_type: "MCQ",
        expected_keywords: null
      });
    } else { // Open-ended
      questions.push({
        question_text: `Default open-ended question #${i+1} for ${jobTitle} position`,
        options: null,
        correct_option_index: 0,
        difficulty_level: difficulty,
        marks: difficulty === "Easy" ? 3 : difficulty === "Medium" ? 5 : 10,
        time_limit_seconds: difficulty === "Easy" ? 60 : difficulty === "Medium" ? 120 : 180,
        question_type: "Open-ended",
        expected_keywords: ["skill", "experience", "approach", "solution", "methodology"]
      });
    }
  }
  
  return questions;
}