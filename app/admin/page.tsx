// app/admin/page.tsx
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface JobStats {
  totalJobs: number;
  activeJobs: number;
  totalApplications: number;
  recentJobs: Array<{
    id: number;
    job_title: string;
    department: string;
    location: string;
    total_applied: number;
    created_at: string;
  }>;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<JobStats>({
    totalJobs: 0,
    activeJobs: 0,
    totalApplications: 0,
    recentJobs: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // In a real application, you would fetch this data from your API
    const fetchStats = async () => {
      try {
        // Simulating API call with mock data
        setTimeout(() => {
          setStats({
            totalJobs: 5,
            activeJobs: 4,
            totalApplications: 108,
            recentJobs: [
              {
                id: 1,
                job_title: "Marketing Lead",
                department: "Marketing",
                location: "New York",
                total_applied: 15,
                created_at: "2025-05-08T01:08:43.000Z",
              },
              {
                id: 2,
                job_title: "Software Engineer",
                department: "Engineering",
                location: "San Francisco",
                total_applied: 40,
                created_at: "2025-05-08T01:08:43.000Z",
              },
              {
                id: 3,
                job_title: "HR Manager",
                department: "Human Resources",
                location: "Remote",
                total_applied: 10,
                created_at: "2025-05-08T01:08:43.000Z",
              },
              {
                id: 4,
                job_title: "Data Analyst",
                department: "Data Science",
                location: "Chicago",
                total_applied: 25,
                created_at: "2025-05-08T01:08:43.000Z",
              },
            ],
          });
          setLoading(false);
        }, 1000);
      } catch (error) {
        console.error("Error fetching job stats:", error);
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="w-full px-4 mx-auto max-w-7xl">
      <div className="grid grid-cols-1 gap-5 mt-2 sm:grid-cols-2 lg:grid-cols-3">
        {/* Total Jobs Card */}
        <div className="p-6 bg-white rounded-lg shadow-sm dark:bg-gray-800">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-blue-100 dark:bg-blue-900">
              <svg
                className="w-8 h-8 text-blue-600 dark:text-blue-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                ></path>
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Total Jobs
              </p>
              <p className="text-2xl font-semibold text-gray-700 dark:text-gray-200">
                {stats.totalJobs}
              </p>
            </div>
          </div>
        </div>

        {/* Active Jobs Card */}
        <div className="p-6 bg-white rounded-lg shadow-sm dark:bg-gray-800">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-green-100 dark:bg-green-900">
              <svg
                className="w-8 h-8 text-green-600 dark:text-green-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                ></path>
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Active Jobs
              </p>
              <p className="text-2xl font-semibold text-gray-700 dark:text-gray-200">
                {stats.activeJobs}
              </p>
            </div>
          </div>
        </div>

        {/* Total Applications Card */}
        <div className="p-6 bg-white rounded-lg shadow-sm dark:bg-gray-800">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-purple-100 dark:bg-purple-900">
              <svg
                className="w-8 h-8 text-purple-600 dark:text-purple-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                ></path>
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Total Applications
              </p>
              <p className="text-2xl font-semibold text-gray-700 dark:text-gray-200">
                {stats.totalApplications}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Jobs Table */}
      <div className="mt-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-200">
            Recent Job Listings
          </h2>
          <Link
            href="/admin/jobs/create"
            className="px-4 py-2 font-medium text-white transition bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Create New Job
          </Link>
        </div>
        <div className="overflow-hidden bg-white rounded-lg shadow dark:bg-gray-800">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th
                  scope="col"
                  className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase dark:text-gray-300"
                >
                  Title
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase dark:text-gray-300"
                >
                  Department
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase dark:text-gray-300"
                >
                  Location
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase dark:text-gray-300"
                >
                  Applications
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase dark:text-gray-300"
                >
                  Date Posted
                </th>
                <th scope="col" className="relative px-6 py-3">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200 dark:bg-gray-800 dark:divide-gray-700">
              {stats.recentJobs.map((job) => (
                <tr key={job.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      {job.job_title}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500 dark:text-gray-300">
                      {job.department}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500 dark:text-gray-300">
                      {job.location}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500 dark:text-gray-300">
                      {job.total_applied}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500 dark:text-gray-300">
                      {new Date(job.created_at).toLocaleDateString()}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm font-medium text-right whitespace-nowrap">
                    <Link
                      href={`/admin/jobs/${job.id}`}
                      className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                    >
                      View Details
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}