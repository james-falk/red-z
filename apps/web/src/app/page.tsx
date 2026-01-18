'use client';

import { useState } from 'react';
import { ContentGrid } from '@/components/ContentGrid';
import { FeaturedCarousel } from '@/components/FeaturedCarousel';
import { ContentType } from '@fantasy-red-zone/shared';

export default function HomePage() {
  const [filters, setFilters] = useState<Record<string, any>>({});
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setFilters({ ...filters, q: searchQuery });
  };

  const handleTypeFilter = (type: ContentType | null) => {
    const newFilters = { ...filters };
    if (type) {
      newFilters.type = type;
    } else {
      delete newFilters.type;
    }
    setFilters(newFilters);
  };

  const handleSortChange = (sort: 'recent' | 'popular') => {
    setFilters({ ...filters, sort });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Welcome to Fantasy Red Zone
        </h1>
        <p className="text-gray-600">
          Your ultimate fantasy football content hub
        </p>
      </div>

      <FeaturedCarousel />

      <div className="mb-6 space-y-4">
        <form onSubmit={handleSearch} className="flex gap-2">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search content..."
            className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
          />
          <button
            type="submit"
            className="bg-primary-600 text-white px-6 py-2 rounded-md font-medium hover:bg-primary-700"
          >
            Search
          </button>
        </form>

        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex gap-2">
            <button
              onClick={() => handleTypeFilter(null)}
              className={`px-4 py-2 rounded-md text-sm font-medium ${
                !filters.type
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              All
            </button>
            <button
              onClick={() => handleTypeFilter(ContentType.ARTICLE)}
              className={`px-4 py-2 rounded-md text-sm font-medium ${
                filters.type === ContentType.ARTICLE
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Articles
            </button>
            <button
              onClick={() => handleTypeFilter(ContentType.VIDEO)}
              className={`px-4 py-2 rounded-md text-sm font-medium ${
                filters.type === ContentType.VIDEO
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Videos
            </button>
            <button
              onClick={() => handleTypeFilter(ContentType.PODCAST)}
              className={`px-4 py-2 rounded-md text-sm font-medium ${
                filters.type === ContentType.PODCAST
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Podcasts
            </button>
          </div>

          <div className="flex gap-2 ml-auto">
            <button
              onClick={() => handleSortChange('recent')}
              className={`px-4 py-2 rounded-md text-sm font-medium ${
                filters.sort !== 'popular'
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Recent
            </button>
            <button
              onClick={() => handleSortChange('popular')}
              className={`px-4 py-2 rounded-md text-sm font-medium ${
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

      <ContentGrid endpoint="/content" filters={filters} />
    </div>
  );
}
