import { generateQuestions } from "@/lib/claude-interview";
import executeQuery from "@/db/sql.config";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { job_id, interview_stage_id, question_count = 5, difficulty = "Medium" } = body;
console.log({job_id, interview_stage_id, question_count, difficulty})
        if (!job_id || !interview_stage_id) {
            return NextResponse.json({ error: "job_id and interview_stage_id are required" }, { status: 400 });
        }

        // First, get job details to include in the prompt
        const jobDetails = await executeQuery({
            query: `SELECT * FROM open_positions WHERE id = ?`,
            values: [job_id],
        });
console.log({jobDetails})
        if (!jobDetails.length) {
            return NextResponse.json({ error: "Job not found" }, { status: 404 });
        }

        const job = jobDetails[0];

        // Get stage details
        const stageDetails = await executeQuery({
            query: `SELECT * FROM interview_stages WHERE id = ?`,
            values: [interview_stage_id],
        });

        if (!stageDetails.length) {
            return NextResponse.json({ error: "Interview stage not found" }, { status: 404 });
        }

        const stage = stageDetails[0];

        // Generate questions based on job and stage
        console.log(
            job.job_title,
            `${job.experience_min}-${job.experience_max} years`,
            question_count,
            difficulty,
            stage.round_type,
            job.description
        )
        const questions = await generateQuestions(
            job.job_title,
            `${job.experience_min}-${job.experience_max} years`,
            question_count,
            difficulty,
            stage.round_type,
            job.description
        );
        console.log("Generated questions:", questions);
        // Log the values to debug
        console.log("Saving questions with job_id:", job_id, "and interview_stage_id:", interview_stage_id);
        
        // Save questions to database
        if (questions && questions.length > 0) {
            for (const question of questions) {
                // Ensure job_id and interview_stage_id are integers
                const jobIdInt = parseInt(job_id.toString());
                const stageIdInt = parseInt(interview_stage_id.toString());
                
                if (isNaN(jobIdInt) || isNaN(stageIdInt)) {
                    console.error("Invalid job_id or interview_stage_id:", { job_id, interview_stage_id });
                    continue; // Skip this question if IDs are invalid
                }
                
                await executeQuery({
                    query: `INSERT INTO stage_questions 
                    (job_id, interview_stage_id, question_text, options, correct_option_index, 
                    difficulty_level, marks, time_limit_seconds, question_type, expected_keywords) 
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                    values: [
                        jobIdInt, // Use the parsed integer value
                        stageIdInt, // Use the parsed integer value
                        question.question_text,
                        question.options ? JSON.stringify(question.options) : null,
                        question.correct_option_index || 0,
                        question.difficulty_level,
                        question.marks,
                        question.time_limit_seconds,
                        question.question_type,
                        question.expected_keywords ? JSON.stringify(question.expected_keywords) : null
                    ],
                });
            }
        }

        // Return the generated questions without saving them to the database
        // The frontend will handle saving them when the user clicks "Save All Questions"
        return NextResponse.json(questions);
    } catch (error) {
        return NextResponse.json({ error: "Failed to generate questions", details: error }, { status: 500 });
    }
}
