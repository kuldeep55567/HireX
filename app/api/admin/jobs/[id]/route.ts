import executeQuery from "@/db/sql.config";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
    try {
        const jobId = parseInt(params.id);
        const roundNumber = parseInt(req.nextUrl.searchParams.get("round") || "1");
        const jobDetails = await executeQuery({
            query: `SELECT op.*, iss.* FROM open_positions op
            LEFT JOIN interview_stages iss ON op.id = iss.job_id
            WHERE op.id = ? AND iss.round_number = ?;`,
            values: [jobId, roundNumber],
        });

        if (!jobDetails.length) {
            return NextResponse.json({ error: "Job not found" }, { status: 404 });
        }

        return NextResponse.json(jobDetails[0]);
    } catch (error) {
        console.error("Error fetching job details:", error);
        return NextResponse.json({ error: "Failed to fetch job details" }, { status: 500 });
    }
}