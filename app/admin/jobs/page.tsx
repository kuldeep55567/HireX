// app/admin/jobs/page.tsx
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Job, Question, Round, fetchJobs, updateQuestion } from "@/services/admin.service";
import QuestionDetailModal from "@/components/QuestionDetailModel";

export default function AdminJobsPage() {
  const router = useRouter();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedJobs, setExpandedJobs] = useState<Record<number, boolean>>({});
  const [expandedRounds, setExpandedRounds] = useState<Record<string, boolean>>({});
  const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentJobId, setCurrentJobId] = useState<number | null>(null);
  const [currentRoundId, setCurrentRoundId] = useState<number | null>(null);

  useEffect(() => {
    loadJobs();
  }, []);

  const loadJobs = async () => {
    try {
      setLoading(true);
      const response = await fetchJobs();
      
      if (response.success) {
        setJobs(response.data);
        
        // Initialize expanded state
        const jobsExpanded: Record<number, boolean> = {};
        const roundsExpanded: Record<string, boolean> = {};
        
        response.data.forEach(job => {
          jobsExpanded[job.id] = false;
          job.rounds.forEach(round => {
            roundsExpanded[`${job.id}-${round.id}`] = false;
          });
        });
        
        setExpandedJobs(jobsExpanded);
        setExpandedRounds(roundsExpanded);
      } else {
        throw new Error("API returned error");
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const toggleJobExpand = (jobId: number) => {
    setExpandedJobs({
      ...expandedJobs,
      [jobId]: !expandedJobs[jobId]
    });
  };

  const toggleRoundExpand = (jobId: number, roundId: number) => {
    const key = `${jobId}-${roundId}`;
    setExpandedRounds({
      ...expandedRounds,
      [key]: !expandedRounds[key]
    });
  };

  const handleEditJob = (jobId: number) => {
    router.push(`/admin/jobs/edit/${jobId}`);
  };

  const handleAddRound = (jobId: number) => {
    router.push(`/admin/rounds/create?job_id=${jobId}`);
  };

  const handleEditRound = (jobId: number, roundId: number) => {
    router.push(`/admin/rounds/edit/${roundId}?job_id=${jobId}`);
  };

  const handleGenerateQuestions = (jobId: number, roundNumber: number) => {
    router.push(`/admin/questions/generate?job_id=${jobId}&round=${roundNumber}`);
  };

  const handleOpenQuestionModal = (jobId: number, roundId: number, question: Question) => {
    setCurrentJobId(jobId);
    setCurrentRoundId(roundId);
    setSelectedQuestion(question);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedQuestion(null);
    setCurrentJobId(null);
    setCurrentRoundId(null);
  };

  const handleSaveQuestion = async (updatedQuestion: Question) => {
    try {
      await updateQuestion(updatedQuestion.id, updatedQuestion);
      
      // Update the question in the local state
      if (currentJobId !== null && currentRoundId !== null) {
        const updatedJobs = [...jobs];
        const jobIndex = updatedJobs.findIndex(job => job.id === currentJobId);
        
        if (jobIndex !== -1) {
          const roundIndex = updatedJobs[jobIndex].rounds.findIndex(
            round => round.id === currentRoundId
          );
          
          if (roundIndex !== -1) {
            const questionIndex = updatedJobs[jobIndex].rounds[roundIndex].questions.findIndex(
              q => q.id === updatedQuestion.id
            );
            
            if (questionIndex !== -1) {
              updatedJobs[jobIndex].rounds[roundIndex].questions[questionIndex] = updatedQuestion;
              setJobs(updatedJobs);
            }
          }
        }
      }
      
      // Close the modal
      handleCloseModal();
    } catch (err) {
      throw err;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[60vh]">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 mx-auto max-w-7xl">
        <div className="p-4 mb-6 text-sm text-red-700 bg-red-100 rounded-lg dark:bg-red-900 dark:text-red-200">
          <p>Error: {error}</p>
          <button
            onClick={loadJobs}
            className="mt-2 text-sm font-medium underline"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }
  return (
    <div className="p-6 mx-auto max-w-7xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Job Listings Management
        </h1>
        <Link
          href="/admin/jobs/create"
          className="px-4 py-2 font-medium text-white transition bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          Create New Job
        </Link>
      </div>

      {jobs.length === 0 ? (
        <div className="p-8 text-center bg-white rounded-lg shadow dark:bg-gray-800">
          <p className="text-gray-600 dark:text-gray-400">
            No jobs found. Create your first job posting to get started.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {jobs.map((job) => (
            <div
              key={job.id}
              className="overflow-hidden bg-white rounded-lg shadow dark:bg-gray-800"
            >
              {/* Job Header */}
              <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <button
                      onClick={() => toggleJobExpand(job.id)}
                      className="mr-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className={`w-5 h-5 transition-transform ${
                          expandedJobs[job.id] ? "rotate-90" : ""
                        }`}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 5l7 7-7 7"
                        />
                      </svg>
                    </button>
                    <div>
                      <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                        {job.job_title}
                      </h2>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {job.department} · {job.location} · {job.job_type}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span
                      className={`px-3 py-1 text-xs font-medium rounded-full ${
                        job.is_open
                          ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                          : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                      }`}
                    >
                      {job.is_open ? "Open" : "Closed"}
                    </span>
                    <button
                      onClick={() => handleEditJob(job.id)}
                      className="p-2 text-blue-600 transition bg-blue-100 rounded-full hover:bg-blue-200 dark:bg-blue-900 dark:text-blue-400 dark:hover:bg-blue-800"
                      title="Edit Job"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="w-4 h-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                        />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>

              {/* Job Details */}
              {expandedJobs[job.id] && (
                <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                    <div>
                      <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                        Experience Required
                      </p>
                      <p className="text-gray-900 dark:text-white">
                        {job.experience_min}-{job.experience_max} years
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                        Notice Period
                      </p>
                      <p className="text-gray-900 dark:text-white">
                        {job.notice_period_days} days
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                        Positions
                      </p>
                      <p className="text-gray-900 dark:text-white">
                        {job.available_positions} available, {job.total_applied} applied
                      </p>
                    </div>
                    <div className="md:col-span-2 lg:col-span-3">
                      <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                        Description
                      </p>
                      <p className="text-gray-900 dark:text-white">
                        {job.description}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                        Interview Rounds
                      </h3>
                      <button
                        onClick={() => handleAddRound(job.id)}
                        className="px-3 py-1 text-xs font-medium text-blue-600 transition bg-blue-100 rounded-md hover:bg-blue-200 dark:bg-blue-900 dark:text-blue-400 dark:hover:bg-blue-800"
                      >
                        Add Round
                      </button>
                    </div>

                    {job.rounds.length === 0 ? (
                      <div className="p-4 text-center bg-gray-50 rounded-lg dark:bg-gray-700">
                        <p className="text-gray-600 dark:text-gray-400">
                          No interview rounds created yet.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {job.rounds.map((round) => (
                          <div
                            key={round.id}
                            className="overflow-hidden border border-gray-200 rounded-lg dark:border-gray-700"
                          >
                            {/* Round header */}
                            <div
                              className="flex items-center justify-between px-4 py-3 bg-gray-50 cursor-pointer dark:bg-gray-700"
                              onClick={() => toggleRoundExpand(job.id, round.id)}
                            >
                              <div className="flex items-center">
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  className={`w-4 h-4 mr-2 transition-transform text-gray-500 dark:text-gray-400 ${
                                    expandedRounds[`${job.id}-${round.id}`] ? "rotate-90" : ""
                                  }`}
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  stroke="currentColor"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M9 5l7 7-7 7"
                                  />
                                </svg>
                                <div>
                                  <h4 className="font-medium text-gray-900 dark:text-white">
                                    Round {round.round_number}: {round.title}
                                  </h4>
                                  <p className="text-sm text-gray-600 dark:text-gray-400">
                                    {round.round_type} · {round.duration_minutes} minutes
                                  </p>
                                </div>
                              </div>
                              <div className="flex space-x-2">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleGenerateQuestions(job.id, round.round_number);
                                  }}
                                  className="px-2 py-1 text-xs font-medium text-purple-600 transition bg-purple-100 rounded-md hover:bg-purple-200 dark:bg-purple-900 dark:text-purple-400 dark:hover:bg-purple-800"
                                >
                                  Generate Questions
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleEditRound(job.id, round.id);
                                  }}
                                  className="p-1 text-blue-600 transition bg-blue-100 rounded-full hover:bg-blue-200 dark:bg-blue-900 dark:text-blue-400 dark:hover:bg-blue-800"
                                  title="Edit Round"
                                >
                                  <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    className="w-3 h-3"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                                    />
                                  </svg>
                                </button>
                              </div>
                            </div>

                            {/* Round details and questions */}
                            {expandedRounds[`${job.id}-${round.id}`] && (
                              <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-700">
                                <p className="mb-4 text-sm text-gray-700 dark:text-gray-300">
                                  {round.description}
                                </p>

                                <div className="mt-4">
                                  <h5 className="mb-3 text-sm font-medium text-gray-700 dark:text-gray-300">
                                    Questions ({round.questions.length})
                                  </h5>

                                  {round.questions.length === 0 ? (
                                    <div className="p-3 text-center text-sm bg-gray-50 rounded dark:bg-gray-700">
                                      <p className="text-gray-600 dark:text-gray-400">
                                        No questions added yet.
                                      </p>
                                    </div>
                                  ) : (
                                    <div className="overflow-x-auto">
                                      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                        <thead className="bg-gray-50 dark:bg-gray-700">
                                          <tr>
                                            <th
                                              scope="col"
                                              className="px-3 py-2 text-xs font-medium tracking-wider text-left text-gray-500 uppercase dark:text-gray-300"
                                            >
                                              ID
                                            </th>
                                            <th
                                              scope="col"
                                              className="px-3 py-2 text-xs font-medium tracking-wider text-left text-gray-500 uppercase dark:text-gray-300"
                                            >
                                              Question
                                            </th>
                                            <th
                                              scope="col"
                                              className="px-3 py-2 text-xs font-medium tracking-wider text-left text-gray-500 uppercase dark:text-gray-300"
                                            >
                                              Type
                                            </th>
                                            <th
                                              scope="col"
                                              className="px-3 py-2 text-xs font-medium tracking-wider text-left text-gray-500 uppercase dark:text-gray-300"
                                            >
                                              Difficulty
                                            </th>
                                            <th
                                              scope="col"
                                              className="px-3 py-2 text-xs font-medium tracking-wider text-left text-gray-500 uppercase dark:text-gray-300"
                                            >
                                              Marks
                                            </th>
                                            <th
                                              scope="col"
                                              className="px-3 py-2 text-xs font-medium tracking-wider text-left text-gray-500 uppercase dark:text-gray-300"
                                            >
                                              Time (s)
                                            </th>
                                            <th
                                              scope="col"
                                              className="px-3 py-2 text-xs font-medium tracking-wider text-right text-gray-500 uppercase dark:text-gray-300"
                                            >
                                              Actions
                                            </th>
                                          </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-200 dark:bg-gray-800 dark:divide-gray-700">
                                          {round.questions.map((question) => (
                                            <tr
                                              key={question.id}
                                              className="hover:bg-gray-50 dark:hover:bg-gray-700"
                                            >
                                              <td className="px-3 py-2 text-sm text-gray-500 whitespace-nowrap dark:text-gray-400">
                                                {question.id}
                                              </td>
                                              <td className="px-3 py-2 text-sm text-gray-900 whitespace-nowrap dark:text-white">
                                                <div className="max-w-xs truncate">
                                                  {question.question_text}
                                                </div>
                                              </td>
                                              <td className="px-3 py-2 text-sm text-gray-500 whitespace-nowrap dark:text-gray-400">
                                                {question.question_type}
                                              </td>
                                              <td className="px-3 py-2 text-sm text-gray-500 whitespace-nowrap dark:text-gray-400">
                                                {question.difficulty_level || "N/A"}
                                              </td>
                                              <td className="px-3 py-2 text-sm text-gray-500 whitespace-nowrap dark:text-gray-400">
                                                {question.marks}
                                              </td>
                                              <td className="px-3 py-2 text-sm text-gray-500 whitespace-nowrap dark:text-gray-400">
                                                {question.time_limit_seconds}
                                              </td>
                                              <td className="px-3 py-2 text-sm text-right whitespace-nowrap">
                                                <button
                                                  onClick={() => 
                                                    handleOpenQuestionModal(
                                                      job.id,
                                                      round.id,
                                                      question
                                                    )
                                                  }
                                                  className="p-1 text-blue-600 transition bg-blue-100 rounded-full hover:bg-blue-200 dark:bg-blue-900 dark:text-blue-400 dark:hover:bg-blue-800"
                                                  title="Edit Question"
                                                >
                                                  <svg
                                                    xmlns="http://www.w3.org/2000/svg"
                                                    className="w-3 h-3"
                                                    fill="none"
                                                    viewBox="0 0 24 24"
                                                    stroke="currentColor"
                                                  >
                                                    <path
                                                      strokeLinecap="round"
                                                      strokeLinejoin="round"
                                                      strokeWidth={2}
                                                      d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                                                    />
                                                  </svg>
                                                </button>
                                              </td>
                                            </tr>
                                          ))}
                                        </tbody>
                                      </table>
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Question Detail Modal */}
      <QuestionDetailModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        question={selectedQuestion}
        onSave={handleSaveQuestion}
      />
    </div>
  );
}