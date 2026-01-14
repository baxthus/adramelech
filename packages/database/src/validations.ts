import { feedbackStatusEnum } from './schema';
import { type } from 'arktype';

export const PhraseCreate = type({
  content: 'string > 0',
  source: 'string > 0',
});

export const FeedbackStatus = type.enumerated(...feedbackStatusEnum.enumValues);
