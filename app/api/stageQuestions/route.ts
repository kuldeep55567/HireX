import { NextRequest, NextResponse } from "next/server";
import executeQuery from "@/db/sql.config";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const {
    interview_stage_id,
    question_text,
    options,
    correct_option_index,
    question_type = "MCQ",
    difficulty_level,
    marks,
    time_limit_seconds = 15,
    expected_keywords = null
  } = body;

  try {
    const result = await executeQuery({
      query: `
        INSERT INTO stage_questions
        (interview_stage_id, question_text, question_type, options, correct_option_index, difficulty_level, marks, time_limit_seconds, expected_keywords)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      values: [
        interview_stage_id,
        question_text,
        question_type,
        JSON.stringify(options),
        correct_option_index,
        difficulty_level,
        marks,
        time_limit_seconds,
        expected_keywords ? JSON.stringify(expected_keywords) : null
      ],
    });

    return NextResponse.json({ id: 1, message: "Question created", insertId: result.insertId });
  } catch (error) {
    return NextResponse.json({ id: 0, error: "Failed to create question", details: error }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const stageId = req.nextUrl.searchParams.get("stage_id");

  if (!stageId) {
    return NextResponse.json({ error: "stage_id is required" }, { status: 400 });
  }

  try {
    const result = await executeQuery({
      query: `SELECT * FROM stage_questions WHERE interview_stage_id = ?`,
      values: [stageId],
    });

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch questions", details: error }, { status: 500 });
  }
}
