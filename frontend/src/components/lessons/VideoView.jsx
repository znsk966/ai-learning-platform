import React, { useState, useEffect, useRef } from 'react';
import ReactPlayer from 'react-player';
import ReadingView from './ReadingView';

// Helper function to extract YouTube video ID
const getYouTubeVideoId = (url) => {
  if (!url) return null;
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : null;
};

// Helper function to get YouTube embed URL
const getYouTubeEmbedUrl = (url) => {
  const videoId = getYouTubeVideoId(url);
  if (!videoId) return null;
  return `https://www.youtube.com/embed/${videoId}`;
};

const VideoView = ({ url, textContent }) => {
  const [hasError, setHasError] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const playerRef = useRef(null);

  // Check if URL is YouTube - use iframe directly for better compatibility
  const isYouTube = url && (url.includes('youtube.com') || url.includes('youtu.be'));
  const embedUrl = isYouTube ? getYouTubeEmbedUrl(url) : null;

  useEffect(() => {
    // Log the URL for debugging
    if (url) {
      console.log('Video URL:', url);
      console.log('Is YouTube:', isYouTube);
      console.log('ReactPlayer can play this URL:', ReactPlayer.canPlay(url));
    } else {
      console.warn('No video URL provided to VideoView');
    }
  }, [url, isYouTube]);

  const handleError = (error) => {
    console.error('Video player error:', error);
    setHasError(true);
  };

  const handleReady = () => {
    console.log('Video is ready - onReady called');
    setIsReady(true);
  };

  const handleStart = () => {
    console.log('Video started playing');
    setIsReady(true); // Also set ready when video starts
  };

  const handleClickPreview = () => {
    console.log('User clicked video preview/thumbnail');
    setIsReady(true); // Set ready when user clicks to load video
  };

  const handlePlay = () => {
    console.log('Video play event');
    setIsPlaying(true);
  };

  const handlePause = () => {
    console.log('Video pause event');
    setIsPlaying(false);
  };

  const handleProgress = (state) => {
    if (!isReady && state.loaded > 0) {
      console.log('Video progress detected - setting ready');
      setIsReady(true);
    }
  };

  return (
    <div>
      {/* Video Player Section */}
      {url ? (
        <div className="mb-8 rounded-lg overflow-hidden shadow-lg bg-gray-900">
          <div className="relative" style={{ paddingBottom: '56.25%' }}> {/* 16:9 aspect ratio */}
            {hasError ? (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-800 text-white p-8">
                <div className="text-center">
                  <svg className="w-16 h-16 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  <p className="text-lg font-semibold mb-2">Unable to load video</p>
                  <p className="text-sm text-gray-400 mb-4">The video URL may be invalid or unavailable.</p>
                  <a 
                    href={url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-400 hover:text-blue-300 underline"
                  >
                    Open video in new tab
                  </a>
                </div>
              </div>
            ) : isYouTube && embedUrl ? (
              // Direct YouTube iframe embed (more reliable than ReactPlayer for YouTube)
              <iframe
                src={embedUrl}
                title="Video player"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
                className="absolute top-0 left-0 w-full h-full"
                onLoad={() => {
                  console.log('YouTube iframe loaded successfully');
                  setIsReady(true);
                }}
                onError={() => {
                  console.error('YouTube iframe failed to load');
                  setHasError(true);
                }}
              />
            ) : (
              // Use ReactPlayer for non-YouTube videos (Vimeo, etc.)
              <div className="absolute top-0 left-0 w-full h-full">
                <ReactPlayer
                  ref={playerRef}
                  url={url}
                  width="100%"
                  height="100%"
                  controls={true}
                  pip={isReady}
                  playing={false}
                  onError={handleError}
                  onReady={handleReady}
                  onStart={handleStart}
                  onPlay={handlePlay}
                  onPause={handlePause}
                  onProgress={handleProgress}
                  style={{ position: 'absolute', top: 0, left: 0 }}
                  config={{
                    youtube: {
                      playerVars: {
                        autoplay: 0,
                        controls: 1,
                        rel: 0,
                        modestbranding: 1,
                        enablejsapi: 1,
                        origin: window.location.origin,
                      },
                    },
                    vimeo: {
                      playerOptions: {
                        autoplay: false,
                        controls: true,
                      },
                    },
                  }}
                />
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="mb-8 rounded-lg bg-yellow-50 border border-yellow-200 p-6">
          <p className="text-yellow-800">
            <strong>No video URL provided.</strong> This lesson should include a video, but no video URL was found.
          </p>
        </div>
      )}

      {/* Accompanying Text Section */}
      {textContent && (
        <div className="mt-8">
          <ReadingView content={textContent} />
        </div>
      )}
    </div>
  );
};

export default VideoView;