"use client";
import React, { useState, useCallback, useEffect, useRef } from "react";
import WaveSurfer from "wavesurfer.js";
import { Play, Pause } from "lucide-react";
import { useAudio } from "@/context/AudioContext";

interface AudioPlayerProps {
  src: string;
  callId?: number;
  callNumber?: string;
  transcript?: string;
  isHeaderPlayer?: boolean;
  cardId?: string;
  isComplaint?: boolean;
}

const AudioPlayer: React.FC<AudioPlayerProps> = ({
  src,
  callId,
  callNumber,
  transcript,
  isHeaderPlayer = false,
  cardId,
  isComplaint = false
}) => {
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [locallyPlaying, setLocallyPlaying] = useState(false);
  const waveformRef = useRef<HTMLDivElement>(null);
  const wavesurferRef = useRef<WaveSurfer | null>(null);
  const { currentAudio, setCurrentAudio, isPlaying, setIsPlaying } = useAudio();

  // Check if this audio player is currently the active one
  const isCurrentlyPlaying = currentAudio?.src === src && isPlaying;

  const getProxiedUrl = (url: string) => {
    if (url.startsWith('/') || url.startsWith('data:')) {
      return url;
    }
    return `/api/audio?url=${encodeURIComponent(url)}`;
  };

  // Format time in MM:SS format
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Removed redundant stopAllAudio reaction to prevent immediate self-pause on play

  useEffect(() => {
    if (!waveformRef.current) return;

    const wavesurfer = WaveSurfer.create({
      container: waveformRef.current,
      waveColor: '#666',
      progressColor: '#fff',
      cursorColor: '#fff',
      cursorWidth: 2,
      barWidth: 3,
      barGap: 1,
      height: 64,
      normalize: true,
      backend: 'WebAudio',
      interact: true, // Allow clicking on waveform to seek
    });

    wavesurferRef.current = wavesurfer;
    
    // Add data attribute for better stopping detection
    if (waveformRef.current) {
      waveformRef.current.setAttribute('data-wavesurfer', 'true');
      (waveformRef.current as any).wavesurfer = wavesurfer;
    }
    
    const proxiedUrl = getProxiedUrl(src);
    wavesurfer.load(proxiedUrl);

    wavesurfer.on('ready', () => {
      setIsLoading(false);
      setError(null);
      setDuration(wavesurfer.getDuration());
    });

    wavesurfer.on('error', (err) => {
      console.error('Wavesurfer error:', err);
      setError('Failed to load audio. Please try again.');
      setIsLoading(false);
    });

    wavesurfer.on('play', () => {
      if (!isHeaderPlayer && !isComplaint && callId && callNumber && transcript) {
        setCurrentAudio({ id: callId, src, callNumber, transcript, cardId });
      }
      setIsPlaying(true);
      setLocallyPlaying(true);
    });

    wavesurfer.on('pause', () => {
      // Only the globally active audio should toggle the global playing state
      if (currentAudio?.src === src) {
        setIsPlaying(false);
      }
      setLocallyPlaying(false);
    });

    wavesurfer.on('finish', () => {
      if (currentAudio?.src === src) {
        setIsPlaying(false);
      }
      setCurrentTime(0);
      if (!isHeaderPlayer && currentAudio?.src === src) {
        setCurrentAudio(null);
      }
      setLocallyPlaying(false);
    });

    // Update current time during playback
    wavesurfer.on('audioprocess', () => {
      setCurrentTime(wavesurfer.getCurrentTime());
    });

    // Update time when user clicks on waveform
    wavesurfer.on('interaction', () => {
      setCurrentTime(wavesurfer.getCurrentTime());
    });

    return () => {
      try {
        // Clean up data attributes
        if (waveformRef.current) {
          waveformRef.current.removeAttribute('data-wavesurfer');
          delete (waveformRef.current as any).wavesurfer;
        }
        
        // Stop and destroy wavesurfer
        if (wavesurfer.isPlaying && wavesurfer.isPlaying()) {
          wavesurfer.pause();
        }
        wavesurfer.destroy();
        setLocallyPlaying(false);
      } catch (error) {
        console.error('Error cleaning up wavesurfer:', error);
      }
    };
  }, [src, callId, isHeaderPlayer, callNumber, transcript, cardId, isComplaint]);

  useEffect(() => {
    if (!wavesurferRef.current) return;

    const isThisCurrentAudio = currentAudio?.src === src;
    const actuallyPlaying = wavesurferRef.current.isPlaying();

    // If this component corresponds to the globally selected audio and global state says playing, ensure it's playing
    if (isThisCurrentAudio && isPlaying && !actuallyPlaying) {
      wavesurferRef.current.play();
    }

    // If this component is NOT the globally selected audio but is currently playing, pause it
    if (!isThisCurrentAudio && actuallyPlaying) {
      wavesurferRef.current.pause();
    }
  }, [isPlaying, currentAudio, src]);

  const handlePlayPause = () => {
    if (!wavesurferRef.current) {
      setError("Audio player not initialized");
      return;
    }
    
    try {
      const actuallyPlaying = wavesurferRef.current.isPlaying();
      if (locallyPlaying || actuallyPlaying) {
        // If currently playing, pause it
        wavesurferRef.current.pause();
      } else {
        // Mark this as the current audio and play. Others will pause via the sync effect.
        if (!isHeaderPlayer && !isComplaint && callId && callNumber && transcript) {
          setCurrentAudio({ id: callId, src, callNumber, transcript, cardId });
        }
        wavesurferRef.current.play();
      }
    } catch (err) {
      setError("Failed to toggle playback");
      console.error("Playback error:", err);
    }
  };

  // Enhanced seek function for skip buttons
  const seekRelative = (seconds: number) => {
    if (!wavesurferRef.current) return;
    const currentTime = wavesurferRef.current.getCurrentTime();
    const newTime = Math.max(0, Math.min(duration, currentTime + seconds));
    wavesurferRef.current.seekTo(newTime / duration);
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Waveform */}
      <div className="w-full">
        <div ref={waveformRef} className="w-full h-16" />
      </div>

      {/* Progress Bar and Time */}
      <div className="flex items-center gap-4">
        <span className="text-sm text-gray-400 min-w-[40px]">{formatTime(currentTime)}</span>
        <div className="flex-1 h-1 bg-gray-600 rounded-full relative">
          <div 
            className="h-1 bg-white rounded-full" 
            style={{ width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%` }}
          />
        </div>
        <span className="text-sm text-gray-400 min-w-[40px]">-{formatTime(duration - currentTime)}</span>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-6">
        {/* Rewind 15s */}
        <button
          onClick={() => seekRelative(-15)}
          className="w-12 h-12 rounded-full border-2 border-gray-400 hover:border-white flex items-center justify-center text-gray-400 hover:text-white transition-colors disabled:opacity-50"
          disabled={!wavesurferRef.current || isLoading || !!error}
        >
          <div className="relative flex items-center justify-center">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="rotate-180">
              <path d="M8 5v14l11-7z" fill="currentColor"/>
            </svg>
            <span className="absolute -bottom-2 text-xs font-bold">15</span>
          </div>
        </button>

        {/* Play/Pause */}
        <button
          onClick={handlePlayPause}
          className="w-16 h-16 rounded-full bg-white hover:bg-gray-100 flex items-center justify-center text-black transition-colors disabled:opacity-50"
          disabled={!wavesurferRef.current || isLoading || !!error}
        >
          {isLoading ? (
            <div className="w-6 h-6 border-2 border-black border-t-transparent rounded-full animate-spin" />
          ) : locallyPlaying ? (
            <Pause size={24} />
          ) : (
            <Play size={24} className="ml-1" />
          )}
        </button>

        {/* Forward 15s */}
        <button
          onClick={() => seekRelative(15)}
          className="w-12 h-12 rounded-full border-2 border-gray-400 hover:border-white flex items-center justify-center text-gray-400 hover:text-white transition-colors disabled:opacity-50"
          disabled={!wavesurferRef.current || isLoading || !!error}
        >
          <div className="relative flex items-center justify-center">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M8 5v14l11-7z" fill="currentColor"/>
            </svg>
            <span className="absolute -bottom-2 text-xs font-bold">15</span>
          </div>
        </button>
      </div>

      {error && (
        <p className="text-red-500 text-xs text-center">{error}</p>
      )}
    </div>
  );
};

export default AudioPlayer;
