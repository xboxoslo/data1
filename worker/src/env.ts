export interface Env {
  DATA: R2Bucket;
  ENVIRONMENT: string;
  GSC_CLIENT_ID?: string;
  GSC_CLIENT_SECRET?: string;
  GSC_REFRESH_TOKEN?: string;
  ANTHROPIC_API_KEY?: string;
  OPENAI_API_KEY?: string;
  PERPLEXITY_API_KEY?: string;
  GEMINI_API_KEY?: string;
}
