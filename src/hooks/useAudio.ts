import { useEffect, useState } from 'react';
import { Audio } from 'expo-av';
import { logger } from '../utils/logger';

export function useAudio(audioUrl?: string) {
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [durationMs, setDurationMs] = useState(0);
  const [positionMs, setPositionMs] = useState(0);
  const [volume, setVolume] = useState(1.0);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    let currentSound: Audio.Sound | null = null;

    async function loadAudio() {
      if (!audioUrl) return;

      try {
        await Audio.setAudioModeAsync({
          playsInSilentModeIOS: true,
          staysActiveInBackground: false,
          shouldDuckAndroid: true,
        });

        const { sound: soundObj } = await Audio.Sound.createAsync(
          { uri: audioUrl },
          { shouldPlay: false, volume: 1.0 },
          (playbackStatus) => {
            if (playbackStatus.isLoaded) {
              setPositionMs(playbackStatus.positionMillis);
              setDurationMs(playbackStatus.durationMillis || 0);
              setIsPlaying(playbackStatus.isPlaying);
              if (playbackStatus.didJustFinish) {
                setIsPlaying(false);
                setPositionMs(0);
              }
            }
          }
        );

        currentSound = soundObj;
        setSound(soundObj);
        setIsLoaded(true);
      } catch (error) {
        logger.warn('Could not load audio file:', error);
      }
    }

    loadAudio();

    return () => {
      if (currentSound) {
        currentSound.unloadAsync().catch(() => {});
      }
    };
  }, [audioUrl]);

  const play = async () => {
    if (sound && isLoaded) {
      try {
        await sound.playAsync();
        setIsPlaying(true);
      } catch (error) {
        logger.error('Error playing sound:', error);
      }
    } else {
      setIsPlaying(true);
    }
  };

  const pause = async () => {
    if (sound && isLoaded) {
      try {
        await sound.pauseAsync();
        setIsPlaying(false);
      } catch (error) {
        logger.error('Error pausing sound:', error);
      }
    } else {
      setIsPlaying(false);
    }
  };

  const togglePlayPause = () => {
    if (isPlaying) {
      pause();
    } else {
      play();
    }
  };

  const seek = async (millis: number) => {
    if (sound && isLoaded) {
      try {
        await sound.setPositionAsync(Math.max(0, Math.min(millis, durationMs)));
      } catch (error) {
        logger.error('Error seeking audio:', error);
      }
    } else {
      setPositionMs(millis);
    }
  };

  const changeVolume = async (val: number) => {
    const clamped = Math.max(0, Math.min(1, val));
    setVolume(clamped);
    if (sound && isLoaded) {
      try {
        await sound.setVolumeAsync(clamped);
      } catch (error) {
        logger.error('Error changing volume:', error);
      }
    }
  };

  return {
    isPlaying,
    isLoaded,
    positionMs,
    durationMs,
    volume,
    play,
    pause,
    togglePlayPause,
    seek,
    changeVolume,
  };
}
