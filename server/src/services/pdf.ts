import pdf from 'pdf-parse';

export interface ParsedPDF {
  text: string;
  pageCount: number;
  pages: string[];
}

export async function parsePDF(buffer: Buffer): Promise<ParsedPDF> {
  const data = await pdf(buffer);
  
  // Split text by page (approximate - pdf-parse doesn't give exact page boundaries)
  const pages = splitTextIntoPages(data.text, data.numpages);
  
  return {
    text: data.text,
    pageCount: data.numpages,
    pages,
  };
}

function splitTextIntoPages(text: string, pageCount: number): string[] {
  // Simple heuristic: split by approximate equal parts
  // In production, you'd want more sophisticated page detection
  const avgCharsPerPage = Math.ceil(text.length / pageCount);
  const pages: string[] = [];
  
  let currentIndex = 0;
  for (let i = 0; i < pageCount; i++) {
    const endIndex = Math.min(currentIndex + avgCharsPerPage, text.length);
    
    // Try to find a natural break point (paragraph or sentence)
    let breakPoint = endIndex;
    if (endIndex < text.length) {
      const paragraphBreak = text.lastIndexOf('\n\n', endIndex);
      const sentenceBreak = text.lastIndexOf('. ', endIndex);
      
      if (paragraphBreak > currentIndex + avgCharsPerPage * 0.5) {
        breakPoint = paragraphBreak + 2;
      } else if (sentenceBreak > currentIndex + avgCharsPerPage * 0.5) {
        breakPoint = sentenceBreak + 2;
      }
    }
    
    pages.push(text.slice(currentIndex, breakPoint).trim());
    currentIndex = breakPoint;
  }
  
  return pages;
}
