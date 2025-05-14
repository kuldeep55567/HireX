// app/openings/page.tsx
"use client";
import { useState, useEffect } from 'react';
import { JobOpening, JobApplication } from '../types/interface';

export default function JobOpenings() {
  const [jobOpenings, setJobOpenings] = useState<JobOpening[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [appliedJobs, setAppliedJobs] = useState<number[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedJob, setSelectedJob] = useState<JobOpening | null>(null);
  const [applicationForm, setApplicationForm] = useState<JobApplication>({
    email: '',
    designation: '',
    job_id: 0,
    position: '',
    experience: '',
    highest_education: '',
    previously_employed: false,
    status: 'pending',
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);

  useEffect(() => {
    const fetchJobOpenings = async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_HOST}/api/openings`);
        if (!response.ok) {
          throw new Error('Failed to fetch job openings');
        }
        const data = await response.json();
        setJobOpenings(data);
        
        // Fetch user's applied jobs based on saved email in localStorage
        const userEmail = localStorage.getItem('userEmail');
        if (userEmail) {
          fetchAppliedJobs(userEmail);
        }
      } catch (err) {
        setError('Error fetching job openings. Please try again later.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchJobOpenings();
  }, []);

  const fetchAppliedJobs = async (email: string) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_HOST}/api/appliedJobs?email=${email}`);
      if (response.ok) {
        const data = await response.json();
        setAppliedJobs(data.map((job: any) => job.job_id));
      }
    } catch (err) {
      console.error('Error fetching applied jobs:', err);
    }
  };

  const handleApply = (job: JobOpening) => {
    setSelectedJob(job);
    setApplicationForm({
      ...applicationForm,
      job_id: job.id,
      position: job.job_title,
    });
    setShowModal(true);
  };

  const handleViewDetails = (job: JobOpening) => {
    setSelectedJob(job);
    setShowDetailsModal(true);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target as HTMLInputElement;
    
    setApplicationForm({
      ...applicationForm,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setSubmitError(null);
    setSubmitSuccess(null);

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_HOST}/api/applyJob`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(applicationForm),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit application');
      }

      // Store email in localStorage for future reference
      localStorage.setItem('userEmail', applicationForm.email);
      
      // Update applied jobs list
      setAppliedJobs([...appliedJobs, applicationForm.job_id]);
      
      setSubmitSuccess('Your application has been submitted successfully!');
      
      // Close the modal after a delay
      setTimeout(() => {
        setShowModal(false);
        setSubmitSuccess(null);
      }, 2000);
    } catch (err: any) {
      setSubmitError(err.message);
    } finally {
      setSubmitting(false);
    }
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
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-10">
      <div className="w-4/5 mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Current Openings</h1>
        </div>
        
        <div className="grid grid-cols-1 gap-6">
          {jobOpenings.map((job) => {
            const hasApplied = appliedJobs.includes(job.id);
            
            return (
              <div 
                key={job.id}
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
                    <div className="flex items-center space-x-2">
                      {hasApplied && (
                        <span className="px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
                          Applied
                        </span>
                      )}
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                        job.is_open ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : 
                        'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                      }`}>
                        {job.is_open ? 'Open' : 'Closed'}
                      </span>
                    </div>
                  </div>
                  
                  <div className="mt-4 space-y-3">
                    <p className="text-gray-700 dark:text-gray-300">
                      {job.description.length > 200 
                        ? `${job.description.substring(0, 200)}...` 
                        : job.description}
                    </p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div className="flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500 dark:text-gray-400 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <span className="text-gray-700 dark:text-gray-300">{job.location}</span>
                      </div>
                      
                      <div className="flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500 dark:text-gray-400 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                        <span className="text-gray-700 dark:text-gray-300">{job.job_type}</span>
                      </div>
                      
                      <div className="flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500 dark:text-gray-400 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="text-gray-700 dark:text-gray-300">
                          {job.experience_min}-{job.experience_max} years
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-6 flex flex-col sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                      <span>{job.available_positions} position{job.available_positions !== 1 ? 's' : ''} available</span>
                      <span>•</span>
                      <span>{job.total_applied} applied</span>
                      <span>•</span>
                      <span>{job.notice_period_days} days notice period</span>
                    </div>
                    
                    <div className="flex mt-4 sm:mt-0 space-x-3">
                      <button
                        onClick={() => handleViewDetails(job)}
                        className="inline-flex items-center px-4 py-2 rounded-md text-sm font-medium 
                          bg-gray-100 text-gray-800 hover:bg-gray-200
                          dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600 
                          focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500
                          transition duration-150 ease-in-out"
                      >
                        View Details
                      </button>
                      
                      <button
                        onClick={() => handleApply(job)}
                        disabled={!job.is_open || hasApplied}
                        className={`inline-flex items-center px-4 py-2 rounded-md text-sm font-medium ${
                          !job.is_open 
                            ? 'bg-gray-300 text-gray-500 cursor-not-allowed dark:bg-gray-700 dark:text-gray-400' 
                            : hasApplied
                              ? 'bg-green-200 text-green-800 cursor-not-allowed dark:bg-green-900 dark:text-green-200'
                              : 'bg-blue-600 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
                        } transition duration-150 ease-in-out`}
                      >
                        {hasApplied 
                          ? 'Already Applied' 
                          : job.is_open 
                            ? 'Apply Now' 
                            : 'Position Closed'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Application Modal */}
      {showModal && selectedJob && (
        <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true"></div>

            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

            <div className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                    <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white" id="modal-title">
                      Apply for {selectedJob.job_title}
                    </h3>
                    <div className="mt-4">
                      {submitSuccess ? (
                        <div className="bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 p-3 rounded-md">
                          {submitSuccess}
                        </div>
                      ) : (
                        <form onSubmit={handleSubmit} className="space-y-4">
                          {submitError && (
                            <div className="bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 p-3 rounded-md">
                              {submitError}
                            </div>
                          )}
                          
                          <div>
                            <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                              Email Address *
                            </label>
                            <input
                              type="email"
                              name="email"
                              id="email"
                              required
                              value={applicationForm.email}
                              onChange={handleInputChange}
                              className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 
                                        focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                              placeholder="your@email.com"
                            />
                          </div>
                          
                          <div>
                            <label htmlFor="designation" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                              Current Designation
                            </label>
                            <input
                              type="text"
                              name="designation"
                              id="designation"
                              value={applicationForm.designation}
                              onChange={handleInputChange}
                              className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 
                                        focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                              placeholder="e.g. Software Engineer"
                            />
                          </div>
                          
                          <div>
                            <label htmlFor="experience" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                              Years of Experience *
                            </label>
                            <input
                              type="text"
                              name="experience"
                              id="experience"
                              required
                              value={applicationForm.experience}
                              onChange={handleInputChange}
                              className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 
                                        focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                              placeholder="e.g. 3 years"
                            />
                          </div>
                          
                          <div>
                            <label htmlFor="highest_education" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                              Highest Education *
                            </label>
                            <select
                              name="highest_education"
                              id="highest_education"
                              required
                              value={applicationForm.highest_education}
                              onChange={handleInputChange}
                              className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 
                                        focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                            >
                              <option value="">Select Education Level</option>
                              <option value="high_school">High School</option>
                              <option value="bachelors">Bachelor's Degree</option>
                              <option value="masters">Master's Degree</option>
                              <option value="phd">PhD</option>
                              <option value="other">Other</option>
                            </select>
                          </div>
                          
                          <div className="flex items-center">
                            <input
                              id="previously_employed"
                              name="previously_employed"
                              type="checkbox"
                              checked={applicationForm.previously_employed}
                              onChange={handleInputChange}
                              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                            />
                            <label htmlFor="previously_employed" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                              I was previously employed at this company
                            </label>
                          </div>
                        </form>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 dark:bg-gray-700 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                {!submitSuccess && (
                  <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={submitting}
                    className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm"
                  >
                    {submitting ? (
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    ) : 'Submit Application'}
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setSubmitError(null);
                    setSubmitSuccess(null);
                  }}
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 dark:border-gray-600 shadow-sm px-4 py-2 bg-white dark:bg-gray-800 text-base font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  {submitSuccess ? 'Close' : 'Cancel'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Job Details Modal */}
      {showDetailsModal && selectedJob && (
        <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true"></div>

            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

            <div className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full">
              <div className="px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                    <div className="flex justify-between items-center">
                      <h3 className="text-xl leading-6 font-bold text-gray-900 dark:text-white" id="modal-title">
                        {selectedJob.job_title}
                      </h3>
                      <div className="flex items-center">
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                          selectedJob.is_open ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : 
                          'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                        }`}>
                          {selectedJob.is_open ? 'Open' : 'Closed'}
                        </span>
                      </div>
                    </div>
                    
                    <p className="text-blue-600 dark:text-blue-400 font-medium mt-1">
                      {selectedJob.department}
                    </p>
                    
                    <div className="mt-6 space-y-4">
                      <div>
                        <h4 className="text-lg font-semibold text-gray-900 dark:text-white">Description</h4>
                        <p className="mt-2 text-gray-700 dark:text-gray-300">
                          {selectedJob.description}
                        </p>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <h4 className="text-lg font-semibold text-gray-900 dark:text-white">Details</h4>
                          <ul className="mt-2 space-y-2">
                            <li className="flex items-center text-gray-700 dark:text-gray-300">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500 dark:text-gray-400 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                              </svg>
                              <span>Location: {selectedJob.location}</span>
                            </li>
                            <li className="flex items-center text-gray-700 dark:text-gray-300">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500 dark:text-gray-400 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                              </svg>
                              <span>Job Type: {selectedJob.job_type}</span>
                            </li>
                            <li className="flex items-center text-gray-700 dark:text-gray-300">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500 dark:text-gray-400 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              <span>Experience: {selectedJob.experience_min}-{selectedJob.experience_max} years</span>
                            </li>
                            <li className="flex items-center text-gray-700 dark:text-gray-300">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500 dark:text-gray-400 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2z" />
                              </svg>
                              <span>Notice Period: {selectedJob.notice_period_days} days</span>
                            </li>
                          </ul>
                        </div>
                        
                        <div>
                          <h4 className="text-lg font-semibold text-gray-900 dark:text-white">Openings</h4>
                          <ul className="mt-2 space-y-2">
                            <li className="flex items-center text-gray-700 dark:text-gray-300">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500 dark:text-gray-400 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                              </svg>
                              <span>Positions: {selectedJob.available_positions}</span>
                            </li>
                            <li className="flex items-center text-gray-700 dark:text-gray-300">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500 dark:text-gray-400 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                              </svg>
                              <span>Total Applicants: {selectedJob.total_applied}</span>
                            </li>
                          </ul>
                        </div>
                      </div>
                      
                      {/* You might want to add more job details here */}
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 dark:bg-gray-700 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                {selectedJob.is_open && !appliedJobs.includes(selectedJob.id) && (
                  <button
                    type="button"
                    onClick={() => {
                      setShowDetailsModal(false);
                      handleApply(selectedJob);
                    }}
                    className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm"
                  >
                    Apply Now
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setShowDetailsModal(false)}
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