import { MoodRecord, MoodStats } from '../types';

export function calculateMoodStats(records: MoodRecord[]): MoodStats {
  if (!records || records.length === 0) {
    return {
      averageMood: 0,
      averageAnxiety: 0,
      totalCheckins: 0,
      topEmotions: [],
      weeklyData: [],
    };
  }

  const totalCheckins = records.length;
  const sumMood = records.reduce((acc, r) => acc + r.mood, 0);
  const sumAnxiety = records.reduce((acc, r) => acc + r.anxietyLevel, 0);

  const averageMood = Number((sumMood / totalCheckins).toFixed(1));
  const averageAnxiety = Number((sumAnxiety / totalCheckins).toFixed(1));

  // Count emotions
  const emotionCountMap: Record<string, number> = {};
  records.forEach((r) => {
    r.emotions?.forEach((emo) => {
      emotionCountMap[emo] = (emotionCountMap[emo] || 0) + 1;
    });
  });

  const topEmotions = Object.entries(emotionCountMap)
    .map(([emotion, count]) => ({ emotion, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  // Group by last 7 days
  const daysOfWeek = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
  const now = new Date();
  const weeklyData = [];

  for (let i = 6; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(now.getDate() - i);
    const dayLabel = daysOfWeek[d.getDay()];
    const dateStr = d.toISOString().split('T')[0];

    const dayRecords = records.filter((r) => r.createdAt.startsWith(dateStr));
    const dayMoodAvg =
      dayRecords.length > 0
        ? dayRecords.reduce((acc, r) => acc + r.mood, 0) / dayRecords.length
        : 0;
    const dayAnxietyAvg =
      dayRecords.length > 0
        ? dayRecords.reduce((acc, r) => acc + r.anxietyLevel, 0) / dayRecords.length
        : 0;

    weeklyData.push({
      day: dayLabel,
      date: dateStr,
      mood: Number(dayMoodAvg.toFixed(1)),
      anxiety: Number(dayAnxietyAvg.toFixed(1)),
    });
  }

  return {
    averageMood,
    averageAnxiety,
    totalCheckins,
    topEmotions,
    weeklyData,
  };
}
