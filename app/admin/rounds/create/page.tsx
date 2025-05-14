// app/admin/rounds/create/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

interface RoundFormData {
  job_id: number;
  round_number: number;
  round_type: "Quiz" | "Interview"
  title: string;
  description: string;
  duration_minutes: number;
  is_mandatory: number;
}

interface JobDetails {
  id: number;
  job_title: string;
  department: string;
}

export default function CreateRoundsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const jobId = searchParams.get("job_id");

  const [jobDetails, setJobDetails] = useState<JobDetails | null>(null);
  const [rounds, setRounds] = useState<RoundFormData[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [totalSteps, setTotalSteps] = useState(1);

  useEffect(() => {
    if (!jobId) {
      setError("No job ID provided");
      return;
    }

    // In a real app, fetch job details here
    // For now using mock data
    setJobDetails({
      id: parseInt(jobId),
      job_title: "Software Engineer",
      department: "Engineering",
    });

    // Initialize with one round
    setRounds([
      {
        job_id: parseInt(jobId),
        round_number: 1,
        round_type: "Quiz",
        title: "Technical Screening",
        description: "Initial assessment of technical skills",
        duration_minutes: 30,
        is_mandatory: 1,
      },
    ]);
  }, [jobId]);

  const handleAddRound = () => {
    setRounds([
      ...rounds,
      {
        job_id: parseInt(jobId || "0"),
        round_number: rounds.length + 1,
        round_type: "Interview",
        title: "",
        description: "",
        duration_minutes: 45,
        is_mandatory: 1,
      },
    ]);
    setTotalSteps(rounds.length + 1);
  };

  const handleRemoveRound = (index: number) => {
    if (rounds.length === 1) {
      return; // Don't remove the last round
    }
    
    const updatedRounds = rounds.filter((_, i) => i !== index);
    // Update round numbers
    updatedRounds.forEach((round, i) => {
      round.round_number = i + 1;
    });
    
    setRounds(updatedRounds);
    setTotalSteps(updatedRounds.length);
    
    // Adjust current step if needed
    if (currentStep > updatedRounds.length) {
      setCurrentStep(updatedRounds.length);
    }
  };

  const handleChangeRound = (index: number, field: keyof RoundFormData, value: string | number | boolean) => {
    const updatedRounds = [...rounds];
  
    switch(field) {
      case "duration_minutes":
      case "job_id":
      case "round_number":
        updatedRounds[index][field] = typeof value === 'string' ? parseInt(value) : value as number;
        break;
      case "is_mandatory":
        updatedRounds[index][field] = value ? 1 : 0;
        break;
      case "round_type":
        // Ensure value is one of the allowed round types
        updatedRounds[index][field] = value as "Quiz" | "Interview"
        break;
      case "title":
      case "description":
        updatedRounds[index][field] = value as string;
        break;
    }
  
    setRounds(updatedRounds);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      // Submit all rounds one by one
      for (const round of rounds) {
        const response = await fetch(`${process.env.NEXT_PUBLIC_HOST}/api/createRounds`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(round),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || `Failed to create round ${round.round_number}`);
        }
      }

      setSuccess(true);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const goToNextStep = () => {
    if (currentStep < rounds.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const goToPrevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const goToGenerateQuestions = (roundIndex: number) => {
    router.push(`/admin/questions/generate?job_id=${jobId}&round=${roundIndex + 1}`);
  };

  if (!jobId) {
    return (
      <div className="p-4 mb-6 text-sm text-red-700 bg-red-100 rounded-lg dark:bg-red-900 dark:text-red-200">
        <p>No job ID provided. Please select a job first.</p>
        <Link
          href="/admin/jobs"
          className="inline-block mt-2 text-blue-600 underline hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
        >
          Go to Jobs List
        </Link>
      </div>
    );
  }

  if (!jobDetails) {
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
          Create Interview Rounds
        </h1>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
          Set up interview stages for {jobDetails.job_title} ({jobDetails.department})
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
            Interview Rounds Created Successfully!
          </h2>
          <p className="mt-2 text-center text-gray-600 dark:text-gray-400">
            {rounds.length} interview {rounds.length === 1 ? "round" : "rounds"} have been set up for {jobDetails.job_title}.
          </p>
          <div className="mt-6">
            <h3 className="mb-3 text-lg font-medium text-gray-800 dark:text-white">
              Next Steps:
            </h3>
            <div className="space-y-4">
              {rounds.map((round, index) => (
                <div
                  key={index}
                  className="p-4 bg-gray-50 border border-gray-200 rounded-lg dark:bg-gray-700 dark:border-gray-600"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-gray-800 dark:text-white">
                        Round {round.round_number}: {round.title}
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {round.round_type} - {round.duration_minutes} minutes
                      </p>
                    </div>
                    <button
                      onClick={() => goToGenerateQuestions(index)}
                      className="px-3 py-1 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                    >
                      Generate Questions
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex justify-center mt-6 space-x-4">
              <button
                onClick={() => router.push(`/admin/jobs/${jobId}`)}
                className="px-4 py-2 font-medium text-gray-700 transition bg-gray-200 rounded-md dark:text-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
              >
                Finish
              </button>
            </div>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit}>
          {/* Progress indicator */}
          <div className="mb-6">
            <div className="flex items-center">
              <div className="flex items-center text-sm font-medium text-gray-500 dark:text-gray-400">
                <span className="mr-2">
                  Round {currentStep} of {rounds.length}
                </span>
                <div className="h-2 w-40 bg-gray-200 rounded-full dark:bg-gray-700">
                  <div
                    className="h-2 bg-blue-600 rounded-full"
                    style={{
                      width: `${(currentStep / rounds.length) * 100}%`,
                    }}
                  ></div>
                </div>
              </div>
              <button
                type="button"
                onClick={handleAddRound}
                className="ml-auto px-2 py-1 text-sm font-medium text-blue-600 bg-blue-100 rounded-md dark:text-blue-400 dark:bg-blue-900 hover:bg-blue-200 dark:hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                + Add Round
              </button>
            </div>
          </div>

          {/* Round form */}
          {rounds.map((round, index) => (
            <div
              key={index}
              className={`p-6 bg-white rounded-lg shadow dark:bg-gray-800 ${
                currentStep === index + 1 ? "block" : "hidden"
              }`}
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-medium text-gray-900 dark:text-white">
                  Round {round.round_number}
                </h2>
                {rounds.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveRound(index)}
                    className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                  >
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      ></path>
                    </svg>
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                {/* Round Title */}
                <div>
                  <label
                    htmlFor={`title-${index}`}
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                  >
                    Round Title *
                  </label>
                  <input
                    type="text"
                    id={`title-${index}`}
                    value={round.title}
                    onChange={(e) =>
                      handleChangeRound(index, "title", e.target.value)
                    }
                    required
                    className="block w-full px-3 py-2 mt-1 text-gray-700 border border-gray-300 rounded-md shadow-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                {/* Round Type */}
                <div>
                  <label
                    htmlFor={`round_type-${index}`}
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                  >
                    Round Type *
                  </label>
                  <select
                    id={`round_type-${index}`}
                    value={round.round_type}
                    onChange={(e) =>
                      handleChangeRound(
                        index,
                        "round_type",
                        e.target.value as RoundFormData["round_type"]
                      )
                    }
                    required
                    className="block w-full px-3 py-2 mt-1 text-gray-700 border border-gray-300 rounded-md shadow-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="Quiz">Quiz</option>
                    <option value="Interview">Interview</option>
                    <option value="Assignment">Assignment</option>
                    <option value="Group Discussion">Group Discussion</option>
                    <option value="HR">HR</option>
                  </select>
                </div>

                {/* Duration */}
                <div>
                  <label
                    htmlFor={`duration_minutes-${index}`}
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                  >
                    Duration (minutes) *
                  </label>
                  <input
                    type="number"
                    id={`duration_minutes-${index}`}
                    value={round.duration_minutes}
                    onChange={(e) =>
                      handleChangeRound(
                        index,
                        "duration_minutes",
                        e.target.value
                      )
                    }
                    min="5"
                    required
                    className="block w-full px-3 py-2 mt-1 text-gray-700 border border-gray-300 rounded-md shadow-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                {/* Is Mandatory */}
                <div className="flex items-center mt-6">
                  <input
                    type="checkbox"
                    id={`is_mandatory-${index}`}
                    checked={round.is_mandatory === 1}
                    onChange={(e) =>
                      handleChangeRound(
                        index,
                        "is_mandatory",
                        e.target.checked
                      )
                    }
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded dark:border-gray-600 focus:ring-blue-500"
                  />
                  <label
                    htmlFor={`is_mandatory-${index}`}
                    className="block ml-2 text-sm font-medium text-gray-700 dark:text-gray-300"
                  >
                    Mandatory Round
                  </label>
                </div>
              </div>

              {/* Description */}
              <div className="mt-6">
                <label
                  htmlFor={`description-${index}`}
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Description *
                </label>
                <textarea
                  id={`description-${index}`}
                  value={round.description}
                  onChange={(e) =>
                    handleChangeRound(index, "description", e.target.value)
                  }
                  required
                  rows={3}
                  className="block w-full px-3 py-2 mt-1 text-gray-700 border border-gray-300 rounded-md shadow-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                ></textarea>
              </div>

              {/* Navigation buttons */}
              <div className="flex justify-between mt-6">
                <button
                  type="button"
                  onClick={goToPrevStep}
                  disabled={currentStep === 1}
                  className={`px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md dark:text-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 ${
                    currentStep === 1 && "opacity-50 cursor-not-allowed"
                  }`}
                >
                  Previous
                </button>
                <div>
                  {currentStep < rounds.length ? (
                    <button
                      type="button"
                      onClick={goToNextStep}
                      className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                    >
                      Next
                    </button>
                  ) : (
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
                        "Save All Rounds"
                      )}
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </form>
      )}
    </div>
  );
}