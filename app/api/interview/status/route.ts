import executeQuery from "@/db/sql.config";
import { NextResponse, NextRequest } from "next/server";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { email } = body;

  if (!email) {
    return NextResponse.json({ message: "Missing email" }, { status: 400 });
  }

  try {
    const result = await executeQuery({
      query: `
        SELECT 
          ja.job_id,
          oa.job_title,
          oa.location,
          oa.job_type,
          oa.department,
          oa.description,
          iss.round_number,
          iss.round_type,
          iss.title,
          iss.description,
          iss.duration_minutes,
          COALESCE(ir.email, ?) AS email,
          ir.interview_stage_id,
          ir.feedback,
          ir.score,
          CASE 
            WHEN ir.id IS NOT NULL THEN 'completed'
            ELSE 'not_given'
          END AS interview_status,
          ir.created_at
        FROM job_applicants ja
        INNER JOIN interview_stages iss ON ja.job_id = iss.job_id
        LEFT JOIN open_positions oa ON oa.id = ja.job_id
        LEFT JOIN interview_responses ir 
          ON ir.interview_stage_id = iss.round_number 
          AND ir.job_id = iss.job_id 
          AND ir.email = ?
        WHERE ja.email = ?
        ORDER BY ja.job_id, iss.round_number;
      `,
      values: [email, email, email]
    });
    return NextResponse.json({ id: 1, result }, { status: 200 });
  } catch (error) {
    console.error("Error getting interview rounds:", error);
    return NextResponse.json(
      { id: 0, message: "Error fetching interview stages", error },
      { status: 500 }
    );
  }
}
