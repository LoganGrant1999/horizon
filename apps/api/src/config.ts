import 'dotenv/config';

export const config = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '4000', 10),
  databaseUrl: process.env.DATABASE_URL!,
  webUrl: process.env.WEB_URL || 'http://localhost:5173',
  sessionSecret: process.env.SESSION_SECRET || 'change-me-in-production-please',
  sessionMaxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  googleClientId: process.env.GOOGLE_CLIENT_ID,
  googleClientSecret: process.env.GOOGLE_CLIENT_SECRET,
  s3Endpoint: process.env.S3_ENDPOINT || 'http://localhost:9000',
  s3AccessKey: process.env.S3_ACCESS_KEY || 'minioadmin',
  s3SecretKey: process.env.S3_SECRET_KEY || 'minioadmin',
  s3Bucket: process.env.S3_BUCKET || 'health-heatmap',
  s3Region: process.env.S3_REGION || 'us-east-1',
  openaiApiKey: process.env.OPENAI_API_KEY,
};