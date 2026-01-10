import type { FeedbackStatusInfer } from 'database/types';

export const feedbackFinalStates: Array<FeedbackStatusInfer> = [
  'REJECTED',
  'RESOLVED',
  'CLOSED',
];

export const statusTransitions = new Map<
  FeedbackStatusInfer,
  FeedbackStatusInfer[]
>([
  ['OPEN', ['ACKNOWLEDGED']],
  ['ACKNOWLEDGED', ['CLOSED', 'ACCEPTED', 'REJECTED']],
  ['ACCEPTED', ['RESOLVED']],
]);
