// components/QuestionDetailModal.tsx
import { useState, useEffect } from "react";
import { Question } from "@/services/admin.service";

interface QuestionDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  question: Question | null;
  onSave: (updatedQuestion: Question) => Promise<void>;
}

export default function QuestionDetailModal({
  isOpen,
  onClose,
  question,
  onSave,
}: QuestionDetailModalProps) {
  const [editedQuestion, setEditedQuestion] = useState<Question | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [optionsText, setOptionsText] = useState("");
  const [keywordsText, setKeywordsText] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (question) {
      setEditedQuestion({ ...question });
      setOptionsText(question.options ? question.options.join("\n") : "");
      setKeywordsText(
        question.expected_keywords ? question.expected_keywords.join(", ") : ""
      );
    }
  }, [question]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    if (!editedQuestion) return;

    const { name, value, type } = e.target;

    if (type === "number") {
      setEditedQuestion({
        ...editedQuestion,
        [name]: parseInt(value, 10) || 0,
      });
    } else {
      setEditedQuestion({
        ...editedQuestion,
        [name]: value,
      });
    }
  };

  const handleOptionsChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setOptionsText(e.target.value);
    if (editedQuestion) {
      const options = e.target.value.split("\n").filter(line => line.trim() !== "");
      setEditedQuestion({
        ...editedQuestion,
        options,
      });
    }
  };

  const handleKeywordsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setKeywordsText(e.target.value);
    if (editedQuestion) {
      const keywords = e.target.value
        .split(",")
        .map(k => k.trim())
        .filter(k => k !== "");
      setEditedQuestion({
        ...editedQuestion,
        expected_keywords: keywords.length > 0 ? keywords : null,
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editedQuestion) return;

    setIsSaving(true);
    setError(null);

    try {
      await onSave(editedQuestion);
      onClose();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen || !editedQuestion) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-auto bg-black bg-opacity-50">
      <div className="relative w-full max-w-2xl p-6 mx-auto bg-white rounded-lg shadow-xl dark:bg-gray-800">
        <div className="flex items-start justify-between mb-4">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
            Question Details
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 bg-transparent hover:text-gray-500 dark:hover:text-gray-300"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M6 18L18 6M6 6l12 12"
              ></path>
            </svg>
          </button>
        </div>

        {error && (
          <div className="p-3 mb-4 text-sm text-red-700 bg-red-100 rounded-lg dark:bg-red-900 dark:text-red-200">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label
                htmlFor="question_text"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Question Text
              </label>
              <textarea
                id="question_text"
                name="question_text"
                value={editedQuestion.question_text}
                onChange={handleChange}
                rows={3}
                className="block w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                required
              ></textarea>
            </div>

            <div>
              <label
                htmlFor="question_type"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Question Type
              </label>
              <select
                id="question_type"
                name="question_type"
                value={editedQuestion.question_type}
                onChange={handleChange}
                className="block w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                required
              >
                <option value="MCQ">Multiple Choice</option>
                <option value="Open-ended">Open Ended</option>
                <option value="Short Answer">Short Answer</option>
              </select>
            </div>

            {editedQuestion.question_type === "MCQ" && (
              <>
                <div>
                  <label
                    htmlFor="options"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                  >
                    Options (one per line)
                  </label>
                  <textarea
                    id="options"
                    value={optionsText}
                    onChange={handleOptionsChange}
                    rows={4}
                    className="block w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    required={editedQuestion.question_type === "MCQ"}
                  ></textarea>
                </div>

                <div>
                  <label
                    htmlFor="correct_option_index"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                  >
                    Correct Option Index
                  </label>
                  <select
                    id="correct_option_index"
                    name="correct_option_index"
                    value={editedQuestion.correct_option_index}
                    onChange={handleChange}
                    className="block w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    required={editedQuestion.question_type === "MCQ"}
                  >
                    {(editedQuestion.options || []).map((_, index) => (
                      <option key={index} value={index}>
                        Option {index + 1}
                      </option>
                    ))}
                  </select>
                </div>
              </>
            )}

            {editedQuestion.question_type === "Short Answer" && (
              <div>
                <label
                  htmlFor="expected_keywords"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Expected Keywords (comma-separated)
                </label>
                <input
                  type="text"
                  id="expected_keywords"
                  value={keywordsText}
                  onChange={handleKeywordsChange}
                  className="block w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            )}

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div>
                <label
                  htmlFor="difficulty_level"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Difficulty Level
                </label>
                <select
                  id="difficulty_level"
                  name="difficulty_level"
                  value={editedQuestion.difficulty_level}
                  onChange={handleChange}
                  className="block w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Not Specified</option>
                  <option value="Easy">Easy</option>
                  <option value="Medium">Medium</option>
                  <option value="Hard">Hard</option>
                </select>
              </div>

              <div>
                <label
                  htmlFor="marks"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Marks/Points
                </label>
                <input
                  type="number"
                  id="marks"
                  name="marks"
                  value={editedQuestion.marks}
                  onChange={handleChange}
                  min="1"
                  max="10"
                  className="block w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label
                  htmlFor="time_limit_seconds"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Time Limit (seconds)
                </label>
                <input
                  type="number"
                  id="time_limit_seconds"
                  name="time_limit_seconds"
                  value={editedQuestion.time_limit_seconds}
                  onChange={handleChange}
                  min="5"
                  step="5"
                  className="block w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end mt-6 space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md dark:text-gray-300 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              {isSaving ? (
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
                "Save Changes"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}