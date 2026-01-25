'use client';

import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api';
import { ContentItem } from '@fantasy-red-zone/shared';

interface FeaturedItem {
  id: string;
  rank: number;
  startDate: string | null;
  endDate: string | null;
  content: ContentItem;
}

export default function AdminFeaturedPage() {
  const [featuredItems, setFeaturedItems] = useState<FeaturedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<ContentItem[]>([]);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);

  useEffect(() => {
    loadFeaturedItems();
  }, []);

  const loadFeaturedItems = async () => {
    try {
      const response = await apiClient.get('/featured');
      setFeaturedItems(response.data);
    } catch (error) {
      console.error('Error loading featured items:', error);
    } finally {
      setLoading(false);
    }
  };

  const searchContent = async () => {
    if (!searchQuery.trim()) return;

    setSearching(true);
    try {
      const response = await apiClient.get(`/content?q=${encodeURIComponent(searchQuery)}&limit=20`);
      setSearchResults(response.data.data);
      setShowSuggestions(false);
    } catch (error) {
      console.error('Error searching content:', error);
    } finally {
      setSearching(false);
    }
  };

  const loadSuggestions = async () => {
    setLoadingSuggestions(true);
    try {
      const response = await apiClient.get('/featured-suggestions/suggestions?limit=10');
      setSuggestions(response.data);
      setShowSuggestions(true);
      setSearchQuery('');
      setSearchResults([]);
    } catch (error) {
      console.error('Error loading suggestions:', error);
      alert('Failed to load AI suggestions');
    } finally {
      setLoadingSuggestions(false);
    }
  };

  const addFeaturedItem = async (contentId: string) => {
    try {
      const maxRank = Math.max(0, ...featuredItems.map(item => item.rank));
      await apiClient.post('/featured', {
        contentId,
        rank: maxRank + 1,
      });
      
      setShowAddModal(false);
      setSearchQuery('');
      setSearchResults([]);
      loadFeaturedItems();
    } catch (error: any) {
      console.error('Error adding featured item:', error);
      alert(error.response?.data?.error || 'Failed to add featured item');
    }
  };

  const removeFeaturedItem = async (id: string) => {
    if (!confirm('Are you sure you want to remove this featured item?')) return;

    try {
      await apiClient.delete(`/featured/${id}`);
      loadFeaturedItems();
    } catch (error) {
      console.error('Error removing featured item:', error);
      alert('Failed to remove featured item');
    }
  };

  const updateRank = async (id: string, newRank: number) => {
    try {
      await apiClient.patch(`/featured/${id}`, { rank: newRank });
      loadFeaturedItems();
    } catch (error) {
      console.error('Error updating rank:', error);
    }
  };

  const moveUp = (index: number) => {
    if (index === 0) return;
    const item = featuredItems[index];
    const prevItem = featuredItems[index - 1];
    updateRank(item.id, prevItem.rank);
    updateRank(prevItem.id, item.rank);
  };

  const moveDown = (index: number) => {
    if (index === featuredItems.length - 1) return;
    const item = featuredItems[index];
    const nextItem = featuredItems[index + 1];
    updateRank(item.id, nextItem.rank);
    updateRank(nextItem.id, item.rank);
  };

  if (loading) {
    return <div className="text-gray-500">Loading...</div>;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Featured Content</h1>
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-primary-600 text-white px-4 py-2 rounded-md font-medium hover:bg-primary-700"
        >
          + Add Featured Item
        </button>
      </div>

      {/* Current Featured Items */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        {featuredItems.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            No featured items yet. Add some to showcase on the home page!
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {featuredItems.map((item, index) => (
              <div key={item.id} className="p-4 flex items-center gap-4">
                {/* Rank Controls */}
                <div className="flex flex-col gap-1">
                  <button
                    onClick={() => moveUp(index)}
                    disabled={index === 0}
                    className="text-gray-400 hover:text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    ▲
                  </button>
                  <div className="text-sm font-medium text-gray-600 text-center">
                    #{item.rank}
                  </div>
                  <button
                    onClick={() => moveDown(index)}
                    disabled={index === featuredItems.length - 1}
                    className="text-gray-400 hover:text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    ▼
                  </button>
                </div>

                {/* Thumbnail */}
                {item.content.thumbnailUrl && (
                  <img
                    src={item.content.thumbnailUrl}
                    alt={item.content.title}
                    className="w-32 h-20 object-cover rounded"
                  />
                )}

                {/* Content Info */}
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900">
                    {item.content.title}
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    {item.content.source.name} • {item.content.type}
                  </p>
                  {(item.startDate || item.endDate) && (
                    <p className="text-xs text-gray-500 mt-1">
                      {item.startDate && `From ${new Date(item.startDate).toLocaleDateString()}`}
                      {item.startDate && item.endDate && ' • '}
                      {item.endDate && `Until ${new Date(item.endDate).toLocaleDateString()}`}
                    </p>
                  )}
                </div>

                {/* Actions */}
                <button
                  onClick={() => removeFeaturedItem(item.id)}
                  className="text-red-600 hover:text-red-700 font-medium"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900">Add Featured Item</h2>
                <button
                  onClick={() => {
                    setShowAddModal(false);
                    setSearchQuery('');
                    setSearchResults([]);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>

              {/* Search */}
              <div className="mt-4 flex gap-2">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && searchContent()}
                  placeholder="Search content by title or keywords..."
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                />
                <button
                  onClick={searchContent}
                  disabled={searching}
                  className="bg-primary-600 text-white px-6 py-2 rounded-md font-medium hover:bg-primary-700 disabled:opacity-50"
                >
                  {searching ? 'Searching...' : 'Search'}
                </button>
                <button
                  onClick={loadSuggestions}
                  disabled={loadingSuggestions}
                  className="bg-purple-600 text-white px-6 py-2 rounded-md font-medium hover:bg-purple-700 disabled:opacity-50 flex items-center gap-2"
                >
                  {loadingSuggestions ? 'Loading...' : (
                    <>
                      <span>✨</span>
                      <span>AI Suggestions</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Search Results */}
            <div className="flex-1 overflow-y-auto p-6">
              {showSuggestions ? (
                /* AI Suggestions */
                suggestions.length === 0 ? (
                  <div className="text-center text-gray-500 py-8">
                    No suggestions available
                  </div>
                ) : (
                  <div>
                    <div className="mb-4 p-3 bg-purple-50 border border-purple-200 rounded-lg">
                      <p className="text-sm text-purple-900">
                        <span className="font-semibold">✨ AI-Powered Suggestions</span>
                        <br />
                        <span className="text-purple-700">
                          Based on recency, engagement, tag relevance, and content diversity
                        </span>
                      </p>
                    </div>
                    <div className="space-y-3">
                      {suggestions.map((item) => (
                        <div
                          key={item.content.id}
                          className="flex items-center gap-4 p-4 border border-purple-200 rounded-lg hover:bg-purple-50 bg-white"
                        >
                          {item.content.thumbnailUrl && (
                            <img
                              src={item.content.thumbnailUrl}
                              alt={item.content.title}
                              className="w-24 h-16 object-cover rounded"
                            />
                          )}
                          <div className="flex-1">
                            <h4 className="font-semibold text-gray-900">{item.content.title}</h4>
                            <p className="text-sm text-gray-600 mt-1">
                              {item.content.source.name} • {item.content.type}
                            </p>
                            <div className="flex gap-2 mt-2 text-xs">
                              <span className="bg-purple-100 text-purple-700 px-2 py-0.5 rounded">
                                Score: {Math.round(item.score * 100)}
                              </span>
                              <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded">
                                {item.metrics.clickCount} clicks
                              </span>
                              <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded">
                                {item.metrics.ageInDays}d old
                              </span>
                            </div>
                          </div>
                          <button
                            onClick={() => addFeaturedItem(item.content.id)}
                            className="bg-primary-600 text-white px-4 py-2 rounded-md font-medium hover:bg-primary-700"
                          >
                            Feature
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              ) : searchResults.length === 0 ? (
                <div className="text-center text-gray-500 py-8">
                  {searchQuery ? 'No results found' : 'Search for content to feature or try AI suggestions'}
                </div>
              ) : (
                /* Search Results */
                <div className="space-y-3">
                  {searchResults.map((content) => (
                    <div
                      key={content.id}
                      className="flex items-center gap-4 p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
                    >
                      {content.thumbnailUrl && (
                        <img
                          src={content.thumbnailUrl}
                          alt={content.title}
                          className="w-24 h-16 object-cover rounded"
                        />
                      )}
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900">{content.title}</h4>
                        <p className="text-sm text-gray-600 mt-1">
                          {content.source.name} • {content.type}
                        </p>
                      </div>
                      <button
                        onClick={() => addFeaturedItem(content.id)}
                        className="bg-primary-600 text-white px-4 py-2 rounded-md font-medium hover:bg-primary-700"
                      >
                        Feature
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
