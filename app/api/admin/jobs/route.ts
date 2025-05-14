// app/api/admin/jobs/route.ts
import executeQuery from "@/db/sql.config";
import { NextRequest, NextResponse } from "next/server";

// Enhanced helper to safely parse JSON
function safeJsonParse(value: any) {
  if (!value) return null;

  try {
    // If it's already an object, return it
    if (typeof value === 'object') return value;

    // If it's a string that looks like JSON, parse it
    if (typeof value === 'string') {
      // Remove any escaped quotes or double escaping that might cause parsing issues
      const cleanValue = value
        .replace(/\\"/g, '"')       // Replace \" with "
        .replace(/\\\\"/g, '\\"');  // Replace \\" with \"

      // Try to parse the cleaned string
      return JSON.parse(cleanValue);
    }

    return null;
  } catch (error) {
    console.error("Error parsing JSON:", error, "Value:", value);

    // Special handling for arrays that might be stored as strings but not in valid JSON format
    if (typeof value === 'string' && value.includes('[') && value.includes(']')) {
      try {
        // Try to convert to valid JSON format
        const fixedValue = value
          .replace(/'/g, '"')             // Replace single quotes with double quotes
          .replace(/\\/g, '\\\\')         // Escape backslashes
          .replace(/\\"/g, '\\"');        // Fix escaped quotes

        return JSON.parse(fixedValue);
      } catch (innerError) {
        console.error("Failed second parsing attempt:", innerError);
      }
    }

    return null;
  }
}

export async function GET(req: NextRequest) {
  try {
    // Get all jobs
    const jobsQuery = `
      SELECT * FROM open_positions ORDER BY id DESC;
    `;
    const jobs = await executeQuery({ query: jobsQuery });

    const processedJobs = [];

    for (const job of jobs) {
      const roundsQuery = `
        SELECT * FROM interview_stages WHERE job_id = ? ORDER BY round_number ASC`;
      const rounds = await executeQuery({ query: roundsQuery, values: [job.id] })
      // For each round, get its questions
      const processedRounds = [];

      for (const round of rounds) {
        // Get questions for this specific round
        const questionsQuery = `
          SELECT * FROM stage_questions 
          WHERE job_id = ? AND interview_stage_id = ?
        `;
        const questions = await executeQuery({
          query: questionsQuery,
          values: [job.id, round.round_number]
        });
        // Process questions to properly parse JSON fields
        const processedQuestions = questions.map((q: any) => ({
          ...q,
          options: safeJsonParse(q.options),
          expected_keywords: safeJsonParse(q.expected_keywords)
        }));

        processedRounds.push({
          ...round,
          questions: processedQuestions
        });
      }

      processedJobs.push({
        ...job,
        rounds: processedRounds
      });
    }

    return NextResponse.json({
      success: true,
      data: processedJobs,
      count: processedJobs.length
    });
  } catch (error: any) {
    console.error("Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}