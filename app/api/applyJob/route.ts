// api/applyJob/route.ts
import { NextRequest, NextResponse } from "next/server";
import executeQuery from "@/db/sql.config";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      email,
      designation,
      job_id,
      position,
      experience,
      highest_education,
      previously_employed,
      status,
    } = body;

    if (!email || !job_id) {
      return NextResponse.json({ error: "Email and job_id are required." }, { status: 400 });
    }

    // Check if the user has already applied for the same job
    const checkQuery = `
      SELECT id FROM job_applicants
      WHERE email = ? AND job_id = ?
      LIMIT 1
    `;
    const existing = await executeQuery({ query: checkQuery, values: [email, job_id] });

    if (existing.length > 0) {
      return NextResponse.json({id:0, error: "You have already applied for this job." }, { status: 409 });
    }

    // Insert new applicant
    const insertQuery = `
      INSERT INTO job_applicants (
        email,
        designation,
        job_id,
        position,
        experience,
        highest_education,
        previously_employed,
        status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const values = [
      email,
      designation,
      job_id,
      position,
      experience,
      highest_education,
      previously_employed ?? false,
      status,
    ];

    const result = await executeQuery({ query: insertQuery, values });

    return NextResponse.json({ message: "Applicant added successfully", id: result.insertId }, { status: 201 });
  } catch (error) {
    console.error("Error inserting applicant:", error);
    return NextResponse.json({ error: "Failed to add applicant" }, { status: 500 });
  }
}
