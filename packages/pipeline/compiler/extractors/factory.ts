type ExtractionResult = {
  text: string;
  metadata?: Record<string, unknown>;
};

export interface Extractor {
  extract(file: Buffer): Promise<ExtractionResult>;
}

class TextExtractor implements Extractor {
  async extract(file: Buffer): Promise<ExtractionResult> {
    const text = file.toString('utf-8');
    return { text, metadata: { contentType: 'text/plain' } };
  }
}

class HtmlExtractor implements Extractor {
  async extract(file: Buffer): Promise<ExtractionResult> {
    const html = file.toString('utf-8');
    const text = html.replace(/<[^>]+>/g, ' ');
    return { text, metadata: { contentType: 'text/html' } };
  }
}

class MarkdownExtractor implements Extractor {
  async extract(file: Buffer): Promise<ExtractionResult> {
    const markdown = file.toString('utf-8');
    const text = markdown.replace(/[#_*`>-]/g, ' ');
    return { text, metadata: { contentType: 'text/markdown' } };
  }
}

class PdfExtractor implements Extractor {
  async extract(file: Buffer): Promise<ExtractionResult> {
    const text = file.toString('utf-8');
    return { text, metadata: { contentType: 'application/pdf' } };
  }
}

export class ExtractorFactory {
  getExtractor(filename: string): Extractor {
    const lower = filename.toLowerCase();
    if (lower.endsWith('.pdf')) return new PdfExtractor();
    if (lower.endsWith('.html') || lower.endsWith('.htm')) return new HtmlExtractor();
    if (lower.endsWith('.md') || lower.endsWith('.markdown')) return new MarkdownExtractor();
    return new TextExtractor();
  }
}
