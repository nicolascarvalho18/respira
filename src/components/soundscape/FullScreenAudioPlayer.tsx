import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Modal,
  Platform,
  ScrollView,
  useWindowDimensions,
} from 'react-native';
import {
  ChevronDown,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Bookmark,
  Volume2,
  VolumeX,
  Shuffle,
  Repeat,
  Repeat1,
  Clock,
  ListMusic,
  Sparkles,
  Check,
  Music,
} from 'lucide-react-native';
import { useMusicStore } from '../../store/musicStore';
import { useSoundscapeStore } from '../../store/soundscapeStore';
import { useTheme } from '../../hooks/useTheme';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../ui/Toast';
import { MusicTrack } from '../../types';

interface FullScreenAudioPlayerProps {
  visible: boolean;
  onClose: () => void;
}

export const FullScreenAudioPlayer: React.FC<FullScreenAudioPlayerProps> = ({
  visible,
  onClose,
}) => {
  const { user } = useAuth();
  const { colors, isDark } = useTheme();
  const { width, height } = useWindowDimensions();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState<'player' | 'queue'>('player');
  const [showTimerPicker, setShowTimerPicker] = useState(false);

  const {
    currentTrack,
    isPlaying,
    positionSeconds,
    durationSeconds,
    volume,
    isShuffle,
    repeatMode,
    timerMinutes,
    remainingTimerSeconds,
    favoriteTrackIds,
    queue,
    tracks,
    togglePlayPause,
    nextTrack,
    prevTrack,
    seekTo,
    setVolume,
    toggleShuffle,
    cycleRepeatMode,
    setTimer,
    toggleFavorite,
    playTrack,
  } = useMusicStore();

  const isFavorite = currentTrack ? favoriteTrackIds.includes(currentTrack.id) : false;

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const progressPercent = useMemo(() => {
    if (!durationSeconds || durationSeconds <= 0) return 0;
    return Math.min(100, Math.max(0, (positionSeconds / durationSeconds) * 100));
  }, [positionSeconds, durationSeconds]);

  const handleSeekPress = (e: any) => {
    if (Platform.OS === 'web' && durationSeconds > 0) {
      const rect = e.currentTarget.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const pct = Math.max(0, Math.min(1, clickX / rect.width));
      seekTo(Math.floor(pct * durationSeconds));
    }
  };

  const handleToggleFavorite = async () => {
    if (!currentTrack) return;
    if (!user?.id) {
      showToast({ message: 'Entre na sua conta para salvar favoritos.', type: 'info' });
      return;
    }
    const res = await toggleFavorite(currentTrack.id, user.id);
    showToast({
      message: res?.message || (isFavorite ? 'Removido dos favoritos' : 'Adicionado aos favoritos'),
      type: 'info',
    });
  };

  if (!visible || !currentTrack) return null;

  const bgGradientColor = isDark
    ? '#131D24'
    : '#F2F8F6';

  const accentColor = '#247B74';

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={onClose}
    >
      <View
        style={[
          styles.container,
          {
            backgroundColor: bgGradientColor,
          },
        ]}
      >
        {/* Top Header */}
        <View style={styles.topHeader}>
          <TouchableOpacity
            onPress={onClose}
            style={styles.headerBtn}
            accessibilityRole="button"
            accessibilityLabel="Minimizar player"
          >
            <ChevronDown size={28} color={isDark ? colors.text : '#1F2927'} />
          </TouchableOpacity>

          <View style={styles.headerTitleWrap}>
            <Text style={[styles.headerSubtitle, { color: isDark ? colors.textMuted : '#5F736E' }]}>
              TOCANDO DE
            </Text>
            <Text style={[styles.headerTitle, { color: isDark ? colors.text : '#1F2927' }]} numberOfLines={1}>
              {currentTrack.categoryLabel}
            </Text>
          </View>

          <TouchableOpacity
            onPress={() => setActiveTab(activeTab === 'player' ? 'queue' : 'player')}
            style={[
              styles.headerBtn,
              activeTab === 'queue' && { backgroundColor: isDark ? '#1C3833' : '#EDF7F5' },
            ]}
            accessibilityRole="button"
            accessibilityLabel="Fila de reprodução"
          >
            <ListMusic
              size={22}
              color={activeTab === 'queue' ? accentColor : isDark ? colors.text : '#1F2927'}
            />
          </TouchableOpacity>
        </View>

        {/* Conteúdo Principal: Player ou Fila */}
        {activeTab === 'queue' ? (
          <View style={styles.queueContainer}>
            <View style={styles.queueHeaderRow}>
              <Text style={[styles.queueTitle, { color: isDark ? colors.text : '#1F2927' }]}>
                Fila de Reprodução ({queue.length || tracks.length} faixas)
              </Text>
              <TouchableOpacity
                onPress={() => setActiveTab('player')}
                style={styles.queueCloseBtn}
              >
                <Text style={{ color: accentColor, fontWeight: '600', fontSize: 13 }}>Voltar</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.queueList} showsVerticalScrollIndicator={false}>
              {(queue.length > 0 ? queue : tracks).map((item, idx) => {
                const isItemCurrent = item.id === currentTrack.id;
                return (
                  <TouchableOpacity
                    key={`${item.id}-${idx}`}
                    onPress={() => {
                      playTrack(item, 0);
                      setActiveTab('player');
                    }}
                    style={[
                      styles.queueItemCard,
                      {
                        backgroundColor: isItemCurrent
                          ? isDark ? '#1C3833' : '#EDF7F5'
                          : isDark ? colors.surface : '#FFFFFF',
                        borderColor: isItemCurrent ? accentColor : isDark ? colors.border : '#E5ECE9',
                      },
                    ]}
                  >
                    <Image source={{ uri: item.thumbnailUrl }} style={styles.queueItemThumb} resizeMode="cover" />
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <Text
                        style={[
                          styles.queueItemTitle,
                          { color: isItemCurrent ? accentColor : isDark ? colors.text : '#1F2927' },
                        ]}
                        numberOfLines={1}
                      >
                        {item.title}
                      </Text>
                      <Text style={[styles.queueItemArtist, { color: isDark ? colors.textMuted : '#68736F' }]} numberOfLines={1}>
                        {item.artist} · {formatTime(item.durationSeconds)}
                      </Text>
                    </View>
                    {isItemCurrent && (
                      <View style={styles.queueNowPlayingBadge}>
                        <Music size={14} color="#FFFFFF" />
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        ) : (
          <ScrollView
            contentContainerStyle={[
              styles.playerScrollContent,
              { minHeight: height - 100 },
            ]}
            showsVerticalScrollIndicator={false}
          >
            {/* Capa Centralizada */}
            <View style={styles.coverWrapper}>
              <Image
                source={{ uri: currentTrack.thumbnailUrl }}
                style={[styles.largeCover, { width: Math.min(width - 64, 320), height: Math.min(width - 64, 320) }]}
                resizeMode="cover"
              />
            </View>

            {/* Título e Botão de Favoritar */}
            <View style={styles.trackInfoRow}>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text
                  accessibilityRole="header"
                  aria-level={2}
                  style={[styles.mainTrackTitle, { color: isDark ? colors.text : '#172826' }]}
                  numberOfLines={2}
                >
                  {currentTrack.title}
                </Text>
                <Text style={[styles.mainTrackArtist, { color: isDark ? colors.textMuted : '#5F736E' }]}>
                  {currentTrack.artist} · {currentTrack.categoryLabel}
                </Text>
              </View>

              <TouchableOpacity
                onPress={handleToggleFavorite}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                style={[
                  styles.favCircleBtn,
                  {
                    backgroundColor: isDark ? colors.surfaceSecondary : '#E8EFECE0',
                  },
                ]}
                accessibilityRole="button"
                accessibilityLabel={isFavorite ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
              >
                <Bookmark
                  size={22}
                  color={accentColor}
                  fill={isFavorite ? accentColor : 'transparent'}
                />
              </TouchableOpacity>
            </View>

            {/* Barra de Progresso Clicável */}
            <View style={styles.progressContainer}>
              <TouchableOpacity
                activeOpacity={1}
                onPress={handleSeekPress}
                style={styles.progressBarTouchArea}
              >
                <View style={[styles.progressBarTrack, { backgroundColor: isDark ? '#2D3B39' : '#DFE5E2' }]}>
                  <View style={[styles.progressBarFill, { width: `${progressPercent}%`, backgroundColor: accentColor }]} />
                </View>
              </TouchableOpacity>

              <View style={styles.timeLabelsRow}>
                <Text style={[styles.timeText, { color: isDark ? colors.textMuted : '#68736F' }]}>
                  {formatTime(positionSeconds)}
                </Text>
                <Text style={[styles.timeText, { color: isDark ? colors.textMuted : '#68736F' }]}>
                  {formatTime(durationSeconds)}
                </Text>
              </View>
            </View>

            {/* Controles de Reprodução Principais */}
            <View style={styles.mainControlsRow}>
              <TouchableOpacity
                onPress={toggleShuffle}
                style={[
                  styles.auxCtrlBtn,
                  isShuffle && { backgroundColor: isDark ? '#1C3833' : '#EDF7F5' },
                ]}
                accessibilityRole="button"
                accessibilityLabel={isShuffle ? 'Modo aleatório ativado' : 'Ativar modo aleatório'}
              >
                <Shuffle size={20} color={isShuffle ? accentColor : isDark ? colors.textMuted : '#768884'} />
              </TouchableOpacity>

              <TouchableOpacity
                onPress={prevTrack}
                style={styles.skipCtrlBtn}
                accessibilityRole="button"
                accessibilityLabel="Faixa anterior"
              >
                <SkipBack size={26} color={isDark ? colors.text : '#1F2927'} />
              </TouchableOpacity>

              <TouchableOpacity
                onPress={togglePlayPause}
                style={[styles.bigPlayBtn, { backgroundColor: accentColor }]}
                accessibilityRole="button"
                accessibilityLabel={isPlaying ? 'Pausar reprodução' : 'Iniciar reprodução'}
              >
                {isPlaying ? (
                  <Pause size={28} color="#FFFFFF" />
                ) : (
                  <Play size={28} color="#FFFFFF" style={{ marginLeft: 3 }} />
                )}
              </TouchableOpacity>

              <TouchableOpacity
                onPress={nextTrack}
                style={styles.skipCtrlBtn}
                accessibilityRole="button"
                accessibilityLabel="Próxima faixa"
              >
                <SkipForward size={26} color={isDark ? colors.text : '#1F2927'} />
              </TouchableOpacity>

              <TouchableOpacity
                onPress={cycleRepeatMode}
                style={[
                  styles.auxCtrlBtn,
                  repeatMode !== 'off' && { backgroundColor: isDark ? '#1C3833' : '#EDF7F5' },
                ]}
                accessibilityRole="button"
                accessibilityLabel={`Repetição: ${repeatMode}`}
              >
                {repeatMode === 'one' ? (
                  <Repeat1 size={20} color={accentColor} />
                ) : (
                  <Repeat
                    size={20}
                    color={repeatMode === 'all' ? accentColor : isDark ? colors.textMuted : '#768884'}
                  />
                )}
              </TouchableOpacity>
            </View>

            {/* Controle de Volume e Timer de Sono */}
            <View style={[styles.bottomToolsCard, { backgroundColor: isDark ? colors.surface : '#FFFFFF', borderColor: isDark ? colors.border : '#E0E7E4' }]}>
              {/* Slider / Linha de Volume */}
              <View style={styles.volumeRow}>
                <TouchableOpacity
                  onPress={() => setVolume(volume > 0 ? 0 : 0.8)}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  {volume === 0 ? (
                    <VolumeX size={18} color={accentColor} />
                  ) : (
                    <Volume2 size={18} color={accentColor} />
                  )}
                </TouchableOpacity>

                <View style={styles.volumePresetsGroup}>
                  {[0.25, 0.5, 0.75, 1.0].map((v) => {
                    const isSel = Math.abs(volume - v) < 0.05;
                    return (
                      <TouchableOpacity
                        key={v}
                        onPress={() => setVolume(v)}
                        style={[
                          styles.volPresetChip,
                          isSel && { backgroundColor: accentColor },
                          !isSel && { backgroundColor: isDark ? '#233230' : '#EDF4F2' },
                        ]}
                      >
                        <Text
                          style={[
                            styles.volPresetText,
                            isSel ? { color: '#FFFFFF', fontWeight: '700' } : { color: isDark ? colors.textMuted : '#5F736E' },
                          ]}
                        >
                          {Math.round(v * 100)}%
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              {/* Botão de Temporizador de Sono */}
              <View style={styles.timerRow}>
                <TouchableOpacity
                  onPress={() => setShowTimerPicker(!showTimerPicker)}
                  style={[
                    styles.timerTriggerBtn,
                    timerMinutes !== null && { backgroundColor: isDark ? '#1C3833' : '#EDF7F5' },
                  ]}
                >
                  <Clock size={16} color={timerMinutes ? accentColor : isDark ? colors.textMuted : '#70837F'} />
                  <Text
                    style={[
                      styles.timerTriggerText,
                      { color: timerMinutes ? accentColor : isDark ? colors.text : '#1F2927' },
                    ]}
                  >
                    {remainingTimerSeconds !== null
                      ? `Desliga em ${Math.ceil(remainingTimerSeconds / 60)} min`
                      : 'Temporizador de sono'}
                  </Text>
                </TouchableOpacity>
              </View>

              {showTimerPicker && (
                <View style={styles.timerOptionsRow}>
                  {[
                    { label: '5 min', val: 5 },
                    { label: '15 min', val: 15 },
                    { label: '30 min', val: 30 },
                    { label: '45 min', val: 45 },
                    { label: '60 min', val: 60 },
                    { label: 'Desativar', val: null },
                  ].map((opt) => (
                    <TouchableOpacity
                      key={opt.label}
                      onPress={() => {
                        setTimer(opt.val);
                        setShowTimerPicker(false);
                      }}
                      style={[
                        styles.timerOptionPill,
                        timerMinutes === opt.val && { backgroundColor: accentColor },
                        timerMinutes !== opt.val && { backgroundColor: isDark ? '#233230' : '#EDF4F2' },
                      ]}
                    >
                      <Text
                        style={[
                          styles.timerOptionText,
                          timerMinutes === opt.val ? { color: '#FFFFFF', fontWeight: '700' } : { color: isDark ? colors.textMuted : '#5F736E' },
                        ]}
                      >
                        {opt.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
          </ScrollView>
        )}
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 52 : 20,
    paddingBottom: 12,
  },
  headerBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitleWrap: {
    alignItems: 'center',
    flex: 1,
    paddingHorizontal: 8,
  },
  headerSubtitle: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.2,
    marginBottom: 2,
  },
  headerTitle: {
    fontSize: 14.5,
    fontWeight: '700',
  },
  playerScrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 40,
    justifyContent: 'center',
  },
  coverWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 20,
  },
  largeCover: {
    borderRadius: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  trackInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
    gap: 12,
  },
  mainTrackTitle: {
    fontSize: 21,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  mainTrackArtist: {
    fontSize: 14.5,
    marginTop: 4,
  },
  favCircleBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressContainer: {
    marginBottom: 24,
  },
  progressBarTouchArea: {
    paddingVertical: 8,
  },
  progressBarTrack: {
    width: '100%',
    height: 5,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  timeLabelsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  timeText: {
    fontSize: 12,
    fontWeight: '500',
  },
  mainControlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 28,
  },
  auxCtrlBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  skipCtrlBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bigPlayBtn: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#247B74',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  bottomToolsCard: {
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    gap: 12,
  },
  volumeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  volumePresetsGroup: {
    flexDirection: 'row',
    gap: 6,
  },
  volPresetChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  volPresetText: {
    fontSize: 11.5,
  },
  timerRow: {
    alignItems: 'center',
  },
  timerTriggerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  timerTriggerText: {
    fontSize: 13,
    fontWeight: '600',
  },
  timerOptionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    justifyContent: 'center',
    paddingTop: 6,
  },
  timerOptionPill: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
  },
  timerOptionText: {
    fontSize: 12,
  },
  queueContainer: {
    flex: 1,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  queueHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginVertical: 14,
  },
  queueTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  queueCloseBtn: {
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  queueList: {
    flex: 1,
  },
  queueItemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 8,
    gap: 12,
  },
  queueItemThumb: {
    width: 44,
    height: 44,
    borderRadius: 8,
  },
  queueItemTitle: {
    fontSize: 14,
    fontWeight: '600',
  },
  queueItemArtist: {
    fontSize: 12,
    marginTop: 2,
  },
  queueNowPlayingBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#247B74',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
