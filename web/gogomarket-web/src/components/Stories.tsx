import { useState, useEffect } from 'react';
import { Plus, X, ChevronLeft, ChevronRight } from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';

interface Story {
  id: string;
  sellerId: string;
  mediaUrl: string;
  mediaType: 'image' | 'video';
  caption?: string;
  viewCount: number;
  createdAt: string;
  product?: {
    id: string;
    title: string;
    price: number;
    images: string[];
  };
}

interface StoryGroup {
  sellerId: string;
  seller: {
    id: string;
    firstName: string;
    lastName?: string;
  };
  stories: Story[];
  hasUnviewed: boolean;
}

interface StoriesProps {
  onCreateStory?: () => void;
}

export default function Stories({ onCreateStory }: StoriesProps) {
  const [storyGroups, setStoryGroups] = useState<StoryGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewingGroup, setViewingGroup] = useState<StoryGroup | null>(null);
  const [currentStoryIndex, setCurrentStoryIndex] = useState(0);
  const { user } = useAuth();

  useEffect(() => {
    loadStories();
  }, []);

  const loadStories = async () => {
    try {
      const response = await api.getStories() as { success: boolean; data: StoryGroup[] };
      if (response.success) {
        setStoryGroups(response.data);
      }
    } catch (error) {
      console.error('Failed to load stories:', error);
    } finally {
      setLoading(false);
    }
  };

  const openStoryViewer = async (group: StoryGroup) => {
    setViewingGroup(group);
    setCurrentStoryIndex(0);
    if (group.stories[0]) {
      try {
        await api.viewStory(group.stories[0].id);
      } catch (error) {
        console.error('Failed to mark story as viewed:', error);
      }
    }
  };

  const closeStoryViewer = () => {
    setViewingGroup(null);
    setCurrentStoryIndex(0);
  };

  const nextStory = async () => {
    if (!viewingGroup) return;
    
    if (currentStoryIndex < viewingGroup.stories.length - 1) {
      const nextIndex = currentStoryIndex + 1;
      setCurrentStoryIndex(nextIndex);
      try {
        await api.viewStory(viewingGroup.stories[nextIndex].id);
      } catch (error) {
        console.error('Failed to mark story as viewed:', error);
      }
    } else {
      const currentGroupIndex = storyGroups.findIndex(g => g.sellerId === viewingGroup.sellerId);
      if (currentGroupIndex < storyGroups.length - 1) {
        const nextGroup = storyGroups[currentGroupIndex + 1];
        setViewingGroup(nextGroup);
        setCurrentStoryIndex(0);
        try {
          await api.viewStory(nextGroup.stories[0].id);
        } catch (error) {
          console.error('Failed to mark story as viewed:', error);
        }
      } else {
        closeStoryViewer();
      }
    }
  };

  const prevStory = () => {
    if (!viewingGroup) return;
    
    if (currentStoryIndex > 0) {
      setCurrentStoryIndex(currentStoryIndex - 1);
    } else {
      const currentGroupIndex = storyGroups.findIndex(g => g.sellerId === viewingGroup.sellerId);
      if (currentGroupIndex > 0) {
        const prevGroup = storyGroups[currentGroupIndex - 1];
        setViewingGroup(prevGroup);
        setCurrentStoryIndex(prevGroup.stories.length - 1);
      }
    }
  };

  if (loading) {
    return (
      <div className="flex gap-3 px-4 py-3 overflow-x-auto">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="flex-shrink-0">
            <div className="w-16 h-16 rounded-full bg-gray-200 animate-pulse" />
            <div className="w-12 h-3 bg-gray-200 rounded mt-1 mx-auto animate-pulse" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <>
      <div className="flex gap-3 px-4 py-3 overflow-x-auto scrollbar-hide">
        {user?.role === 'seller' && onCreateStory && (
          <button
            onClick={onCreateStory}
            className="flex-shrink-0 flex flex-col items-center"
          >
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-orange-400 to-pink-500 flex items-center justify-center">
              <div className="w-14 h-14 rounded-full bg-white flex items-center justify-center">
                <Plus className="w-6 h-6 text-orange-500" />
              </div>
            </div>
            <span className="text-xs text-gray-600 mt-1 truncate w-16 text-center">Добавить</span>
          </button>
        )}

        {storyGroups.map((group) => (
          <button
            key={group.sellerId}
            onClick={() => openStoryViewer(group)}
            className="flex-shrink-0 flex flex-col items-center"
          >
            <div className={`w-16 h-16 rounded-full p-0.5 ${
              group.hasUnviewed 
                ? 'bg-gradient-to-br from-orange-400 to-pink-500' 
                : 'bg-gray-300'
            }`}>
              <div className="w-full h-full rounded-full bg-white p-0.5">
                <div className="w-full h-full rounded-full bg-orange-100 flex items-center justify-center overflow-hidden">
                  {group.stories[0]?.mediaType === 'image' ? (
                    <img 
                      src={group.stories[0].mediaUrl} 
                      alt="" 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-orange-500 font-semibold text-lg">
                      {group.seller.firstName?.[0] || 'S'}
                    </span>
                  )}
                </div>
              </div>
            </div>
            <span className="text-xs text-gray-600 mt-1 truncate w-16 text-center">
              {group.seller.firstName}
            </span>
          </button>
        ))}

        {storyGroups.length === 0 && !user?.role?.includes('seller') && (
          <div className="text-sm text-gray-500 py-4">
            Нет активных историй
          </div>
        )}
      </div>

      {viewingGroup && (
        <div className="fixed inset-0 bg-black z-50 flex items-center justify-center">
          <button
            onClick={closeStoryViewer}
            className="absolute top-4 right-4 z-10 text-white"
          >
            <X className="w-8 h-8" />
          </button>

          <div className="absolute top-4 left-4 right-16 flex gap-1">
            {viewingGroup.stories.map((_, index) => (
              <div
                key={index}
                className={`h-1 flex-1 rounded-full ${
                  index <= currentStoryIndex ? 'bg-white' : 'bg-white/30'
                }`}
              />
            ))}
          </div>

          <div className="absolute top-10 left-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center">
              <span className="text-orange-500 font-semibold">
                {viewingGroup.seller.firstName?.[0] || 'S'}
              </span>
            </div>
            <div>
              <p className="text-white font-medium text-sm">
                {viewingGroup.seller.firstName} {viewingGroup.seller.lastName}
              </p>
              <p className="text-white/60 text-xs">
                {new Date(viewingGroup.stories[currentStoryIndex]?.createdAt).toLocaleTimeString('ru-RU', {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
            </div>
          </div>

          <button
            onClick={prevStory}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-white/80 hover:text-white"
          >
            <ChevronLeft className="w-10 h-10" />
          </button>

          <button
            onClick={nextStory}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-white/80 hover:text-white"
          >
            <ChevronRight className="w-10 h-10" />
          </button>

          <div className="w-full h-full flex items-center justify-center">
            {viewingGroup.stories[currentStoryIndex]?.mediaType === 'video' ? (
              <video
                src={viewingGroup.stories[currentStoryIndex].mediaUrl}
                className="max-w-full max-h-full object-contain"
                autoPlay
                muted
                playsInline
                onEnded={nextStory}
              />
            ) : (
              <img
                src={viewingGroup.stories[currentStoryIndex]?.mediaUrl}
                alt=""
                className="max-w-full max-h-full object-contain"
                onClick={nextStory}
              />
            )}
          </div>

          {viewingGroup.stories[currentStoryIndex]?.caption && (
            <div className="absolute bottom-20 left-4 right-4 text-center">
              <p className="text-white text-lg bg-black/30 px-4 py-2 rounded-lg inline-block">
                {viewingGroup.stories[currentStoryIndex].caption}
              </p>
            </div>
          )}

          {viewingGroup.stories[currentStoryIndex]?.product && (
            <div className="absolute bottom-4 left-4 right-4">
              <div className="bg-white rounded-xl p-3 flex items-center gap-3">
                <img
                  src={viewingGroup.stories[currentStoryIndex].product?.images?.[0] || ''}
                  alt=""
                  className="w-12 h-12 rounded-lg object-cover"
                />
                <div className="flex-1">
                  <p className="font-medium text-sm truncate">
                    {viewingGroup.stories[currentStoryIndex].product?.title}
                  </p>
                  <p className="text-orange-500 font-semibold">
                    {viewingGroup.stories[currentStoryIndex].product?.price?.toLocaleString()} сум
                  </p>
                </div>
                <button className="px-4 py-2 bg-orange-500 text-white rounded-lg text-sm font-medium">
                  Купить
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
}
