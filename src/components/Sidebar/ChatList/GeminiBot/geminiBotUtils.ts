import { GEMINI_BOT_CONFIG } from './geminiBotConfig';

/**
 * Determines if the Gemini bot should be visible based on search criteria
 */
export const filterGeminiBotBySearch = (searchValue: string): boolean => {
  if (!searchValue) return true;
  if (GEMINI_BOT_CONFIG.alwaysVisible) return true;

  const lowerSearch = searchValue.toLowerCase();
  return GEMINI_BOT_CONFIG.searchTerms.some(
    (term) => term.includes(lowerSearch) || lowerSearch.includes(term)
  );
};
