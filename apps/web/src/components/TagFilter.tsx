'use client';

import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api';

interface Tag {
  id: string;
  name: string;
  slug: string;
  type: 'PLAYER' | 'TEAM' | 'POSITION' | 'TOPIC' | 'KEYWORD';
  count: number;
}

interface TagFilterProps {
  selectedTags: string[];
  onTagsChange: (tags: string[]) => void;
}

export function TagFilter({ selectedTags, onTagsChange }: TagFilterProps) {
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAll, setShowAll] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  useEffect(() => {
    loadTags();
  }, []);

  const loadTags = async () => {
    try {
      const response = await apiClient.get('/tags/popular?limit=30');
      setTags(response.data);
    } catch (error) {
      console.error('Error loading tags:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleTag = (slug: string) => {
    if (selectedTags.includes(slug)) {
      onTagsChange(selectedTags.filter(s => s !== slug));
    } else {
      onTagsChange([...selectedTags, slug]);
    }
  };

  const clearAll = () => {
    onTagsChange([]);
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 sm:p-4">
        <div className="text-gray-500 text-sm">Loading tags...</div>
      </div>
    );
  }

  if (tags.length === 0) {
    return null;
  }

  const displayedTags = showAll ? tags : tags.slice(0, 15);

  const getTagColor = (type: string, selected: boolean) => {
    if (!selected) {
      return 'bg-gray-100 text-gray-700 hover:bg-gray-200';
    }
    
    switch (type) {
      case 'PLAYER':
        return 'bg-blue-500 text-white hover:bg-blue-600';
      case 'TEAM':
        return 'bg-purple-500 text-white hover:bg-purple-600';
      case 'POSITION':
        return 'bg-green-500 text-white hover:bg-green-600';
      case 'TOPIC':
        return 'bg-orange-500 text-white hover:bg-orange-600';
      default:
        return 'bg-gray-500 text-white hover:bg-gray-600';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 sm:p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-gray-900">Filter by Tags</h3>
          {selectedTags.length > 0 && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800">
              {selectedTags.length}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {selectedTags.length > 0 && (
            <button
              onClick={clearAll}
              className="text-xs text-primary-600 hover:text-primary-700 font-medium whitespace-nowrap"
            >
              Clear
            </button>
          )}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="md:hidden p-1.5 hover:bg-gray-100 rounded min-w-[44px] min-h-[44px] flex items-center justify-center"
            aria-label={isCollapsed ? 'Show filters' : 'Hide filters'}
          >
            <svg
              className={`w-4 h-4 transition-transform ${isCollapsed ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile: Collapsible, Desktop: Always visible */}
      <div className={`${isCollapsed ? 'hidden' : 'block'} md:block`}>
        {/* Mobile: Horizontal scroll, Desktop: Flex wrap */}
        <div className="flex md:flex-wrap gap-2 overflow-x-auto md:overflow-x-visible pb-2 md:pb-0 -mx-3 px-3 md:mx-0 md:px-0 scrollbar-thin">
          {displayedTags.map((tag) => (
            <button
              key={tag.id}
              onClick={() => toggleTag(tag.slug)}
              className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium transition-colors whitespace-nowrap min-h-[44px] md:min-h-0 touch-manipulation ${getTagColor(
                tag.type,
                selectedTags.includes(tag.slug)
              )}`}
            >
              {tag.name}
              <span className="ml-1.5 opacity-75">({tag.count})</span>
            </button>
          ))}
        </div>

        {tags.length > 15 && (
          <button
            onClick={() => setShowAll(!showAll)}
            className="mt-3 text-xs text-gray-600 hover:text-gray-800 font-medium min-h-[44px] md:min-h-0 py-2 md:py-0"
          >
            {showAll ? 'Show less' : `Show ${tags.length - 15} more tags`}
          </button>
        )}

        {selectedTags.length > 0 && (
          <div className="mt-3 pt-3 border-t border-gray-200">
            <p className="text-xs text-gray-600">
              Showing content tagged with:{' '}
              <span className="font-medium text-gray-900 break-words">
                {selectedTags.join(', ')}
              </span>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
