// app/dashboard/page.tsx
"use client";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';

interface InterviewRound {
  round_number: number;
  round_type: string;
  title: string;
  description: string;
  duration_minutes: number;
  email: string;
  job_id: number;
  interview_stage_id: number | null;
  feedback: string | null;
  score: number | null;
  interview_status: 'not_given' | 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  created_at: string | null;
  // Job details included in the API response
  job_title: string;
  location: string;
  job_type: string;
  department: string;
}

interface JobWithRounds {
  job_id: number;
  job_title: string;
  department: string;
  location: string;
  job_type: string;
  status: string;
  rounds: InterviewRound[];
}

export default function Dashboard() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [loading, setLoading] = useState(true);
  const [appliedJobs, setAppliedJobs] = useState<JobWithRounds[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [selectedJob, setSelectedJob] = useState<JobWithRounds | null>(null);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [selectedRound, setSelectedRound] = useState<InterviewRound | null>(null);

  useEffect(() => {
    // Check if user is authenticated
    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }

    if (status === 'authenticated' && session?.user?.email) {
      fetchInterviewStatus(session.user.email);
    } else if (status === 'authenticated') {
      // Fallback to localStorage if session doesn't have email
      const userEmail = localStorage.getItem('userEmail');
      if (userEmail) {
        fetchInterviewStatus(userEmail);
      } else {
        setError('No email found. Please apply for a job first.');
        setLoading(false);
      }
    }
  }, [status, session, router]);

  const fetchInterviewStatus = async (email: string) => {
    try {
      setLoading(true);
      
      // Fetch interview status data directly
      const interviewResponse = await fetch(`${process.env.NEXT_PUBLIC_HOST}/api/interview/status`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });
      
      if (!interviewResponse.ok) {
        throw new Error('Failed to fetch interview details');
      }
      
      const interviewData = await interviewResponse.json();
      
      if (!interviewData.result || interviewData.result.length === 0) {
        setAppliedJobs([]);
        setLoading(false);
        return;
      }
      
      // Group the interview rounds by job_id
      const jobsMap = new Map<number, InterviewRound[]>();
      
      interviewData.result.forEach((round: InterviewRound) => {
        if (!jobsMap.has(round.job_id)) {
          jobsMap.set(round.job_id, []);
        }
        jobsMap.get(round.job_id)?.push(round);
      });
      
      // Convert the map to an array of JobWithRounds objects
      const processedJobs: JobWithRounds[] = [];
      
      jobsMap.forEach((rounds, job_id) => {
        // Sort rounds by round number
        rounds.sort((a, b) => a.round_number - b.round_number);
        
        // Get sample round to extract job details (they should all have the same job details)
        const sampleRound = rounds[0];
        
        // Calculate overall status based on round statuses
        let status = 'Applied';
        const completedRounds = rounds.filter(round => round.interview_status === 'completed');
        
        if (completedRounds.length > 0) {
          const latestRound = completedRounds.reduce((latest, round) => 
            latest.round_number > round.round_number ? latest : round
          );
          
          if (latestRound.score !== null) {
            // Assuming score below 5 is a failure (adjust as needed)
            status = latestRound.score >= 5 ? 'In Progress' : 'Rejected';
            
            // If all rounds are completed and the latest is passed, consider it selected
            if (completedRounds.length === rounds.length && latestRound.score >= 5) {
              status = 'Selected';
            }
          }
        }
        
        processedJobs.push({
          job_id,
          job_title: sampleRound.job_title,
          department: sampleRound.department,
          location: sampleRound.location,
          job_type: sampleRound.job_type,
          status,
          rounds
        });
      });
      
      setAppliedJobs(processedJobs);
    } catch (error) {
      console.error('Error fetching interview status data:', error);
      setError('Failed to load your application data. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'applied':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'in progress':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'selected':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'rejected':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
    }
  };
  
  const getRoundStatusColor = (status: string, score: number | null) => {
    if (status === 'not_given') {
      return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
    } else if (status === 'scheduled') {
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
    } else if (status === 'in_progress') {
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
    } else if (status === 'completed') {
      return score !== null && score >= 5 
        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
        : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
    } else {
      return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
    }
  };

  const getRoundStatusText = (status: string, score: number | null) => {
    if (status === 'not_given') {
      return 'Pending';
    } else if (status === 'scheduled') {
      return 'Scheduled';
    } else if (status === 'in_progress') {
      return 'In Progress';
    } else if (status === 'completed') {
      return score !== null && score >= 5 ? 'Cleared' : 'Failed';
    } else if (status === 'cancelled') {
      return 'Cancelled';
    } else {
      return 'Unknown';
    }
  };

  const viewJobDetails = (job: JobWithRounds) => {
    setSelectedJob(job);
  };

  const viewFeedback = (round: InterviewRound) => {
    setSelectedRound(round);
    setShowFeedbackModal(true);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-100 p-6 rounded-lg">
          <h2 className="text-xl font-bold mb-2">Error</h2>
          <p>{error}</p>
          <div className="mt-4">
            <Link 
              href="/openings"
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Browse Job Openings
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (appliedJobs.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md text-center">
          <h2 className="text-xl font-bold mb-2 text-gray-900 dark:text-white">No Applications Found</h2>
          <p className="text-gray-700 dark:text-gray-300 mb-4">You haven't applied for any jobs yet.</p>
          <Link 
            href="/openings"
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Browse Job Openings
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-10">
      <div className="w-4/5 mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">My Applications</h1>
          <Link 
            href="/openings"
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Browse More Jobs
          </Link>
        </div>
        
        {selectedJob ? (
          <div>
            <button
              onClick={() => setSelectedJob(null)}
              className="flex items-center text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 mb-4"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
              </svg>
              Back to All Applications
            </button>
            
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden border border-gray-200 dark:border-gray-700">
              <div className="p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-1">
                      {selectedJob.job_title}
                    </h2>
                    <p className="text-blue-600 dark:text-blue-400 font-medium">
                      {selectedJob.department}
                    </p>
                    <div className="mt-2 flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                      <div className="flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        {selectedJob.location}
                      </div>
                      <div className="flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                        {selectedJob.job_type}
                      </div>
                    </div>
                  </div>
                  <div>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(selectedJob.status)}`}>
                      {selectedJob.status}
                    </span>
                  </div>
                </div>
                
                <div className="mt-8">
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Interview Process</h3>
                  
                  {selectedJob.rounds.length === 0 ? (
                    <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-md">
                      <p className="text-gray-700 dark:text-gray-300">No interview rounds scheduled yet. Please wait for the recruiter to schedule your interviews.</p>
                    </div>
                  ) : (
                    <div className="relative">
                      {/* Interview Timeline */}
                      <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200 dark:bg-gray-700"></div>
                      
                      <div className="space-y-8 relative">
                        {selectedJob.rounds.map((round, index) => (
                          <div key={index} className="ml-12 relative">
                            {/* Timeline dot */}
                            <div className={`absolute -left-12 w-8 h-8 flex items-center justify-center rounded-full 
                              ${getRoundStatusColor(round.interview_status, round.score)} border-2 border-white dark:border-gray-800 z-10`}>
                              {round.round_number}
                            </div>
                            
                            {/* Round card */}
                            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-sm p-4">
                              <div className="flex justify-between items-start">
                                <div>
                                  <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                                    {round.title}
                                  </h4>
                                  <p className="text-gray-700 dark:text-gray-300 mt-2">
                                    {round.description}
                                  </p>
                                </div>
                                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getRoundStatusColor(round.interview_status, round.score)}`}>
                                  {getRoundStatusText(round.interview_status, round.score)}
                                </span>
                              </div>
                              
                              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                <div className="flex items-center">
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500 dark:text-gray-400 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                  </svg>
                                  {round.round_type === "Interview" && round.interview_status !== 'completed' ? (
                                    <Link 
                                      href={`/interview?job_id=${round.job_id}&round_id=${round.round_number}`}
                                      className="inline-flex items-center px-3 py-1 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                                    >
                                      Start Interview
                                    </Link>
                                  ) : (
                                    <span className="text-gray-700 dark:text-gray-300">
                                      {round.created_at ? formatDate(round.created_at) : 'Not scheduled yet'}
                                    </span>
                                  )}
                                </div>
                                
                                <div className="flex items-center">
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500 dark:text-gray-400 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                  </svg>
                                  <span className="text-gray-700 dark:text-gray-300">
                                    Duration: {round.duration_minutes} minutes
                                  </span>
                                </div>
                              </div>
                              
                              {round.interview_status === 'completed' && (
                                <div className="mt-4">
                                  {round.score !== null && (
                                    <div className="flex items-center mb-2">
                                      <span className="text-gray-700 dark:text-gray-300 mr-2">Score:</span>
                                      <div className="w-full max-w-xs bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                                        <div 
                                          className={`h-2.5 rounded-full ${round.score >= 5 ? 'bg-green-600' : 'bg-red-600'}`}
                                          style={{ width: `${(round.score / 10) * 100}%` }}
                                        ></div>
                                      </div>
                                      <span className="ml-2 text-gray-700 dark:text-gray-300">{round.score}/10</span>
                                    </div>
                                  )}
                                  
                                  {round.feedback && (
                                    <button
                                      onClick={() => viewFeedback(round)}
                                      className="mt-2 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 text-sm inline-flex items-center"
                                    >
                                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                                      </svg>
                                      View Feedback
                                    </button>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {appliedJobs.map((job, index) => (
              <div 
                key={index}
                className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow duration-200"
              >
                <div className="p-6">
                  <div className="flex justify-between items-start">
                    <div>
                      <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-1">
                        {job.job_title}
                      </h2>
                      <p className="text-blue-600 dark:text-blue-400 font-medium">
                        {job.department}
                      </p>
                    </div>
                    <div>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(job.status)}`}>
                        {job.status}
                      </span>
                    </div>
                  </div>
                  
                  <div className="mt-3">
                    <div className="flex flex-wrap gap-y-2 text-sm text-gray-500 dark:text-gray-400">
                      <div className="flex items-center mr-4">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <span>{job.location}</span>
                      </div>
                      
                      <div className="flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                        <span>{job.job_type}</span>
                      </div>
                    </div>
                    
                    {job.rounds && job.rounds.length > 0 && (
                      <div className="mt-4">
                        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Interview Progress:</h3>
                        <div className="flex items-center">
                          <div className="flex-grow h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                            {job.rounds.map((round, idx) => {
                              const width = 100 / job.rounds.length;
                              let bgColor = 'bg-gray-400 dark:bg-gray-600'; // default for not started
                              
                              if (round.interview_status === 'scheduled') {
                                bgColor = 'bg-blue-400 dark:bg-blue-600';
                              } else if (round.interview_status === 'in_progress') {
                                bgColor = 'bg-yellow-400 dark:bg-yellow-600';
                              } else if (round.interview_status === 'completed') {
                                bgColor = round.score && round.score >= 5 
                                  ? 'bg-green-400 dark:bg-green-600' 
                                  : 'bg-red-400 dark:bg-red-600';
                              }
                              
                              return (
                                <div
                                  key={idx}
                                  className={`h-full ${bgColor}`}
                                  style={{ width: `${width}%` }}
                                ></div>
                              );
                            })}
                          </div>
                          <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">
                            {job.rounds.filter(r => r.interview_status === 'completed').length}/{job.rounds.length}
                          </span>
                        </div>
                        
                        <div className="mt-2 flex flex-wrap gap-2">
                          {job.rounds.map((round, idx) => (
                            <div 
                              key={idx}
                              className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs ${getRoundStatusColor(round.interview_status, round.score)}`}
                              title={round.title}
                            >
                              <span>{round.round_number}</span>
                              <span>-</span>
                              <span>{getRoundStatusText(round.interview_status, round.score)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div className="mt-6">
                    <button
                      onClick={() => viewJobDetails(job)}
                      className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      View Details
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Feedback Modal */}
      {showFeedbackModal && selectedRound && (
        <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true"></div>

            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

            <div className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white dark:bg-gray-800 px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                    <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white" id="modal-title">
                      Feedback for {selectedRound.title}
                    </h3>
                    <div className="mt-4">
                      {selectedRound.score !== null && (
                        <div className="mb-4">
                          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Score</h4>
                          <div className="flex items-center">
                            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                              <div 
                                className={`h-2.5 rounded-full ${selectedRound.score >= 5 ? 'bg-green-600' : 'bg-red-600'}`}
                                style={{ width: `${(selectedRound.score / 10) * 100}%` }}
                              ></div>
                            </div>
                            <span className="ml-2 text-gray-700 dark:text-gray-300">{selectedRound.score}/10</span>
                          </div>
                        </div>
                      )}
                      
                      <div>
                        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Feedback</h4>
                        <p className="text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-700 p-3 rounded-md">
                          {selectedRound.feedback || 'No detailed feedback provided.'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 dark:bg-gray-700 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  onClick={() => setShowFeedbackModal(false)}
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 dark:border-gray-600 shadow-sm px-4 py-2 bg-white dark:bg-gray-800 text-base font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}