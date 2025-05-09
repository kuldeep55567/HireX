import { NextRequest, NextResponse } from "next/server";
import executeQuery from "@/db/sql.config";

export async function POST(req: NextRequest) {
  const body = await req.json();

  const {
    job_id,
    round_number,
    round_type,
    title,
    description,
    duration_minutes
  } = body;

  try {
    const result = await executeQuery({
      query: `
        INSERT INTO interview_stages 
        (job_id, round_number, round_type, title, description, duration_minutes)
        VALUES (?, ?, ?, ?, ?, ?)
      `,
      values: [job_id, round_number, round_type, title, description, duration_minutes],
    });

    return NextResponse.json({ id: 1, message: "Interview stage created", insertId: result.insertId });
  } catch (error) {
    return NextResponse.json({ id: 0, error: "Failed to create interview stage", details: error }, { status: 500 });
  }
}
