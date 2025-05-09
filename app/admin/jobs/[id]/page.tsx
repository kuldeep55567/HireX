"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { JobWithDetails, InterviewStage, StageQuestion } from "@/app/types/interface";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

export default function JobDetailsPage() {
  const params = useParams();
  const jobId = params.id;
  const [job, setJob] = useState<JobWithDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchJobDetails = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/getInterview?job_id=${jobId}`);
        
        if (!response.ok) {
          throw new Error(`Error fetching job: ${response.statusText}`);
        }
        
        const data = await response.json();
        setJob(data);
      } catch (err: any) {
        console.error("Error fetching job details:", err);
        setError(err.message || "Failed to load job details");
      } finally {
        setLoading(false);
      }
    };

    if (jobId) {
      fetchJobDetails();
    }
  }, [jobId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[400px]">
        <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 mx-auto max-w-7xl">
        <div className="p-6 border border-red-200 rounded-lg bg-red-50">
          <h2 className="mb-2 text-xl font-semibold text-red-700">Error</h2>
          <p className="text-red-600">{error}</p>
          <Link 
            href="/admin" 
            className="inline-block px-4 py-2 mt-4 text-white bg-blue-600 rounded hover:bg-blue-700"
          >
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="p-6 mx-auto max-w-7xl">
        <div className="p-6 border border-yellow-200 rounded-lg bg-yellow-50">
          <h2 className="mb-2 text-xl font-semibold text-yellow-700">Job Not Found</h2>
          <p className="text-yellow-600">The requested job could not be found.</p>
          <Link 
            href="/admin" 
            className="inline-block px-4 py-2 mt-4 text-white bg-blue-600 rounded hover:bg-blue-700"
          >
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  // Calculate statistics
  const totalRounds = job.rounds?.length || 0;
  const totalQuestions = job.rounds?.reduce(
    (acc, round) => acc + (round.questions?.length || 0), 
    0
  ) || 0;

  return (
    <div className="p-6 mx-auto max-w-7xl">
      {/* Header with actions */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {job.job_title}
          </h1>
          <p className="text-gray-500 dark:text-gray-400">
            ID: {job.id} • Created: {new Date(job.created_at).toLocaleDateString()}
          </p>
        </div>
        <div className="flex space-x-3">
          <Link
            href={`/admin/rounds/create?job_id=${job.id}`}
            className="px-4 py-2 text-white transition bg-green-600 rounded hover:bg-green-700"
          >
            Add Round
          </Link>
          <Link
            href="/admin"
            className="px-4 py-2 text-white transition bg-blue-600 rounded hover:bg-blue-700"
          >
            Back to Dashboard
          </Link>
        </div>
      </div>

      {/* Job details card */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Job Details</CardTitle>
          <CardDescription>Complete information about this job opening</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Department</p>
                  <p className="text-gray-900 dark:text-white">{job.department}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Location</p>
                  <p className="text-gray-900 dark:text-white">{job.location}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Job Type</p>
                  <p className="text-gray-900 dark:text-white">{job.job_type}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Status</p>
                  <Badge variant={job.is_open ? "default" : "destructive"}>
                    {job.is_open ? "Open" : "Closed"}
                  </Badge>
                </div>
              </div>
            </div>
            <div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Experience Range</p>
                  <p className="text-gray-900 dark:text-white">{job.experience_min} - {job.experience_max} years</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Notice Period</p>
                  <p className="text-gray-900 dark:text-white">{job.notice_period_days} days</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Available Positions</p>
                  <p className="text-gray-900 dark:text-white">{job.available_positions}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Applications</p>
                  <p className="text-gray-900 dark:text-white">{job.total_applied}</p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="mt-6">
            <p className="mb-2 text-sm font-medium text-gray-500 dark:text-gray-400">Job Description</p>
            <div className="p-4 border rounded-md bg-gray-50 dark:bg-gray-800 dark:border-gray-700">
              <p className="text-gray-700 whitespace-pre-line dark:text-gray-300">{job.description}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 gap-4 mb-6 sm:grid-cols-3">
        <Card>
          <CardHeader className="py-4">
            <CardTitle className="text-lg">Total Rounds</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{totalRounds}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="py-4">
            <CardTitle className="text-lg">Total Questions</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{totalQuestions}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="py-4">
            <CardTitle className="text-lg">Applications</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{job.total_applied}</p>
          </CardContent>
        </Card>
      </div>

      {/* Interview Rounds Accordion */}
      <Card>
        <CardHeader>
          <CardTitle>Interview Rounds</CardTitle>
          <CardDescription>The stages of the interview process for this position</CardDescription>
        </CardHeader>
        <CardContent>
          {job.rounds && job.rounds.length > 0 ? (
            <Accordion type="single" collapsible className="w-full">
              {job.rounds.map((round) => (
                <AccordionItem key={round.id} value={`round-${round.id}`}>
                  <AccordionTrigger className="px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-md">
                    <div className="flex items-center justify-between w-full text-left">
                      <div className="flex items-center space-x-3">
                        <Badge variant="outline" className="px-3 py-1">
                          Round {round.round_number}
                        </Badge>
                        <span className="font-medium">{round.title}</span>
                      </div>
                      <div className="flex items-center space-x-3 text-sm text-gray-500">
                        <span>{round.round_type}</span>
                        <span className="px-2 py-1 rounded bg-gray-100 dark:bg-gray-700">
                          {round.duration_minutes} min
                        </span>
                        <span>{round.questions?.length || 0} questions</span>
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-4 py-3 border rounded-md bg-gray-50 dark:bg-gray-800 dark:border-gray-700 mt-2 mb-4">
                    <div className="mb-4">
                      <h4 className="mb-2 font-medium">Description</h4>
                      <p className="text-gray-700 dark:text-gray-300">{round.description}</p>
                    </div>
                    
                    <div className="mt-4">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-medium">Questions ({round.questions?.length || 0})</h4>
                        <Link
                          href={`/admin/questions/generate?stage_id=${round.id}`}
                          className="px-3 py-1 text-sm text-white transition bg-purple-600 rounded hover:bg-purple-700"
                        >
                          Add Questions
                        </Link>
                      </div>
                      
                      {round.questions && round.questions.length > 0 ? (
                        <div className="space-y-3">
                          {round.questions.map((question: StageQuestion, index: number) => (
                            <div key={question.id} className="p-4 border rounded-md bg-white dark:bg-gray-700">
                              <div className="flex items-center justify-between mb-2">
                                <Badge className="px-2 py-1 mb-2">{question.question_type}</Badge>
                                {question.difficulty_level && (
                                  <Badge 
                                    variant={
                                      question.difficulty_level === "Easy" 
                                        ? "outline" 
                                        : question.difficulty_level === "Medium" 
                                          ? "secondary" 
                                          : "default"
                                    }
                                    className="px-2 py-1"
                                  >
                                    {question.difficulty_level}
                                  </Badge>
                                )}
                              </div>
                              <p className="mb-3 font-medium">{index + 1}. {question.question_text}</p>
                              
                              {question.question_type === "MCQ" && (
                                <div className="ml-4 space-y-1">
                                  {Array.isArray(question.options) && question.options.map((option: string, optIndex: number) => (
                                    <div key={optIndex} className="flex items-start">
                                      <div className={`flex items-center justify-center w-5 h-5 mt-0.5 mr-2 rounded-full border ${
                                        question.correct_option_index === optIndex 
                                          ? "bg-green-100 border-green-500 text-green-500" 
                                          : "border-gray-300"
                                      }`}>
                                        {question.correct_option_index === optIndex && (
                                          <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                          </svg>
                                        )}
                                      </div>
                                      <p className="text-gray-700 dark:text-gray-300">{option}</p>
                                    </div>
                                  ))}
                                </div>
                              )}
                              
                              <div className="flex items-center justify-between mt-3 text-sm text-gray-500">
                                <span>{question.marks} marks</span>
                                <span>{question.time_limit_seconds} seconds</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="p-6 text-center border rounded-md bg-gray-50 dark:bg-gray-700">
                          <p className="text-gray-500 dark:text-gray-400">No questions added yet</p>
                        </div>
                      )}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          ) : (
            <div className="p-6 text-center border rounded-md bg-gray-50 dark:bg-gray-700">
              <p className="mb-4 text-gray-500 dark:text-gray-400">No interview rounds have been created yet</p>
              <Link
                href={`/admin/rounds/create?job_id=${job.id}`}
                className="px-4 py-2 text-white transition bg-blue-600 rounded hover:bg-blue-700"
              >
                Create First Round
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}