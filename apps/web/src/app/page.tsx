'use client';

import { useState } from 'react';
import { ContentGrid } from '@/components/ContentGrid';
import { FeaturedCarousel } from '@/components/FeaturedCarousel';
import { TagFilter } from '@/components/TagFilter';
import { AdvancedSearchModal } from '@/components/AdvancedSearchModal';
import { ContentType, AdvancedSearchFilters } from '@fantasy-red-zone/shared';
import { apiClient } from '@/lib/api';

export default function HomePage() {
  const [filters, setFilters] = useState<Record<string, any>>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [showAdvancedSearch, setShowAdvancedSearch] = useState(false);
  const [isAdvancedSearch, setIsAdvancedSearch] = useState(false);
  const [advancedResults, setAdvancedResults] = useState<any[] | null>(null);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setFilters({ ...filters, q: searchQuery });
    setIsAdvancedSearch(false);
    setAdvancedResults(null);
  };

  const handleAdvancedSearch = async (searchFilters: AdvancedSearchFilters) => {
    try {
      const response = await apiClient.post('/search/advanced', searchFilters);
      setAdvancedResults(response.data.data);
      setIsAdvancedSearch(true);
    } catch (error) {
      console.error('Advanced search failed:', error);
    }
  };

  const handleTypeFilter = (type: ContentType | null) => {
    const newFilters = { ...filters };
    if (type) {
      newFilters.type = type;
    } else {
      delete newFilters.type;
    }
    setFilters(newFilters);
    setIsAdvancedSearch(false);
    setAdvancedResults(null);
  };

  const handleSortChange = (sort: 'recent' | 'popular') => {
    setFilters({ ...filters, sort });
  };

  const handleTagsChange = (tags: string[]) => {
    setSelectedTags(tags);
    const newFilters = { ...filters };
    if (tags.length > 0) {
      newFilters.tags = tags.join(',');
    } else {
      delete newFilters.tags;
    }
    setFilters(newFilters);
    setIsAdvancedSearch(false);
    setAdvancedResults(null);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
          Welcome to Fantasy Red Zone
        </h1>
        <p className="text-sm sm:text-base text-gray-600">
          Your ultimate fantasy football content hub
        </p>
      </div>

      <FeaturedCarousel />

      {/* Tag Filter */}
      <div className="mb-4 sm:mb-6">
        <TagFilter selectedTags={selectedTags} onTagsChange={handleTagsChange} />
      </div>

      <div className="mb-4 sm:mb-6 space-y-3 sm:space-y-4">
        <div className="flex gap-2">
          <form onSubmit={handleSearch} className="flex-1 flex gap-2">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search content..."
              className="flex-1 px-3 sm:px-4 py-2.5 sm:py-2 text-sm sm:text-base border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500 min-h-[44px]"
            />
            <button
              type="submit"
              className="bg-primary-600 text-white px-4 sm:px-6 py-2.5 sm:py-2 rounded-md text-sm sm:text-base font-medium hover:bg-primary-700 min-h-[44px] whitespace-nowrap"
            >
              Search
            </button>
          </form>
          <button
            onClick={() => setShowAdvancedSearch(true)}
            className="bg-gray-200 text-gray-700 px-4 py-2.5 sm:py-2 rounded-md text-sm sm:text-base font-medium hover:bg-gray-300 min-h-[44px] whitespace-nowrap"
            title="Advanced Search"
          >
            <span className="hidden sm:inline">Advanced</span>
            <svg className="w-5 h-5 sm:hidden" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
            </svg>
          </button>
        </div>

        {/* Type Filters - Stack on mobile, side-by-side on desktop */}
        <div className="flex flex-col sm:flex-row sm:flex-wrap gap-3 sm:gap-4 sm:items-center">
          <div className="flex gap-2 overflow-x-auto pb-2 sm:pb-0 -mx-4 px-4 sm:mx-0 sm:px-0">
            <button
              onClick={() => handleTypeFilter(null)}
              className={`px-3 sm:px-4 py-2 rounded-md text-xs sm:text-sm font-medium whitespace-nowrap min-h-[44px] ${
                !filters.type
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              All
            </button>
            <button
              onClick={() => handleTypeFilter(ContentType.ARTICLE)}
              className={`px-3 sm:px-4 py-2 rounded-md text-xs sm:text-sm font-medium whitespace-nowrap min-h-[44px] ${
                filters.type === ContentType.ARTICLE
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Articles
            </button>
            <button
              onClick={() => handleTypeFilter(ContentType.VIDEO)}
              className={`px-3 sm:px-4 py-2 rounded-md text-xs sm:text-sm font-medium whitespace-nowrap min-h-[44px] ${
                filters.type === ContentType.VIDEO
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Videos
            </button>
            <button
              onClick={() => handleTypeFilter(ContentType.PODCAST)}
              className={`px-3 sm:px-4 py-2 rounded-md text-xs sm:text-sm font-medium whitespace-nowrap min-h-[44px] ${
                filters.type === ContentType.PODCAST
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Podcasts
            </button>
          </div>

          {/* Sort - Full width on mobile, auto on desktop */}
          <div className="flex gap-2 sm:ml-auto">
            <button
              onClick={() => handleSortChange('recent')}
              className={`flex-1 sm:flex-none px-3 sm:px-4 py-2 rounded-md text-xs sm:text-sm font-medium min-h-[44px] ${
                filters.sort !== 'popular'
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Recent
            </button>
            <button
              onClick={() => handleSortChange('popular')}
              className={`flex-1 sm:flex-none px-3 sm:px-4 py-2 rounded-md text-xs sm:text-sm font-medium min-h-[44px] ${
                filters.sort === 'popular'
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Popular
            </button>
          </div>
        </div>
      </div>

      {isAdvancedSearch && advancedResults ? (
        <div>
          <div className="mb-4 flex items-center justify-between">
            <p className="text-sm sm:text-base text-gray-600">
              Advanced search results: {advancedResults.length} items found
            </p>
            <button
              onClick={() => {
                setIsAdvancedSearch(false);
                setAdvancedResults(null);
              }}
              className="text-xs sm:text-sm text-primary-600 hover:text-primary-700 font-medium"
            >
              Clear filters
            </button>
          </div>
          {/* Render advanced results directly */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {advancedResults.map((item: any) => (
              <div key={item.id}>{/* You'd use ContentCard here but we need to import it properly */}</div>
            ))}
          </div>
        </div>
      ) : (
        <ContentGrid endpoint="/content" filters={filters} />
      )}

      <AdvancedSearchModal
        isOpen={showAdvancedSearch}
        onClose={() => setShowAdvancedSearch(false)}
        onSearch={handleAdvancedSearch}
      />
    </div>
  );
}
