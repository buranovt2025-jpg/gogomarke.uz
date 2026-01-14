import { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Video } from '../../types';
import api from '../../services/api';
import { Button } from '../../components/ui/button';
import { ArrowLeft, Heart, MessageCircle, Share2, ShoppingBag, Play, Pause, Volume2, VolumeX, ChevronUp, ChevronDown, Bookmark, MoreVertical, UserPlus } from 'lucide-react';
import VideoComments from '../../components/VideoComments';

// Loading spinner component
const LoadingSpinner = () => (
  <div className="min-h-screen bg-black flex items-center justify-center">
    <div className="flex flex-col items-center gap-4">
      <div className="w-16 h-16 relative">
        <div className="absolute inset-0 rounded-full border-4 border-gray-800" />
        <div className="absolute inset-0 rounded-full border-4 border-orange-500 border-t-transparent animate-spin" />
      </div>
      <p className="text-white/60 text-sm animate-pulse">Загрузка видео...</p>
    </div>
  </div>
);

// Action button component with animation
const ActionButton = ({ 
  icon: Icon, 
  label, 
  count, 
  onClick, 
  active = false,
  activeColor = 'bg-red-500'
}: {
  icon: React.ElementType;
  label?: string;
  count?: number | string;
  onClick?: () => void;
  active?: boolean;
  activeColor?: string;
}) => (
  <button
    onClick={onClick}
    className="flex flex-col items-center group"
  >
    <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 transform hover:scale-110 active:scale-90 ${
      active ? activeColor : 'bg-white/20 backdrop-blur-sm hover:bg-white/30'
    }`}>
      <Icon className={`w-6 h-6 transition-transform duration-200 group-hover:scale-110 ${active ? 'text-white fill-white' : 'text-white'}`} />
    </div>
    {(count !== undefined || label) && (
      <span className="text-white text-xs mt-1.5 font-medium drop-shadow-lg">
        {count !== undefined ? count : label}
      </span>
    )}
  </button>
);

// Progress bar component
const VideoProgress = ({ progress, duration }: { progress: number; duration: number }) => (
  <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20">
    <div 
      className="h-full bg-gradient-to-r from-orange-500 to-orange-400 transition-all duration-100"
      style={{ width: `${(progress / duration) * 100}%` }}
    />
  </div>
);

export default function VideoFeedPage() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(true);
  const [showComments, setShowComments] = useState(false);
  const [likes, setLikes] = useState<Record<string, boolean>>({});
  const [bookmarks, setBookmarks] = useState<Record<string, boolean>>({});
  const [videoProgress, setVideoProgress] = useState(0);
  const [videoDuration, setVideoDuration] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);
  const controlsTimeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    loadVideos();
  }, []);

  // Hide controls after inactivity
  useEffect(() => {
    if (showControls) {
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
      controlsTimeoutRef.current = setTimeout(() => {
        if (isPlaying) setShowControls(false);
      }, 3000);
    }
    return () => {
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
    };
  }, [showControls, isPlaying]);

  const loadVideos = async () => {
    try {
      const response = await api.getVideoFeed({ limit: 20 });
      setVideos(response.data || []);
    } catch (error) {
      console.error('Failed to load videos:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const currentVideo = videos[currentIndex];

  const handleVideoTransition = useCallback((newIndex: number) => {
    if (newIndex < 0 || newIndex >= videos.length || isTransitioning) return;
    
    setIsTransitioning(true);
    setShowComments(false);
    
    // Smooth transition
    setTimeout(() => {
      setCurrentIndex(newIndex);
      setVideoProgress(0);
      setIsTransitioning(false);
    }, 150);
  }, [videos.length, isTransitioning]);

  const handlePrevious = () => handleVideoTransition(currentIndex - 1);
  const handleNext = () => handleVideoTransition(currentIndex + 1);

  // Swipe gesture support
  const [touchStart, setTouchStart] = useState(0);
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.touches[0].clientY);
  };
  
  const handleTouchEnd = (e: React.TouchEvent) => {
    const touchEnd = e.changedTouches[0].clientY;
    const diff = touchStart - touchEnd;
    
    if (Math.abs(diff) > 50) {
      if (diff > 0) handleNext();
      else handlePrevious();
    }
  };

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
    setShowControls(true);
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const toggleLike = (videoId: string) => {
    setLikes((prev) => ({
      ...prev,
      [videoId]: !prev[videoId],
    }));
  };

  const toggleBookmark = (videoId: string) => {
    setBookmarks((prev) => ({
      ...prev,
      [videoId]: !prev[videoId],
    }));
  };

  const handleShare = async () => {
    if (navigator.share && currentVideo) {
      try {
        await navigator.share({
          title: currentVideo.title,
          url: window.location.href,
        });
      } catch (error) {
        console.error('Failed to share:', error);
      }
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setVideoProgress(videoRef.current.currentTime);
      setVideoDuration(videoRef.current.duration || 0);
    }
  };

  const handleVideoClick = () => {
    togglePlay();
    setShowControls(true);
  };

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (videos.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black flex flex-col items-center justify-center text-white">
        <div className="w-24 h-24 bg-gray-800 rounded-full flex items-center justify-center mb-6">
          <Play className="w-12 h-12 text-gray-600" />
        </div>
        <p className="text-gray-400 text-lg mb-2">Видео пока нет</p>
        <p className="text-gray-500 text-sm mb-6">Загляните позже, чтобы увидеть новый контент</p>
        <Link to="/">
          <Button variant="outline" className="border-white/20 text-white hover:bg-white/10">
            На главную
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div 
      className="min-h-screen bg-black relative overflow-hidden"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onMouseMove={() => setShowControls(true)}
    >
      {/* Header */}
      <div className={`fixed top-0 left-0 right-0 z-20 p-4 transition-opacity duration-300 ${showControls ? 'opacity-100' : 'opacity-0'}`}>
        <div className="flex items-center justify-between">
          <Link to="/">
            <Button variant="ghost" size="icon" className="text-white hover:bg-white/20 backdrop-blur-sm">
              <ArrowLeft className="w-6 h-6" />
            </Button>
          </Link>
          <div className="flex items-center gap-2">
            <span className="text-white/80 text-sm font-medium px-3 py-1 bg-black/40 backdrop-blur-sm rounded-full">
              {currentIndex + 1} / {videos.length}
            </span>
            <Button variant="ghost" size="icon" className="text-white hover:bg-white/20">
              <MoreVertical className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Video Container with transition */}
      <div className={`h-screen flex items-center justify-center relative transition-opacity duration-150 ${isTransitioning ? 'opacity-50' : 'opacity-100'}`}>
        {/* Video loading placeholder/thumbnail */}
        {currentVideo && (
          <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-gray-800 to-black flex items-center justify-center z-0">
            {/* Thumbnail background if available */}
            {currentVideo.thumbnail && (
              <img 
                src={currentVideo.thumbnail} 
                alt="" 
                className="absolute inset-0 w-full h-full object-cover opacity-30 blur-sm"
              />
            )}
            <div className="text-center z-10">
              <div className="w-20 h-20 mx-auto mb-4 bg-orange-500/20 rounded-full flex items-center justify-center animate-pulse">
                <Play className="w-10 h-10 text-orange-400" />
              </div>
              <p className="text-white/80 text-sm">Загрузка видео...</p>
            </div>
          </div>
        )}
        
        {currentVideo?.videoUrl ? (
          <video
            ref={videoRef}
            src={currentVideo.videoUrl}
            poster={currentVideo.thumbnail || undefined}
            className="max-h-full max-w-full object-contain relative z-10"
            autoPlay
            loop
            muted={isMuted}
            playsInline
            onClick={handleVideoClick}
            onTimeUpdate={handleTimeUpdate}
            onError={(e) => {
              console.error('Video load error:', e);
              // Hide broken video, fallback will show
              (e.target as HTMLVideoElement).style.display = 'none';
            }}
            onLoadStart={() => {
              // Show loading state
              if (videoRef.current) {
                videoRef.current.style.opacity = '0.5';
              }
            }}
            onCanPlay={() => {
              // Video ready to play
              if (videoRef.current) {
                videoRef.current.style.opacity = '1';
                videoRef.current.style.display = 'block';
              }
            }}
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center relative z-10">
            {/* Product thumbnail as fallback background */}
            {currentVideo?.product?.images?.[0] && (
              <img 
                src={currentVideo.product.images[0]} 
                alt="" 
                className="absolute inset-0 w-full h-full object-cover opacity-20 blur-md"
              />
            )}
            <div className="text-center relative z-10">
              <div className="w-28 h-28 mx-auto mb-4 bg-gradient-to-br from-orange-500/30 to-pink-500/30 rounded-full flex items-center justify-center backdrop-blur-sm border border-white/10">
                <Play className="w-14 h-14 text-white/70" />
              </div>
              <p className="text-white font-semibold text-xl mb-2">{currentVideo?.title || 'Видео'}</p>
              <p className="text-gray-400 text-sm">Видео временно недоступно</p>
              {currentVideo?.product && (
                <Link
                  to={`/products/${currentVideo.product.id}`}
                  className="mt-6 inline-flex items-center gap-2 px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-full font-semibold transition-colors"
                >
                  <ShoppingBag className="w-5 h-5" />
                  Посмотреть товар
                </Link>
              )}
            </div>
          </div>
        )}

        {/* Video Progress Bar */}
        {videoDuration > 0 && (
          <VideoProgress progress={videoProgress} duration={videoDuration} />
        )}

        {/* Bottom Info Overlay */}
        <div className={`absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/90 via-black/50 to-transparent transition-opacity duration-300 ${showControls ? 'opacity-100' : 'opacity-70'}`}>
          <div className="flex items-end justify-between">
            {/* Left side - Video info */}
            <div className="flex-1 pr-16">
              {/* Seller info */}
              <div className="flex items-center gap-3 mb-3">
                <div className="relative">
                  <div className="w-11 h-11 rounded-full bg-gradient-to-br from-orange-500 to-pink-500 p-0.5">
                    <div className="w-full h-full rounded-full bg-gray-700 overflow-hidden">
                      {currentVideo?.seller?.avatar ? (
                        <img src={currentVideo.seller.avatar} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-white font-bold">
                          {currentVideo?.seller?.firstName?.[0] || 'S'}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="absolute -bottom-0.5 -right-0.5 w-5 h-5 bg-orange-500 rounded-full flex items-center justify-center border-2 border-black">
                    <UserPlus className="w-2.5 h-2.5 text-white" />
                  </div>
                </div>
                <div>
                  <p className="text-white font-semibold text-sm">
                    {currentVideo?.seller?.firstName} {currentVideo?.seller?.lastName}
                  </p>
                  <p className="text-white/60 text-xs">@{currentVideo?.seller?.phone?.slice(-4) || 'seller'}</p>
                </div>
                <button className="px-4 py-1.5 bg-white/20 backdrop-blur-sm rounded-full text-white text-xs font-semibold hover:bg-white/30 transition-colors">
                  Подписаться
                </button>
              </div>
              
              {/* Video title & description */}
              <p className="text-white text-sm font-medium mb-1">{currentVideo?.title}</p>
              {currentVideo?.description && (
                <p className="text-white/70 text-xs line-clamp-2">{currentVideo.description}</p>
              )}
              
              {/* Product card */}
              {currentVideo?.product && (
                <Link
                  to={`/products/${currentVideo.product.id}`}
                  className="mt-3 flex items-center gap-3 bg-white/10 backdrop-blur-md rounded-xl p-2.5 hover:bg-white/20 transition-all duration-300 border border-white/10"
                >
                  <div className="w-14 h-14 rounded-lg bg-gray-700 overflow-hidden flex-shrink-0">
                    {currentVideo.product.images?.[0] ? (
                      <img src={currentVideo.product.images[0]} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <ShoppingBag className="w-6 h-6 text-gray-400" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-medium truncate">{currentVideo.product.title}</p>
                    <p className="text-orange-400 text-sm font-bold mt-0.5">
                      {new Intl.NumberFormat('uz-UZ').format(currentVideo.product.price)} сум
                    </p>
                  </div>
                  <div className="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center flex-shrink-0">
                    <ShoppingBag className="w-5 h-5 text-white" />
                  </div>
                </Link>
              )}
            </div>

            {/* Right side - Action buttons */}
            <div className="flex flex-col items-center gap-5">
              <ActionButton
                icon={Heart}
                count={currentVideo?.likeCount || 0}
                onClick={() => toggleLike(currentVideo?.id || '')}
                active={likes[currentVideo?.id || '']}
                activeColor="bg-red-500"
              />
              
              <ActionButton
                icon={MessageCircle}
                count={currentVideo?.viewCount || 0}
                onClick={() => setShowComments(true)}
              />
              
              <ActionButton
                icon={Bookmark}
                onClick={() => toggleBookmark(currentVideo?.id || '')}
                active={bookmarks[currentVideo?.id || '']}
                activeColor="bg-yellow-500"
              />
              
              <ActionButton
                icon={Share2}
                label="Поделиться"
                onClick={handleShare}
              />
              
              <ActionButton
                icon={isMuted ? VolumeX : Volume2}
                onClick={toggleMute}
              />
            </div>
          </div>
        </div>

        {/* Navigation buttons */}
        <div className={`absolute right-4 top-1/2 -translate-y-1/2 flex flex-col gap-3 transition-opacity duration-300 ${showControls ? 'opacity-100' : 'opacity-0'}`}>
          <button
            onClick={handlePrevious}
            disabled={currentIndex === 0}
            className={`w-11 h-11 rounded-full flex items-center justify-center transition-all duration-200 ${
              currentIndex === 0 
                ? 'bg-white/10 text-gray-500 cursor-not-allowed' 
                : 'bg-white/20 backdrop-blur-sm text-white hover:bg-white/30 hover:scale-110 active:scale-95'
            }`}
          >
            <ChevronUp className="w-6 h-6" />
          </button>
          <button
            onClick={handleNext}
            disabled={currentIndex === videos.length - 1}
            className={`w-11 h-11 rounded-full flex items-center justify-center transition-all duration-200 ${
              currentIndex === videos.length - 1 
                ? 'bg-white/10 text-gray-500 cursor-not-allowed' 
                : 'bg-white/20 backdrop-blur-sm text-white hover:bg-white/30 hover:scale-110 active:scale-95'
            }`}
          >
            <ChevronDown className="w-6 h-6" />
          </button>
        </div>

        {/* Play/Pause overlay */}
        {!isPlaying && (
          <button
            onClick={togglePlay}
            className="absolute inset-0 flex items-center justify-center animate-fade-in"
          >
            <div className="w-20 h-20 rounded-full bg-white/30 backdrop-blur-sm flex items-center justify-center transform hover:scale-110 transition-transform">
              <Play className="w-10 h-10 text-white ml-1" />
            </div>
          </button>
        )}
      </div>

      {/* Comments Modal */}
      {showComments && currentVideo && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-30 animate-fade-in" 
          onClick={() => setShowComments(false)}
        >
          <div
            className="absolute bottom-0 left-0 right-0 max-h-[70vh] bg-white dark:bg-gray-900 rounded-t-3xl overflow-hidden animate-slide-up"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between sticky top-0 bg-white dark:bg-gray-900">
              <div>
                <h3 className="font-bold text-lg text-gray-900 dark:text-white">Комментарии</h3>
                <p className="text-sm text-gray-500">{currentVideo.viewCount || 0} просмотров</p>
              </div>
              <button
                onClick={() => setShowComments(false)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
              >
                <span className="text-gray-500 text-sm font-medium">Закрыть</span>
              </button>
            </div>
            <div className="overflow-y-auto max-h-[calc(70vh-80px)]">
              <VideoComments videoId={currentVideo.id} />
            </div>
          </div>
        </div>
      )}

      {/* CSS for animations */}
      <style>{`
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slide-up {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fade-in 0.2s ease-out;
        }
        .animate-slide-up {
          animation: slide-up 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}
