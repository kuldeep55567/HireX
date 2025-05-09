import executeQuery from "@/db/sql.config";
import { NextRequest, NextResponse } from "next/server";

// Helper to safely parse JSON
function safeJsonParse(value: any) {
  try {
    return typeof value === "string" ? JSON.parse(value) : null;
  } catch {
    return null;
  }
}

/**
 * GET all jobs with their rounds and questions (joined in one query)
 */
export async function GET(req: NextRequest) {
  try {
    const query = `
      SELECT
        j.id AS job_id,
        j.job_title,
        j.department,
        j.experience_min,
        j.experience_max,
        j.notice_period_days,
        j.available_positions,
        j.total_applied,
        j.is_open,
        j.location,
        j.job_type,
        j.description,
        j.created_at,
        j.updated_at,

        r.id AS round_id,
        r.round_number,
        r.round_type,
        r.title AS round_title,
        r.description AS round_description,
        r.duration_minutes,

        q.id AS question_id,
        q.question_text,
        q.options,
        q.correct_option_index,
        q.difficulty_level,
        q.marks,
        q.time_limit_seconds,
        q.question_type,
        q.expected_keywords
      FROM open_positions j
      LEFT JOIN interview_stages r ON r.job_id = j.id
      LEFT JOIN stage_questions q ON q.interview_stage_id = r.id
      ORDER BY j.id DESC, r.round_number ASC, q.id ASC;
    `;

    const results = await executeQuery({ query });

    const jobMap = new Map();

    for (const row of results) {
      if (!jobMap.has(row.job_id)) {
        jobMap.set(row.job_id, {
          id: row.job_id,
          job_title: row.job_title,
          department: row.department,
          experience_min: row.experience_min,
          experience_max: row.experience_max,
          notice_period_days: row.notice_period_days,
          available_positions: row.available_positions,
          total_applied: row.total_applied,
          is_open: row.is_open,
          location: row.location,
          job_type: row.job_type,
          description: row.description,
          created_at: row.created_at,
          updated_at: row.updated_at,
          rounds: [],
        });
      }

      const job = jobMap.get(row.job_id);

      if (row.round_id) {
        let round = job.rounds.find((r: any) => r.id === row.round_id);
        if (!round) {
          round = {
            id: row.round_id,
            round_number: row.round_number,
            round_type: row.round_type,
            title: row.round_title,
            description: row.round_description,
            duration_minutes: row.duration_minutes,
            questions: [],
          };
          job.rounds.push(round);
        }

        if (row.question_id) {
          round.questions.push({
            id: row.question_id,
            question_text: row.question_text,
            options: safeJsonParse(row.options),
            correct_option_index: row.correct_option_index,
            difficulty_level: row.difficulty_level,
            marks: row.marks,
            time_limit_seconds: row.time_limit_seconds,
            question_type: row.question_type,
            expected_keywords: safeJsonParse(row.expected_keywords),
          });
        }
      }
    }

    return NextResponse.json({
      success: true,
      data: Array.from(jobMap.values()),
      count: jobMap.size,
    });
  } catch (error: any) {
    console.error("Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
