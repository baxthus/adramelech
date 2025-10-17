'use server';
import { isAuthenticated } from '@/utils/auth';
import type { PhraseInsert } from 'database/schemas/schema';
import PhraseService from 'database/services/PhraseService';

export async function getPhrases(searchTerm?: string) {
  isAuthenticated();

  return await PhraseService.getPhrases(searchTerm);
}

export async function addPhrase(data: PhraseInsert) {
  isAuthenticated();

  await PhraseService.addPhrase(data);
}

export async function deletePhrase(id: number) {
  isAuthenticated();

  await PhraseService.deletePhrase(id);
}
