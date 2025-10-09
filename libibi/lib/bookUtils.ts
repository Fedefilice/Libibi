// Utility functions for book parsing that can be used on both client and server

/**
 * Parses book titles from the LLM response format: {"raccomandazioni": [{"titolo": "...", "autore": "..."}]}
 * @param responseText - The response text from the LLM
 * @returns Array of book titles
 */
export function parseBookTitles(responseText: string): string[] {
  try {
    // First, try to clean the response text from code blocks
    let cleanText = responseText.trim();
    
    // Remove markdown code blocks if present
    cleanText = cleanText.replace(/```json\s*/, '').replace(/```\s*$/, '');
    
    // Find the JSON object in the text
    const jsonMatch = cleanText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return [];
    }
    
    const jsonString = jsonMatch[0];
    
    const response = JSON.parse(jsonString);
    
    // Check for new format: {"raccomandazioni": [{"titolo": "...", "autore": "..."}]}
    if (response.raccomandazioni && Array.isArray(response.raccomandazioni)) {
      const titles = response.raccomandazioni.map((book: any) => {
        if (book && typeof book.titolo === 'string') {
          return book.titolo.trim();
        }
        return '';
      }).filter((title: string) => title.length > 0);
      
      return titles;
    }
    
    // Fallback 1: Check for old object format: {"1":"titolo1, autore1", "2":"titolo2, autore2", ...}
    if (typeof response === 'object' && !Array.isArray(response) && !response.raccomandazioni) {
      return Object.values(response).map(entry => {
        if (typeof entry !== 'string') return '';
        // Extract just the title part (before the comma)
        const titlePart = (entry as string).split(',')[0].trim();
        return titlePart;
      }).filter(title => title.length > 0);
    }
    
    // Fallback 2: Check if response is a direct array
    if (Array.isArray(response)) {
      return response.map(entry => {
        if (typeof entry === 'object' && entry.titolo) {
          return entry.titolo.trim();
        } else if (typeof entry === 'string') {
          const titlePart = entry.split(',')[0].trim();
          return titlePart;
        }
        return '';
      }).filter(title => title.length > 0);
    }
    
    return [];
  } catch (error) {
    console.error('Error parsing book titles from new format:', error);
    
    // Final fallback to old semicolon format
    const match = responseText.match(/\[([^\]]+)\]/);
    if (!match) return [];
    
    return match[1].split(";").map(title => title.trim()).filter(title => title.length > 0);
  }
}