// app/admin/questions/generate/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { QuestionData, JobRoundDetails } from "@/app/types/interface";
export default function GenerateQuestionsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const jobId = searchParams.get("job_id");
  const roundNumber = searchParams.get("round");

  const [roundDetails, setRoundDetails] = useState<JobRoundDetails | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);
  const [generatedQuestions, setGeneratedQuestions] = useState<QuestionData[]>([]);
  const [formData, setFormData] = useState({
    numQuestions: 5,
    difficultyLevel: "Medium",
    questionType: "MCQ",
    topic: "",
    additionalInfo: "",
  });

  useEffect(() => {
    if (!jobId || !roundNumber) {
      setError("Missing job ID or round number");
      return;
    }

    const fetchJobDetails = async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_HOST}/api/admin/jobs/${jobId}`);
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error || "Failed to fetch job details");
        }
        return data;
      } catch (err) {
        console.error("Error fetching job details:", err);
        return null;
      }
    };

    // Create an immediately invoked async function to handle the async operation
    (async () => {
      const jobDetails = await fetchJobDetails();
      if (!jobDetails) {
        setError("Failed to fetch job details");
        return;
      }

      // Log the job details to debug
      console.log("Job details from API:", jobDetails);
      
      setRoundDetails({
        job_id: parseInt(jobDetails.job_id), // Use the correct job ID from the API response
        job_title: jobDetails.job_title,
        department: jobDetails.department,
        experience_min: jobDetails.experience_min,
        experience_max: jobDetails.experience_max,
        round_id: parseInt(jobDetails.round_number), // Use the interview stage ID from the API response
        round_number: parseInt(jobDetails.round_number),
        round_type: jobDetails.round_type,
        round_title: jobDetails.title || jobDetails.round_title,
        description: jobDetails.description || "",
      });
      
      console.log("Set round details:", {
        job_id: parseInt(jobDetails.id),
        round_id: parseInt(jobDetails.id),
        round_type: jobDetails.round_type
      });

      // Set default question type based on round_type
      const questionType = jobDetails.round_type

      // Set default additionalInfo to include job description
      setFormData((prev) => ({
        ...prev,
        questionType: questionType,
        additionalInfo: jobDetails.description || "",
      }));
    })();
  }, [jobId, roundNumber]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;

    if (type === "number") {
      setFormData({
        ...formData,
        [name]: parseInt(value, 10) || 0,
      });
    } else {
      setFormData({
        ...formData,
        [name]: value,
      });
    }
  };

  const generateQuestions = async () => {
    setIsLoading(true);
    setError(null);

    if (!roundDetails) {
      setError("Job and round details are required");
      setIsLoading(false);
      return;
    }

    try {
      console.log({
        job_id: roundDetails.job_id,
        interview_stage_id: roundDetails.round_id,
        question_count: formData.numQuestions,
        difficulty: formData.difficultyLevel,
        additional_context: formData.topic + (formData.additionalInfo ? `. ${formData.additionalInfo}` : ""),
        question_type:  formData.questionType
      })  
      // Call the AI questions API with the necessary parameters
      const response = await fetch(`/api/ai/questions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          job_id: roundDetails.job_id,
          interview_stage_id: roundDetails.round_id,
          question_count: formData.numQuestions,
          difficulty: formData.difficultyLevel,
          additional_context: formData.topic + (formData.additionalInfo ? `. ${formData.additionalInfo}` : ""),
          question_type: formData.questionType
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to generate questions");
      }

      const data = await response.json();
      console.log("Generated questions:", data);
      
      // Format the response data to match our QuestionData interface
      const formattedQuestions = data.map((question: any) => ({
        interview_stage_id: roundDetails.round_id,
        question_text: question.question_text,
        options: Array.isArray(question.options) ? question.options : [],
        correct_option_index: question.correct_option_index || 0,
        question_type: question.question_type || formData.questionType,
        difficulty_level: question.difficulty_level || formData.difficultyLevel,
        marks: question.marks || 1,
        time_limit_seconds: question.time_limit_seconds || 60,
        expected_keywords: question.expected_keywords || []
      }));
      
      setGeneratedQuestions(formattedQuestions);
    } catch (err) {
      console.error("Error generating questions:", err);
      setError((err as Error).message || "Failed to generate questions");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      // Check if roundDetails exists
      if (!roundDetails) {
        throw new Error("Round details are missing. Please try again.");
      }
      
      // Submit all questions one by one
      for (const question of generatedQuestions) {
        // Ensure we're using the correct job_id and interview_stage_id
        const questionData = {
          ...question,
          job_id: roundDetails.job_id, // Add job_id to each question
          interview_stage_id: roundDetails.round_id // Ensure correct stage ID
        };

        console.log("Saving question with data:", questionData);

        const response = await fetch(`${process.env.NEXT_PUBLIC_HOST}/api/stageQuestions`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(questionData),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Failed to save questions");
        }
      }

      setSuccess(true);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuestionChange = (index: number, field: keyof QuestionData, value: string | string[] | number) => {
    const updatedQuestions = [...generatedQuestions];

    if (field === "options" && typeof value === "string") {
      // Split the textarea by new lines to get array of options
      updatedQuestions[index][field] = value.split("\n");
    } else {
      // Type assertion to tell TypeScript this assignment is valid
      (updatedQuestions[index][field] as any) = value;
    }

    setGeneratedQuestions(updatedQuestions);
  };

  if (!jobId || !roundNumber) {
    return (
      <div className="p-4 mb-6 text-sm text-red-700 bg-red-100 rounded-lg dark:bg-red-900 dark:text-red-200">
        <p>Missing job ID or round number. Please select a job and round first.</p>
        <Link
          href="/admin/jobs"
          className="inline-block mt-2 text-blue-600 underline hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
        >
          Go to Jobs List
        </Link>
      </div>
    );
  }

  if (!roundDetails) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Generate Questions with AI
        </h1>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
          For {roundDetails.job_title} - Round {roundDetails.round_number}: {roundDetails.round_title}
        </p>
      </div>

      {error && (
        <div className="p-4 mb-6 text-sm text-red-700 bg-red-100 rounded-lg dark:bg-red-900 dark:text-red-200">
          <p>{error}</p>
        </div>
      )}

      {success ? (
        <div className="p-6 bg-white rounded-lg shadow dark:bg-gray-800">
          <div className="flex items-center justify-center">
            <div className="p-3 text-green-500 bg-green-100 rounded-full dark:bg-green-900">
              <svg
                className="w-8 h-8"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M5 13l4 4L19 7"
                ></path>
              </svg>
            </div>
          </div>
          <h2 className="mt-4 text-xl font-semibold text-center text-gray-800 dark:text-white">
            Questions Saved Successfully!
          </h2>
          <p className="mt-2 text-center text-gray-600 dark:text-gray-400">
            {generatedQuestions.length} questions have been saved for Round {roundDetails.round_number}: {roundDetails.round_title}.
          </p>
          <div className="flex justify-center mt-6 space-x-4">
            <button
              onClick={() => router.push("/admin/rounds")}
              className="px-4 py-2 font-medium text-gray-700 transition bg-gray-200 rounded-md dark:text-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
            >
              Go to Rounds
            </button>
            <button
              onClick={() => router.push(`/admin/jobs/${jobId}`)}
              className="px-4 py-2 font-medium text-white transition bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              View Job
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="p-6 bg-white rounded-lg shadow dark:bg-gray-800">
            <h2 className="mb-4 text-lg font-medium text-gray-900 dark:text-white">
              Question Generation Settings
            </h2>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div>
                <label
                  htmlFor="numQuestions"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Number of Questions
                </label>
                <input
                  type="number"
                  id="numQuestions"
                  name="numQuestions"
                  value={formData.numQuestions}
                  onChange={handleChange}
                  min="1"
                  max="20"
                  className="block w-full px-3 py-2 mt-1 text-gray-700 border border-gray-300 rounded-md shadow-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label
                  htmlFor="difficultyLevel"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Difficulty Level
                </label>
                <select
                  id="difficultyLevel"
                  name="difficultyLevel"
                  value={formData.difficultyLevel}
                  onChange={handleChange}
                  className="block w-full px-3 py-2 mt-1 text-gray-700 border border-gray-300 rounded-md shadow-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="Easy">Easy</option>
                  <option value="Medium">Medium</option>
                  <option value="Hard">Hard</option>
                  <option value="Mixed">Mixed (variety of difficulties)</option>
                </select>
              </div>

              {roundDetails.round_type?.toLowerCase() !== "interview" && (
                <div>
                  <label
                    htmlFor="questionType"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                  >
                    Question Type
                  </label>
                  <select
                    id="questionType"
                    name="questionType"
                    value={formData.questionType}
                    onChange={handleChange}
                    className="block w-full px-3 py-2 mt-1 text-gray-700 border border-gray-300 rounded-md shadow-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="MCQ">Multiple Choice</option>
                    <option value="Short Answer">Short Answer</option>
                  </select>
                </div>
              )}
              {roundDetails.round_type?.toLowerCase() === "interview" && (
                <div>
                  <label
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                  >
                    Question Type
                  </label>
                  <div className="block w-full px-3 py-2 mt-1 text-gray-700 border border-gray-300 rounded-md shadow-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white">
                    Open-ended (Interview)
                  </div>
                  <input type="hidden" name="questionType" value="Interview" />
                </div>
              )}

              <div>
                <label
                  htmlFor="topic"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Topic Focus (Optional)
                </label>
                <input
                  type="text"
                  id="topic"
                  name="topic"
                  value={formData.topic}
                  onChange={handleChange}
                  placeholder="e.g., React, Data Structures, Marketing"
                  className="block w-full px-3 py-2 mt-1 text-gray-700 border border-gray-300 rounded-md shadow-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            <div className="mt-6">
              <label
                htmlFor="additionalInfo"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Additional Information (Optional)
              </label>
              <textarea
                id="additionalInfo"
                name="additionalInfo"
                value={formData.additionalInfo}
                onChange={handleChange}
                rows={3}
                placeholder="Job description is included by default. Add any additional requirements here..."
                className="block w-full px-3 py-2 mt-1 text-gray-700 border border-gray-300 rounded-md shadow-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              ></textarea>
            </div>
            <div className="flex justify-end mt-6">
              <button
                type="button"
                onClick={generateQuestions}
                disabled={isLoading}
                className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                {isLoading ? (
                  <>
                    <svg
                      className="w-4 h-4 mr-2 -ml-1 text-white animate-spin"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Generating...
                  </>
                ) : (
                  "Generate Questions"
                )}
              </button>
            </div>
          </div>

          {generatedQuestions.length > 0 && (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="p-6 bg-white rounded-lg shadow dark:bg-gray-800">
                <h2 className="mb-4 text-lg font-medium text-gray-900 dark:text-white">
                  Generated Questions
                </h2>
                <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">
                  Review and edit the questions before saving.
                </p>

                <div className="space-y-6">
                  {generatedQuestions.map((question, index) => (
                    <div
                      key={index}
                      className="p-4 border border-gray-200 rounded-lg dark:border-gray-700"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-base font-medium text-gray-800 dark:text-white">
                          Question {index + 1}
                        </h3>
                        <span className="px-2 py-1 text-xs font-medium text-blue-700 bg-blue-100 rounded-full dark:bg-blue-900 dark:text-blue-300">
                          {question.difficulty_level}
                        </span>
                      </div>

                      <div className="space-y-4">
                        <div>
                          <label
                            htmlFor={`question-${index}`}
                            className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                          >
                            Question Text
                          </label>
                          <textarea
                            id={`question-${index}`}
                            value={question.question_text}
                            onChange={(e) =>
                              handleQuestionChange(
                                index,
                                "question_text",
                                e.target.value
                              )
                            }
                            rows={2}
                            className="block w-full px-3 py-2 mt-1 text-gray-700 border border-gray-300 rounded-md shadow-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                          ></textarea>
                        </div>

                        <div>
                          <label
                            htmlFor={`options-${index}`}
                            className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                          >
                            Options (one per line)
                          </label>
                          <textarea
                            id={`options-${index}`}
                            value={question.options.join("\n")}
                            onChange={(e) =>
                              handleQuestionChange(
                                index,
                                "options",
                                e.target.value
                              )
                            }
                            rows={4}
                            className="block w-full px-3 py-2 mt-1 text-gray-700 border border-gray-300 rounded-md shadow-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                          ></textarea>
                        </div>

                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                          <div>
                            <label
                              htmlFor={`correct-${index}`}
                              className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                            >
                              Correct Option Index
                            </label>
                            <select
                              id={`correct-${index}`}
                              value={question.correct_option_index}
                              onChange={(e) =>
                                handleQuestionChange(
                                  index,
                                  "correct_option_index",
                                  parseInt(e.target.value)
                                )
                              }
                              className="block w-full px-3 py-2 mt-1 text-gray-700 border border-gray-300 rounded-md shadow-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                            >
                              {question.options.map((_, optionIndex) => (
                                <option key={optionIndex} value={optionIndex}>
                                  Option {optionIndex + 1}
                                </option>
                              ))}
                            </select>
                          </div>

                          <div>
                            <label
                              htmlFor={`marks-${index}`}
                              className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                            >
                              Marks/Points
                            </label>
                            <input
                              type="number"
                              id={`marks-${index}`}
                              value={question.marks}
                              onChange={(e) =>
                                handleQuestionChange(
                                  index,
                                  "marks",
                                  parseInt(e.target.value)
                                )
                              }
                              min="1"
                              max="10"
                              className="block w-full px-3 py-2 mt-1 text-gray-700 border border-gray-300 rounded-md shadow-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                            />
                          </div>

                          <div>
                            <label
                              htmlFor={`time-${index}`}
                              className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                            >
                              Time Limit (seconds)
                            </label>
                            <input
                              type="number"
                              id={`time-${index}`}
                              value={question.time_limit_seconds}
                              onChange={(e) =>
                                handleQuestionChange(
                                  index,
                                  "time_limit_seconds",
                                  parseInt(e.target.value)
                                )
                              }
                              min="10"
                              step="5"
                              className="block w-full px-3 py-2 mt-1 text-gray-700 border border-gray-300 rounded-md shadow-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                            />
                          </div>
                        </div>

                        {question.question_type === "Short Answer" && (
                          <div>
                            <label
                              htmlFor={`keywords-${index}`}
                              className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                            >
                              Expected Keywords (comma separated)
                            </label>
                            <input
                              type="text"
                              id={`keywords-${index}`}
                              value={question.expected_keywords?.join(", ") || ""}
                              onChange={(e) =>
                                handleQuestionChange(
                                  index,
                                  "expected_keywords",
                                  e.target.value.split(",").map((k) => k.trim())
                                )
                              }
                              className="block w-full px-3 py-2 mt-1 text-gray-700 border border-gray-300 rounded-md shadow-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex justify-end mt-6 space-x-3">
                  <button
                    type="button"
                    onClick={() => setGeneratedQuestions([])}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md dark:text-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                  >
                    Discard
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  >
                    {isSubmitting ? (
                      <>
                        <svg
                          className="w-4 h-4 mr-2 -ml-1 text-white animate-spin"
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          ></circle>
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          ></path>
                        </svg>
                        Saving...
                      </>
                    ) : (
                      "Save All Questions"
                    )}
                  </button>
                </div>
              </div>
            </form>
          )}
        </div>
      )}
    </div>
  );
}