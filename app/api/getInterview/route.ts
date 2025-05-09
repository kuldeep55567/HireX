import { NextRequest, NextResponse } from "next/server";
import executeQuery from "@/db/sql.config";

export async function GET(req: NextRequest) {
  const jobId = req.nextUrl.searchParams.get("job_id");

  if (!jobId) {
    return NextResponse.json({ error: "job_id is required" }, { status: 400 });
  }

  try {
    // Fetch job details
    const jobQuery = `SELECT * FROM open_positions WHERE id = ?`;
    const jobResults = await executeQuery({
      query: jobQuery,
      values: [jobId],
    });

    if (jobResults.length === 0) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    const job = jobResults[0];

    // Fetch interview stages for this job
    const stagesQuery = `SELECT * FROM interview_stages WHERE job_id = ? ORDER BY round_number ASC`;
    const stagesResults = await executeQuery({
      query: stagesQuery,
      values: [jobId],
    });

    // Fetch questions for each stage
    const rounds = await Promise.all(
      stagesResults.map(async (stage: any) => {
        const questionsQuery = `SELECT * FROM stage_questions WHERE interview_stage_id = ?`;
        const questionsResults = await executeQuery({
          query: questionsQuery,
          values: [stage.id],
        });

        // Parse the JSON strings for options and expected_keywords
        const questions = questionsResults.map((q: any) => ({
          ...q,
          options: q.options ? JSON.parse(q.options) : [],
          expected_keywords: q.expected_keywords ? JSON.parse(q.expected_keywords) : null,
        }));

        return {
          ...stage,
          questions,
        };
      })
    );

    // Combine job with rounds and questions
    const jobWithDetails = {
      ...job,
      rounds,
    };

    return NextResponse.json(jobWithDetails);
  } catch (error: any) {
    console.error("Error fetching job details:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}