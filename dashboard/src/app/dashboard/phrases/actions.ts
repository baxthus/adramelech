'use server';
import { isAuthenticated } from '@/utils/auth';
import PhraseService from 'database/services/PhraseService';

export async function getPhrases(searchTerm?: string) {
  isAuthenticated();

  return await PhraseService.getPhrases(searchTerm);
}

export async function deletePhrase(id: number) {
  isAuthenticated();

  await PhraseService.deletePhrase(id);
}
