'use client';

import { useState } from 'react';
import { apiClient } from '@/lib/api';

export default function AdminIngestionPage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const triggerIngestion = async () => {
    if (!confirm('This will fetch new content from all active sources. Continue?')) {
      return;
    }

    setLoading(true);
    setResult(null);
    setError(null);

    try {
      const response = await apiClient.post('/ingest/run');
      setResult(response.data);
    } catch (err: any) {
      console.error('Error triggering ingestion:', err);
      setError(err.response?.data?.error || 'Failed to trigger ingestion');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Content Ingestion</h1>

      {/* Manual Trigger Card */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Manual Ingestion Trigger
            </h2>
            <p className="text-gray-600 mb-4">
              Manually fetch new content from all active sources. This process runs automatically every hour,
              but you can trigger it manually if needed.
            </p>
            <button
              onClick={triggerIngestion}
              disabled={loading}
              className="bg-primary-600 text-white px-6 py-3 rounded-md font-medium hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                      fill="none"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  Ingesting...
                </span>
              ) : (
                '🔄 Trigger Ingestion Now'
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Success Result */}
      {result && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-6">
          <h3 className="text-lg font-semibold text-green-900 mb-3">
            ✅ Ingestion Complete
          </h3>
          <div className="space-y-2 text-sm text-green-800">
            <p>
              <span className="font-medium">Status:</span> {result.message}
            </p>
            {result.details && (
              <div className="mt-4 p-4 bg-white rounded border border-green-200">
                <pre className="text-xs overflow-auto">
                  {JSON.stringify(result.details, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-6">
          <h3 className="text-lg font-semibold text-red-900 mb-2">
            ❌ Ingestion Failed
          </h3>
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {/* Information */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          How Ingestion Works
        </h3>
        <div className="space-y-3 text-sm text-gray-700">
          <div className="flex items-start gap-3">
            <span className="text-2xl">🔄</span>
            <div>
              <p className="font-medium">Automatic Schedule</p>
              <p className="text-gray-600">
                Content is automatically fetched every hour from all active sources via internal cron job.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <span className="text-2xl">🛡️</span>
            <div>
              <p className="font-medium">Duplicate Prevention</p>
              <p className="text-gray-600">
                The system automatically prevents duplicate content using canonical URLs.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <span className="text-2xl">🏷️</span>
            <div>
              <p className="font-medium">Auto-Tagging</p>
              <p className="text-gray-600">
                New content is automatically tagged with relevant players, teams, positions, and topics.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <span className="text-2xl">📊</span>
            <div>
              <p className="font-medium">Error Handling</p>
              <p className="text-gray-600">
                Failed sources are tracked with error messages but don't stop the batch. Check the Sources page for errors.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <span className="text-2xl">🔍</span>
            <div>
              <p className="font-medium">Self-Healing</p>
              <p className="text-gray-600">
                Daily gap detection checks for missed runs (e.g., server downtime) and triggers catch-up ingestion.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
