import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Video } from '../../types';
import api from '../../services/api';
import { Skeleton } from '../../components/ui/skeleton';
import { Button } from '../../components/ui/button';
import { ArrowLeft, Heart, MessageCircle, Share2, ShoppingBag, Play, Pause, Volume2, VolumeX, ChevronUp, ChevronDown } from 'lucide-react';
import VideoComments from '../../components/VideoComments';

export default function VideoFeedPage() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(true);
  const [showComments, setShowComments] = useState(false);
  const [likes, setLikes] = useState<Record<string, boolean>>({});
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    loadVideos();
  }, []);

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

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setShowComments(false);
    }
  };

  const handleNext = () => {
    if (currentIndex < videos.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setShowComments(false);
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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Skeleton className="w-full h-full bg-gray-800" />
      </div>
    );
  }

  if (videos.length === 0) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center text-white">
        <Play className="w-16 h-16 text-gray-600 mb-4" />
        <p className="text-gray-400">Видео пока нет</p>
        <Link to="/" className="mt-4">
          <Button variant="outline">На главную</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black relative">
      <div className="fixed top-4 left-4 z-20">
        <Link to="/">
          <Button variant="ghost" size="icon" className="text-white hover:bg-white/20">
            <ArrowLeft className="w-6 h-6" />
          </Button>
        </Link>
      </div>

      <div className="h-screen flex items-center justify-center relative">
        {currentVideo?.videoUrl ? (
          <video
            ref={videoRef}
            src={currentVideo.videoUrl}
            className="max-h-full max-w-full object-contain"
            autoPlay
            loop
            muted={isMuted}
            playsInline
            onClick={togglePlay}
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center">
            <div className="text-center">
              <Play className="w-20 h-20 text-gray-600 mx-auto mb-4" />
              <p className="text-white font-semibold">{currentVideo?.title}</p>
              <p className="text-gray-400 text-sm mt-2">Видео недоступно</p>
            </div>
          </div>
        )}

        <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
          <div className="flex items-end justify-between">
            <div className="flex-1 pr-16">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-10 h-10 rounded-full bg-gray-700 overflow-hidden">
                  {currentVideo?.seller?.avatar ? (
                    <img src={currentVideo.seller.avatar} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-white">
                      {currentVideo?.seller?.firstName?.[0] || 'S'}
                    </div>
                  )}
                </div>
                <div>
                  <p className="text-white font-semibold">
                    {currentVideo?.seller?.firstName} {currentVideo?.seller?.lastName}
                  </p>
                  <p className="text-gray-400 text-xs">@{currentVideo?.seller?.phone?.slice(-4) || 'seller'}</p>
                </div>
              </div>
              <p className="text-white text-sm mb-2">{currentVideo?.title}</p>
              {currentVideo?.description && (
                <p className="text-gray-300 text-xs line-clamp-2">{currentVideo.description}</p>
              )}
              {currentVideo?.product && (
                <Link
                  to={`/products/${currentVideo.product.id}`}
                  className="mt-3 flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-lg p-2 hover:bg-white/30 transition-colors"
                >
                  <div className="w-12 h-12 rounded-lg bg-gray-700 overflow-hidden">
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
                    <p className="text-orange-400 text-sm font-bold">
                      {new Intl.NumberFormat('uz-UZ').format(currentVideo.product.price)} сум
                    </p>
                  </div>
                  <ShoppingBag className="w-5 h-5 text-white" />
                </Link>
              )}
            </div>

            <div className="flex flex-col items-center gap-4">
              <button
                onClick={() => toggleLike(currentVideo?.id || '')}
                className="flex flex-col items-center"
              >
                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                  likes[currentVideo?.id || ''] ? 'bg-red-500' : 'bg-white/20'
                }`}>
                  <Heart className={`w-6 h-6 ${likes[currentVideo?.id || ''] ? 'text-white fill-white' : 'text-white'}`} />
                </div>
                <span className="text-white text-xs mt-1">{currentVideo?.likesCount || 0}</span>
              </button>

              <button
                onClick={() => setShowComments(true)}
                className="flex flex-col items-center"
              >
                <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
                  <MessageCircle className="w-6 h-6 text-white" />
                </div>
                <span className="text-white text-xs mt-1">{currentVideo?.commentsCount || 0}</span>
              </button>

              <button onClick={handleShare} className="flex flex-col items-center">
                <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
                  <Share2 className="w-6 h-6 text-white" />
                </div>
                <span className="text-white text-xs mt-1">Share</span>
              </button>

              <button onClick={toggleMute} className="flex flex-col items-center">
                <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
                  {isMuted ? (
                    <VolumeX className="w-6 h-6 text-white" />
                  ) : (
                    <Volume2 className="w-6 h-6 text-white" />
                  )}
                </div>
              </button>
            </div>
          </div>
        </div>

        <div className="absolute right-4 top-1/2 -translate-y-1/2 flex flex-col gap-2">
          <button
            onClick={handlePrevious}
            disabled={currentIndex === 0}
            className={`w-10 h-10 rounded-full flex items-center justify-center ${
              currentIndex === 0 ? 'bg-white/10 text-gray-500' : 'bg-white/20 text-white hover:bg-white/30'
            }`}
          >
            <ChevronUp className="w-6 h-6" />
          </button>
          <button
            onClick={handleNext}
            disabled={currentIndex === videos.length - 1}
            className={`w-10 h-10 rounded-full flex items-center justify-center ${
              currentIndex === videos.length - 1 ? 'bg-white/10 text-gray-500' : 'bg-white/20 text-white hover:bg-white/30'
            }`}
          >
            <ChevronDown className="w-6 h-6" />
          </button>
        </div>

        {!isPlaying && (
          <button
            onClick={togglePlay}
            className="absolute inset-0 flex items-center justify-center"
          >
            <div className="w-20 h-20 rounded-full bg-white/30 flex items-center justify-center">
              <Play className="w-10 h-10 text-white ml-1" />
            </div>
          </button>
        )}

        <div className="absolute top-4 right-4 text-white text-sm bg-black/50 px-2 py-1 rounded">
          {currentIndex + 1} / {videos.length}
        </div>
      </div>

      {showComments && currentVideo && (
        <div className="fixed inset-0 bg-black/50 z-30" onClick={() => setShowComments(false)}>
          <div
            className="absolute bottom-0 left-0 right-0 max-h-[70vh] bg-white rounded-t-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 border-b flex items-center justify-between">
              <h3 className="font-semibold">Комментарии</h3>
              <button
                onClick={() => setShowComments(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                Закрыть
              </button>
            </div>
            <div className="overflow-y-auto max-h-[calc(70vh-60px)]">
              <VideoComments videoId={currentVideo.id} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
