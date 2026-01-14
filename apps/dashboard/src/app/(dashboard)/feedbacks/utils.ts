import { FeedbackStatusInfer } from '@repo/database/types';

export const FeedbackStatusClasses: Record<FeedbackStatusInfer, string> = {
  OPEN: 'bg-blue-500 text-white dark:bg-blue-600',
  ACKNOWLEDGED: 'bg-yellow-400 text-black dark:bg-yellow-500',
  CLOSED: 'bg-gray-500 text-white dark:bg-gray-600',
  RESOLVED: 'bg-green-500 text-white dark:bg-green-600',
  ACCEPTED: 'bg-purple-500 text-white dark:bg-purple-600',
  REJECTED: 'bg-red-500 text-white dark:bg-red-600',
};
