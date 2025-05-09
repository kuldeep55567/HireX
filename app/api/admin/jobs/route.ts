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

// Helper function to update the interview_stage_id in stage_questions
async function fixStageQuestionsMismatch() {
  // ... (same as before)
}

/**
 * GET all jobs with their rounds and questions (joined in one query)
 */
export async function GET(req: NextRequest) {
  try {
    // First, fix any mismatches in the database
    const fixResult = await fixStageQuestionsMismatch();
    
    // Now get all jobs with their properly linked rounds and questions
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
      LEFT JOIN stage_questions q ON q.interview_stage_id = r.id AND q.job_id = j.id
      ORDER BY j.id DESC, r.round_number ASC, q.id ASC;
    `;

    const results = await executeQuery({ query });

    // Log a sample of the options field to diagnose
    if (results.length > 0) {
      const sampleWithOptions = results.find((row:any) => row.options !== null && row.options !== undefined);
      if (sampleWithOptions) {
        console.log("Sample options field:", sampleWithOptions.options);
        console.log("Type of options field:", typeof sampleWithOptions.options);
      } else {
        console.log("No samples found with non-null options");
      }
    }

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
          // Parse options with extra debugging
          let parsedOptions = null;
          try {
            parsedOptions = safeJsonParse(row.options);
            if (!parsedOptions && row.options) {
              console.log(`Failed to parse options for question ${row.question_id}:`, row.options);
            }
          } catch (error) {
            console.error(`Error parsing options for question ${row.question_id}:`, error);
          }
          
          round.questions.push({
            id: row.question_id,
            question_text: row.question_text,
            options: parsedOptions,
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
      fixResult: fixResult
    });
  } catch (error: any) {
    console.error("Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}