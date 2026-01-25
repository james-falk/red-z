'use client';

import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api';

interface Source {
  id: string;
  name: string;
  type: 'RSS' | 'YOUTUBE' | 'PODCAST';
  feedUrl: string;
  websiteUrl?: string;
  logoUrl?: string;
  description?: string;
  isActive: boolean;
  lastIngestedAt?: string;
  lastError?: string;
}

export default function AdminSourcesPage() {
  const [sources, setSources] = useState<Source[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'active' | 'inactive'>('all');

  useEffect(() => {
    loadSources();
  }, []);

  const loadSources = async () => {
    try {
      const response = await apiClient.get('/sources');
      setSources(response.data);
    } catch (error) {
      console.error('Error loading sources:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleActive = async (id: string, currentState: boolean) => {
    try {
      await apiClient.patch(`/sources/${id}`, {
        isActive: !currentState
      });
      loadSources();
    } catch (error) {
      console.error('Error toggling source:', error);
      alert('Failed to update source');
    }
  };

  const filteredSources = sources.filter(source => {
    if (filter === 'active') return source.isActive;
    if (filter === 'inactive') return !source.isActive;
    return true;
  });

  const stats = {
    total: sources.length,
    active: sources.filter(s => s.isActive).length,
    inactive: sources.filter(s => !s.isActive).length,
    withErrors: sources.filter(s => s.lastError).length,
  };

  if (loading) {
    return <div className="text-gray-500">Loading...</div>;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Content Sources</h1>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <p className="text-sm font-medium text-gray-600">Total Sources</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{stats.total}</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <p className="text-sm font-medium text-gray-600">Active</p>
          <p className="text-2xl font-bold text-green-600 mt-1">{stats.active}</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <p className="text-sm font-medium text-gray-600">Inactive</p>
          <p className="text-2xl font-bold text-gray-400 mt-1">{stats.inactive}</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <p className="text-sm font-medium text-gray-600">With Errors</p>
          <p className="text-2xl font-bold text-red-600 mt-1">{stats.withErrors}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-md text-sm font-medium ${
            filter === 'all'
              ? 'bg-primary-600 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          All
        </button>
        <button
          onClick={() => setFilter('active')}
          className={`px-4 py-2 rounded-md text-sm font-medium ${
            filter === 'active'
              ? 'bg-primary-600 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          Active
        </button>
        <button
          onClick={() => setFilter('inactive')}
          className={`px-4 py-2 rounded-md text-sm font-medium ${
            filter === 'inactive'
              ? 'bg-primary-600 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          Inactive
        </button>
      </div>

      {/* Sources List */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        {filteredSources.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            No sources found
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {filteredSources.map((source) => (
              <div key={source.id} className="p-4">
                <div className="flex items-start gap-4">
                  {/* Logo */}
                  {source.logoUrl && (
                    <img
                      src={source.logoUrl}
                      alt={source.name}
                      className="w-12 h-12 rounded object-contain"
                    />
                  )}

                  {/* Info */}
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-gray-900">{source.name}</h3>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                        source.type === 'RSS' ? 'bg-blue-100 text-blue-700' :
                        source.type === 'YOUTUBE' ? 'bg-red-100 text-red-700' :
                        'bg-purple-100 text-purple-700'
                      }`}>
                        {source.type}
                      </span>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                        source.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                      }`}>
                        {source.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>

                    {source.description && (
                      <p className="text-sm text-gray-600 mt-1">{source.description}</p>
                    )}

                    <div className="mt-2 text-xs text-gray-500">
                      <a
                        href={source.feedUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary-600 hover:text-primary-700"
                      >
                        {source.feedUrl}
                      </a>
                    </div>

                    {source.lastIngestedAt && (
                      <p className="text-xs text-gray-500 mt-1">
                        Last ingested: {new Date(source.lastIngestedAt).toLocaleString()}
                      </p>
                    )}

                    {source.lastError && (
                      <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded">
                        <p className="text-xs text-red-700 font-medium">Error:</p>
                        <p className="text-xs text-red-600 mt-1">{source.lastError}</p>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col gap-2">
                    <button
                      onClick={() => toggleActive(source.id, source.isActive)}
                      className={`px-3 py-1 rounded text-sm font-medium ${
                        source.isActive
                          ? 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                          : 'bg-green-600 text-white hover:bg-green-700'
                      }`}
                    >
                      {source.isActive ? 'Disable' : 'Enable'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
