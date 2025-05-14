import { generateQuestions } from "@/lib/claude-interview";
import executeQuery from "@/db/sql.config";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { job_id, interview_stage_id, question_count = 5, difficulty = "Medium", save = false } = body;
        if (!job_id || !interview_stage_id) {
            return NextResponse.json({ error: "job_id and interview_stage_id are required" }, { status: 400 });
        }

        // First, get job details to include in the prompt
        const jobDetails = await executeQuery({
            query: `SELECT * FROM open_positions WHERE id = ?`,
            values: [job_id],
        });
        if (!jobDetails.length) {
            return NextResponse.json({ error: "Job not found" }, { status: 404 });
        }

        const job = jobDetails[0];

        // Check if this is a save request or a generate request
        if (save) {
            // This is a save request for an existing question
            try {
                const {
                    question_text,
                    options,
                    correct_option_index,
                    question_type = "MCQ",
                    difficulty_level,
                    marks,
                    time_limit_seconds = 15,
                    expected_keywords = null
                } = body;
                
                // Ensure job_id and interview_stage_id are integers
                const jobIdInt = parseInt(job_id.toString());
                
                // IMPORTANT: Get the actual interview_stage_id from the database
                // This ensures we're using a valid ID that exists in the interview_stages table
                const stageQuery = await executeQuery({
                    query: `SELECT id FROM interview_stages WHERE job_id = ? AND round_number = ?`,
                    values: [jobIdInt, parseInt(interview_stage_id.toString())],
                });
                
                if (!stageQuery.length) {
                    console.error("No matching interview stage found");
                    return NextResponse.json({ error: "No matching interview stage found" }, { status: 404 });
                }
                
                const stageIdInt = stageQuery[0].id;
                
                const result = await executeQuery({
                    query: `
                        INSERT INTO stage_questions
                        (job_id, interview_stage_id, question_text, question_type, options, correct_option_index, 
                        difficulty_level, marks, time_limit_seconds, expected_keywords)
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    `,
                    values: [
                        jobIdInt,
                        stageIdInt, // Use the ID from the database query
                        question_text,
                        question_type,
                        options ? JSON.stringify(options) : null,
                        correct_option_index || 0,
                        difficulty_level,
                        marks,
                        time_limit_seconds,
                        expected_keywords ? JSON.stringify(expected_keywords) : null
                    ],
                });
                
                return NextResponse.json({ id: 1, message: "Question saved", insertId: result.insertId });
            } catch (error) {
                console.error("Error from excuteQuery:", error);
                return NextResponse.json({ id: 0, error: "Failed to save question", details: error }, { status: 500 });
            }
        } else {
            // This is a generate request
            // Get stage details by round_number
            const stageDetails = await executeQuery({
                query: `SELECT * FROM interview_stages WHERE job_id = ? AND round_number = ?`,
                values: [job_id, interview_stage_id],
            });
            
            if (!stageDetails.length) {
                return NextResponse.json({ error: "Interview stage not found" }, { status: 404 });
            }

            const stage = stageDetails[0];

            const questions = await generateQuestions(
                job.job_title,
                `${job.experience_min}-${job.experience_max} years`,
                question_count,
                difficulty,
                stage.round_type,
                job.description
            );

            // Return the generated questions without saving them to the database
            // The frontend will handle saving them when the user clicks "Save All Questions"
            return NextResponse.json(questions);
        }
    } catch (error) {
        console.error("Error in POST handler:", error);
        return NextResponse.json({ error: "Failed to process request", details: error }, { status: 500 });
    }
}
