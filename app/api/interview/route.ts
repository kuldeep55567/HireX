import { NextRequest, NextResponse } from "next/server";
import executeQuery from "@/db/sql.config";

export async function GET(req: NextRequest) {
  const jobId = req.nextUrl.searchParams.get("job_id");
  const stageId = req.nextUrl.searchParams.get("interview_stage_id");

  if (!jobId) {
    return NextResponse.json({ error: "job_id is required" }, { status: 400 });
  }

  if (!stageId) {
    return NextResponse.json({ error: "interview_stage_id is required" }, { status: 400 });
  }

  try {
    const result = await executeQuery({
      query: `SELECT sq.*, iss.title,iss.description 
              FROM stage_questions sq
              LEFT JOIN interview_stages iss 
              ON iss.job_id = sq.job_id 
              AND iss.round_number = sq.interview_stage_id
              WHERE sq.job_id = ? 
              AND sq.interview_stage_id = ?;`,
      values: [jobId, stageId],
    });
    const questions = result.map((q: any) => ({
      ...q,
      options: q.options,
      expected_keywords: q.expected_keywords
    }));

    return NextResponse.json(questions);
  } catch (error: any) {
    console.error("Error fetching interview questions:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
