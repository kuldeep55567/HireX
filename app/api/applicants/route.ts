import { NextResponse } from "next/server";
import executeQuery from "@/db/sql.config";

export async function GET() {
    try {
        const applicants = await executeQuery({
            query: "SELECT * FROM job_applicants ORDER BY id DESC",
        });
        return NextResponse.json(applicants);
    } catch (error) {
        console.error("Error fetching applicants:", error);
        return NextResponse.json({ error: "Failed to fetch applicants" }, { status: 500 });
    }
}
