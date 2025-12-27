import type { FeedbackStatus } from 'database/types';

export const feedbackFinalStates: Array<FeedbackStatus> = [
  'REJECTED',
  'RESOLVED',
  'CLOSED',
];

export const statusTransitions = new Map<FeedbackStatus, FeedbackStatus[]>([
  ['OPEN', ['ACKNOWLEDGED']],
  ['ACKNOWLEDGED', ['CLOSED', 'ACCEPTED', 'REJECTED']],
  ['ACCEPTED', ['RESOLVED']],
]);
