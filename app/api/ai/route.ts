import { NextRequest, NextResponse } from "next/server";
import { analyzeInterviewWithClaude } from "@/lib/claude-interview";
import executeQuery from "@/db/sql.config"; // Make sure this is your DB wrapper

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { responses, jobTitle, roundType, roundTitle, email='Admin', job_id, interview_stage_id } = body;

  const apiKey = process.env.NEXT_PUBLIC_CLAUDE_API_KEY;

  if (!apiKey) {
    return NextResponse.json({ error: "Claude API key is not configured" }, { status: 500 });
  }

  try {
    // Analyze using Claude
    const analysisResult = await analyzeInterviewWithClaude(responses, jobTitle, roundType, roundTitle);

    // Calculate total time
    const totalTimeSeconds = responses.reduce((sum: number, r: any) => sum + r.timeSpent, 0);

    // Insert into DB
    await executeQuery({
      query: `
        INSERT INTO interview_responses (
          email, job_id, interview_stage_id, score, time_in_seconds, response_data, feedback
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
      `,
      values: [
        email,
        job_id,
        interview_stage_id,
        analysisResult.totalScore,
        totalTimeSeconds,
        JSON.stringify(responses),
        analysisResult.overallFeedback
      ]
    });

    return NextResponse.json(analysisResult);
  } catch (error) {
    console.error("Error analyzing interview:", error);
    return NextResponse.json({ error: "Failed to analyze interview" }, { status: 500 });
  }
}
