import { NextRequest, NextResponse } from "next/server";
import executeQuery from "@/db/sql.config";

function safeJsonParse(value: any) {
  try {
    return typeof value === "string" ? JSON.parse(value) : null;
  } catch {
    return null;
  }
}

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
      query: `SELECT * FROM stage_questions WHERE job_id = ? AND interview_stage_id = ?`,
      values: [jobId, stageId],
    });

    const questions = result.map((q: any) => ({
      ...q,
      options: safeJsonParse(q.options),
      expected_keywords: safeJsonParse(q.expected_keywords),
    }));

    return NextResponse.json(questions);
  } catch (error: any) {
    console.error("Error fetching interview questions:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
