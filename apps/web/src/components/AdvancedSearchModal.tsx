'use client';

import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api';
import { ContentType, AdvancedSearchFilters } from '@fantasy-red-zone/shared';

interface Tag {
  id: string;
  name: string;
  slug: string;
  type: string;
}

interface Source {
  id: string;
  name: string;
  logoUrl?: string;
}

interface AdvancedSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSearch: (filters: AdvancedSearchFilters) => void;
}

export function AdvancedSearchModal({ isOpen, onClose, onSearch }: AdvancedSearchModalProps) {
  const [query, setQuery] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [tagMatchMode, setTagMatchMode] = useState<'any' | 'all'>('any');
  const [selectedSources, setSelectedSources] = useState<string[]>([]);
  const [selectedTypes, setSelectedTypes] = useState<ContentType[]>([]);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [sort, setSort] = useState<'recent' | 'popular' | 'relevance'>('recent');
  
  const [tags, setTags] = useState<Tag[]>([]);
  const [sources, setSources] = useState<Source[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadFiltersData();
    }
  }, [isOpen]);

  const loadFiltersData = async () => {
    setLoading(true);
    try {
      const [tagsResp, sourcesResp] = await Promise.all([
        apiClient.get('/tags'),
        apiClient.get('/sources'),
      ]);
      setTags(tagsResp.data);
      setSources(sourcesResp.data);
    } catch (error) {
      console.error('Error loading filter data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    const filters: AdvancedSearchFilters = {
      query: query || undefined,
      tags: selectedTags.length > 0 ? selectedTags : undefined,
      tagMatchMode,
      sources: selectedSources.length > 0 ? selectedSources : undefined,
      contentTypes: selectedTypes.length > 0 ? selectedTypes : undefined,
      dateFrom: dateFrom ? new Date(dateFrom).toISOString() : undefined,
      dateTo: dateTo ? new Date(dateTo).toISOString() : undefined,
      sort,
    };
    onSearch(filters);
    onClose();
  };

  const handleReset = () => {
    setQuery('');
    setSelectedTags([]);
    setTagMatchMode('any');
    setSelectedSources([]);
    setSelectedTypes([]);
    setDateFrom('');
    setDateTo('');
    setSort('recent');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 p-4 sm:p-6 flex items-center justify-between">
          <h2 className="text-lg sm:text-xl font-bold text-gray-900">Advanced Search</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-2 min-w-[44px] min-h-[44px] flex items-center justify-center"
          >
            <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
          {/* Text Search */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Search Keywords
            </label>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search in title and description..."
              className="w-full px-3 sm:px-4 py-2.5 sm:py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500 text-sm sm:text-base min-h-[44px]"
            />
          </div>

          {/* Content Types */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Content Types
            </label>
            <div className="flex flex-wrap gap-2">
              {Object.values(ContentType).map((type) => (
                <button
                  key={type}
                  onClick={() => {
                    if (selectedTypes.includes(type)) {
                      setSelectedTypes(selectedTypes.filter(t => t !== type));
                    } else {
                      setSelectedTypes([...selectedTypes, type]);
                    }
                  }}
                  className={`px-3 sm:px-4 py-2 rounded-md text-xs sm:text-sm font-medium transition-colors min-h-[44px] ${
                    selectedTypes.includes(type)
                      ? 'bg-primary-600 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          {/* Tags */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700">
                Tags
              </label>
              <select
                value={tagMatchMode}
                onChange={(e) => setTagMatchMode(e.target.value as 'any' | 'all')}
                className="text-xs sm:text-sm border border-gray-300 rounded px-2 py-1"
              >
                <option value="any">Match ANY tag</option>
                <option value="all">Match ALL tags</option>
              </select>
            </div>
            {loading ? (
              <p className="text-sm text-gray-500">Loading tags...</p>
            ) : (
              <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto p-2 border border-gray-200 rounded-md">
                {tags.map((tag) => (
                  <button
                    key={tag.id}
                    onClick={() => {
                      if (selectedTags.includes(tag.slug)) {
                        setSelectedTags(selectedTags.filter(s => s !== tag.slug));
                      } else {
                        setSelectedTags([...selectedTags, tag.slug]);
                      }
                    }}
                    className={`px-2 sm:px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                      selectedTags.includes(tag.slug)
                        ? 'bg-primary-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {tag.name}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Sources */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Sources
            </label>
            {loading ? (
              <p className="text-sm text-gray-500">Loading sources...</p>
            ) : (
              <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto p-2 border border-gray-200 rounded-md">
                {sources.map((source) => (
                  <button
                    key={source.id}
                    onClick={() => {
                      if (selectedSources.includes(source.id)) {
                        setSelectedSources(selectedSources.filter(s => s !== source.id));
                      } else {
                        setSelectedSources([...selectedSources, source.id]);
                      }
                    }}
                    className={`inline-flex items-center gap-2 px-2 sm:px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                      selectedSources.includes(source.id)
                        ? 'bg-primary-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {source.logoUrl && (
                      <img src={source.logoUrl} alt="" className="w-4 h-4 rounded-full" />
                    )}
                    {source.name}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Date Range */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                From Date
              </label>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500 text-sm sm:text-base min-h-[44px]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                To Date
              </label>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500 text-sm sm:text-base min-h-[44px]"
              />
            </div>
          </div>

          {/* Sort */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Sort By
            </label>
            <div className="flex flex-wrap gap-2">
              {(['recent', 'popular', 'relevance'] as const).map((sortOption) => (
                <button
                  key={sortOption}
                  onClick={() => setSort(sortOption)}
                  className={`px-3 sm:px-4 py-2 rounded-md text-xs sm:text-sm font-medium transition-colors min-h-[44px] ${
                    sort === sortOption
                      ? 'bg-primary-600 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  {sortOption.charAt(0).toUpperCase() + sortOption.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 p-4 sm:p-6 flex flex-col sm:flex-row gap-2 sm:gap-3">
          <button
            onClick={handleReset}
            className="flex-1 bg-gray-200 text-gray-700 px-4 py-2.5 sm:py-2 rounded-md text-sm sm:text-base font-medium hover:bg-gray-300 min-h-[44px]"
          >
            Reset
          </button>
          <button
            onClick={handleSearch}
            className="flex-1 bg-primary-600 text-white px-4 py-2.5 sm:py-2 rounded-md text-sm sm:text-base font-medium hover:bg-primary-700 min-h-[44px]"
          >
            Search
          </button>
        </div>
      </div>
    </div>
  );
}
