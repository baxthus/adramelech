import db from 'database';
import { feedbacks, phrases, profiles } from 'database/schemas/schema';

export type HomeStats = {
  totalPhrases: number;
  totalProfiles: number;
  totalFeedbacks: number;
};

export default defineEventHandler(async (): Promise<HomeStats> => {
  return await Promise.all([
    db.$count(phrases),
    db.$count(profiles),
    db.$count(feedbacks),
  ]).then(([totalPhrases, totalProfiles, totalFeedbacks]) => ({
    totalPhrases,
    totalProfiles,
    totalFeedbacks,
  }));
});
