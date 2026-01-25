'use client';

import { useState, useEffect, useRef } from 'react';
import { ContentItem } from '@fantasy-red-zone/shared';
import { ContentCard } from './ContentCard';
import { apiClient } from '@/lib/api';

interface FeaturedCarouselProps {
  initialItems?: ContentItem[];
}

export function FeaturedCarousel({ initialItems = [] }: FeaturedCarouselProps) {
  const [items, setItems] = useState<ContentItem[]>(initialItems);
  const [loading, setLoading] = useState(initialItems.length === 0);
  const [currentIndex, setCurrentIndex] = useState(0);
  const touchStartX = useRef<number>(0);
  const touchEndX = useRef<number>(0);

  useEffect(() => {
    if (initialItems.length === 0) {
      loadFeaturedItems();
    }
  }, []);

  const loadFeaturedItems = async () => {
    try {
      const response = await apiClient.get('/featured');
      setItems(response.data.map((item: any) => item.content));
    } catch (error) {
      console.error('Error loading featured items:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || items.length === 0) {
    return null;
  }

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + 1) % items.length);
  };

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev - 1 + items.length) % items.length);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = () => {
    const swipeThreshold = 50;
    const diff = touchStartX.current - touchEndX.current;

    if (Math.abs(diff) > swipeThreshold) {
      if (diff > 0) {
        nextSlide();
      } else {
        prevSlide();
      }
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden mb-6 sm:mb-8">
      <div className="p-3 sm:p-4 border-b border-gray-200">
        <h2 className="text-lg sm:text-xl font-bold text-gray-900">Featured</h2>
      </div>

      <div className="relative">
        <div 
          className="overflow-hidden touch-pan-y"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <div
            className="flex transition-transform duration-300 ease-in-out"
            style={{ transform: `translateX(-${currentIndex * 100}%)` }}
          >
            {items.map((item) => (
              <div key={item.id} className="w-full flex-shrink-0 p-3 sm:p-4">
                <ContentCard content={item} featured />
              </div>
            ))}
          </div>
        </div>

        {items.length > 1 && (
          <>
            {/* Desktop/Tablet Navigation Arrows */}
            <button
              onClick={prevSlide}
              className="hidden sm:flex absolute left-2 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white p-2 rounded-full shadow-lg items-center justify-center min-w-[44px] min-h-[44px]"
              aria-label="Previous"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>

            <button
              onClick={nextSlide}
              className="hidden sm:flex absolute right-2 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white p-2 rounded-full shadow-lg items-center justify-center min-w-[44px] min-h-[44px]"
              aria-label="Next"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>

            {/* Dot Navigation (visible on all screens) */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex space-x-2">
              {items.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentIndex(index)}
                  className={`w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center ${
                    index === currentIndex ? 'bg-primary-600' : 'bg-gray-300'
                  }`}
                  aria-label={`Go to slide ${index + 1}`}
                >
                  <span className={`w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full ${
                    index === currentIndex ? 'bg-primary-600' : 'bg-gray-300'
                  }`} />
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
