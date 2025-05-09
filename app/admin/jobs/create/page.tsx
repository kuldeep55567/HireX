// app/admin/jobs/create/page.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export const dynamic = 'force-dynamic';

interface FormData {
  job_title: string;
  department: string;
  experience_min: number;
  experience_max: number;
  notice_period_days: number;
  available_positions: number;
  is_open: number;
  location: string;
  job_type: string;
  description: string;
}

export default function CreateJobPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);
  const [createdJobId, setCreatedJobId] = useState<number | null>(null);
  const [formData, setFormData] = useState<FormData>({
    job_title: "",
    department: "",
    experience_min: 0,
    experience_max: 0,
    notice_period_days: 30,
    available_positions: 1,
    is_open: 1,
    location: "",
    job_type: "Full-time",
    description: "",
  });

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value, type } = e.target;
    
    // Handle checkbox type separately
    if (type === "checkbox") {
      const checkbox = e.target as HTMLInputElement;
      setFormData({
        ...formData,
        [name]: checkbox.checked ? 1 : 0,
      });
    } else if (
      type === "number" ||
      name === "experience_min" ||
      name === "experience_max" ||
      name === "notice_period_days" ||
      name === "available_positions"
    ) {
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_HOST}/api/openings`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create job");
      }

      setSuccess(true);
      setCreatedJobId(data.job_id);
      // Reset form or redirect
      // router.push("/admin/jobs");
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const goToAddRounds = () => {
    router.push(`/admin/rounds/create?job_id=${createdJobId}`);
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Create New Job
        </h1>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
          Fill in the details below to create a new job posting.
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
            Job Created Successfully!
          </h2>
          <p className="mt-2 text-center text-gray-600 dark:text-gray-400">
            The job posting has been created. Would you like to set up interview rounds for this job?
          </p>
          <div className="flex justify-center mt-6 space-x-4">
            <button
              onClick={goToAddRounds}
              className="px-4 py-2 font-medium text-white transition bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Add Interview Rounds
            </button>
            <button
              onClick={() => router.push("/admin/jobs")}
              className="px-4 py-2 font-medium text-gray-700 transition bg-gray-200 rounded-md dark:text-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
            >
              View All Jobs
            </button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="p-6 bg-white rounded-lg shadow dark:bg-gray-800">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {/* Job Title */}
            <div>
              <label
                htmlFor="job_title"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Job Title *
              </label>
              <input
                type="text"
                id="job_title"
                name="job_title"
                value={formData.job_title}
                onChange={handleChange}
                required
                className="block w-full px-3 py-2 mt-1 text-gray-700 border border-gray-300 rounded-md shadow-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Department */}
            <div>
              <label
                htmlFor="department"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Department *
              </label>
              <input
                type="text"
                id="department"
                name="department"
                value={formData.department}
                onChange={handleChange}
                required
                className="block w-full px-3 py-2 mt-1 text-gray-700 border border-gray-300 rounded-md shadow-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Experience Min */}
            <div>
              <label
                htmlFor="experience_min"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Minimum Experience (years) *
              </label>
              <input
                type="number"
                id="experience_min"
                name="experience_min"
                value={formData.experience_min}
                onChange={handleChange}
                min="0"
                required
                className="block w-full px-3 py-2 mt-1 text-gray-700 border border-gray-300 rounded-md shadow-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Experience Max */}
            <div>
              <label
                htmlFor="experience_max"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Maximum Experience (years) *
              </label>
              <input
                type="number"
                id="experience_max"
                name="experience_max"
                value={formData.experience_max}
                onChange={handleChange}
                min="0"
                required
                className="block w-full px-3 py-2 mt-1 text-gray-700 border border-gray-300 rounded-md shadow-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Notice Period */}
            <div>
              <label
                htmlFor="notice_period_days"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Notice Period (days) *
              </label>
              <input
                type="number"
                id="notice_period_days"
                name="notice_period_days"
                value={formData.notice_period_days}
                onChange={handleChange}
                min="0"
                required
                className="block w-full px-3 py-2 mt-1 text-gray-700 border border-gray-300 rounded-md shadow-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Available Positions */}
            <div>
              <label
                htmlFor="available_positions"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Available Positions *
              </label>
              <input
                type="number"
                id="available_positions"
                name="available_positions"
                value={formData.available_positions}
                onChange={handleChange}
                min="1"
                required
                className="block w-full px-3 py-2 mt-1 text-gray-700 border border-gray-300 rounded-md shadow-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Location */}
            <div>
              <label
                htmlFor="location"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Location *
              </label>
              <input
                type="text"
                id="location"
                name="location"
                value={formData.location}
                onChange={handleChange}
                required
                className="block w-full px-3 py-2 mt-1 text-gray-700 border border-gray-300 rounded-md shadow-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Job Type */}
            <div>
              <label
                htmlFor="job_type"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Job Type *
              </label>
              <select
                id="job_type"
                name="job_type"
                value={formData.job_type}
                onChange={handleChange}
                required
                className="block w-full px-3 py-2 mt-1 text-gray-700 border border-gray-300 rounded-md shadow-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="Full-time">Full-time</option>
                <option value="Part-time">Part-time</option>
                <option value="Contract">Contract</option>
                <option value="Internship">Internship</option>
                <option value="Freelance">Freelance</option>
              </select>
            </div>

            {/* Is Open */}
            <div className="flex items-center mt-6">
              <input
                type="checkbox"
                id="is_open"
                name="is_open"
                checked={formData.is_open === 1}
                onChange={(e) => setFormData({ ...formData, is_open: e.target.checked ? 1 : 0 })}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded dark:border-gray-600 focus:ring-blue-500"
              />
              <label
                htmlFor="is_open"
                className="block ml-2 text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Job is Open
              </label>
            </div>
          </div>

          {/* Description */}
          <div className="mt-6">
            <label
              htmlFor="description"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Job Description *
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              required
              rows={4}
              className="block w-full px-3 py-2 mt-1 text-gray-700 border border-gray-300 rounded-md shadow-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            ></textarea>
          </div>

          <div className="flex justify-end mt-6 space-x-3">
            <button
              type="button"
              onClick={() => router.back()}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md dark:text-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
            >
              Cancel
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
                  Creating...
                </>
              ) : (
                "Create Job"
              )}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}