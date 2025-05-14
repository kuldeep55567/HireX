import { NextRequest, NextResponse } from "next/server";
import { analyzeInterviewWithClaude } from "@/lib/claude-interview";
import executeQuery from "@/db/sql.config";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { responses, jobTitle, roundType, roundTitle, email = 'Admin', job_id, interview_stage_id, totalScore, maxPossibleScore } = body;
  const apiKey = process.env.CLAUDE_API_KEY;

  if (!apiKey) {
    return NextResponse.json({ error: "Claude API key is not configured" }, { status: 500 });
  }

  let feedback = ""
  if (totalScore < maxPossibleScore) {
    feedback = "You can improve your performance"
  } else {
    feedback = "You have performed well"
  }

  try {
    if (roundType.toLowerCase() === 'quiz') {
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
          totalScore,
          0,
          JSON.stringify(responses),
          feedback
        ]
      });

      return NextResponse.json({ id: 1, message: "Response Saved" });
    }
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
