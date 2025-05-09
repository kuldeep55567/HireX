// app/openings/page.tsx
"use client";
import { useState, useEffect } from 'react';
import { JobOpening } from '../types/interface';

export default function JobOpenings() {
  const [jobOpenings, setJobOpenings] = useState<JobOpening[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchJobOpenings = async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_HOST}/api/openings`);
        if (!response.ok) {
          throw new Error('Failed to fetch job openings');
        }
        const data = await response.json();
        setJobOpenings(data);
      } catch (err) {
        setError('Error fetching job openings. Please try again later.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchJobOpenings();
  }, []);

  const handleApply = (jobId: number) => {
    console.log(`Applied for job with ID: ${jobId}`);
    // Future implementation for application process
    alert(`Thank you for your interest! The application system will be available soon.`);
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
          {jobOpenings.map((job) => (
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
                  <div className="flex items-center">
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
                    {job.description}
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
                  
                  <button
                    onClick={() => handleApply(job.id)}
                    disabled={!job.is_open}
                    className={`mt-4 sm:mt-0 inline-flex items-center px-4 py-2 rounded-md text-sm font-medium ${
                      job.is_open 
                        ? 'bg-blue-600 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500' 
                        : 'bg-gray-300 text-gray-500 cursor-not-allowed dark:bg-gray-700 dark:text-gray-400'
                    } transition duration-150 ease-in-out`}
                  >
                    {job.is_open ? 'Apply Now' : 'Position Closed'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}