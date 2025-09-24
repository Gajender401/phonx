"use client";
import React, { useState, useCallback, useEffect, useRef } from "react";
import WaveSurfer from "wavesurfer.js";
import { useAudio } from "@/context/AudioContext";
import { useTheme } from "@/context/ThemeContext";

interface AudioPlayerProps {
  src: string;
  callId?: number;
  callNumber?: string;
  transcript?: string;
  isHeaderPlayer?: boolean;
  cardId?: string;
  isComplaint?: boolean;
}

// Note: Custom SVG icons are now loaded from public/icons folder

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
  const { resolvedTheme } = useTheme();

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
      waveColor: resolvedTheme === 'dark' ? '#E4E4E496' : '#D0AEF5A3',
      progressColor: '#9653DB',
      cursorColor: '#9653DB',
      cursorWidth: 2,
      barWidth: 2,
      barGap: 1,
      height: 25,
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
  }, [src, callId, isHeaderPlayer, callNumber, transcript, cardId, isComplaint, resolvedTheme]);

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

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-1 bg-transparent rounded-2xl px-2 py-1.5">
        <button
          onClick={handlePlayPause}
          className=" transition-colors disabled:opacity-50 p-1"
          disabled={!wavesurferRef.current || isLoading || !!error}
        >
          {isLoading ? (
            <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          ) : locallyPlaying ? (
            <img
              src={resolvedTheme === 'dark' ? "/icons/pause-dark.svg" : "/icons/pause-light.svg"}
              alt="Pause"
              className="w-4 h-4"
            />
          ) : (
            <img
              src={resolvedTheme === 'dark' ? "/icons/play-dark.svg" : "/icons/play-light.svg"}
              alt="Play"
              className="w-4 h-4"
            />
          )}
        </button>
        <div ref={waveformRef} className="flex-1" />
        {/* Time display */}
        <div className="text-xs text-gray-600 min-w-[70px] text-right ml-1">
          {formatTime(currentTime)} / {formatTime(duration)}
        </div>
      </div>
      {error && (
        <p className="text-red-500 text-xs">{error}</p>
      )}
    </div>
  );
};

export default AudioPlayer;