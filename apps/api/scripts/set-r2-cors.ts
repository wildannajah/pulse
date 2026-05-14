/**
 * Sets the CORS policy on the R2 bucket so browsers can PUT files directly
 * via presigned URLs from any allowed frontend origin.
 *
 * Run once (or whenever ALLOWED_ORIGINS changes):
 *   pnpm dotenv -e .env -- npx tsx scripts/set-r2-cors.ts
 *
 * Required env vars: R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET_NAME
 * Optional: ALLOWED_ORIGINS (comma-separated, defaults to localhost + Vercel preview pattern)
 */
import { PutBucketCorsCommand, S3Client } from "@aws-sdk/client-s3";

const accountId = process.env.R2_ACCOUNT_ID!;
const accessKeyId = process.env.R2_ACCESS_KEY_ID!;
const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY!;
const bucket = process.env.R2_BUCKET_NAME!;

// Override by setting ALLOWED_ORIGINS="https://yourapp.com,https://other.com"
const defaultOrigins = [
  "http://localhost:3000",
  "http://localhost:3001",
  "https://pulse-web-omega.vercel.app",
  "https://*.vercel.app",
];

const origins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(",").map((o) => o.trim())
  : defaultOrigins;

const client = new S3Client({
  region: "auto",
  endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
  forcePathStyle: true,
  credentials: { accessKeyId, secretAccessKey },
});

async function run() {
  console.log(`Bucket  : ${bucket}`);
  console.log(`Origins : ${origins.join(", ")}\n`);

  await client.send(
    new PutBucketCorsCommand({
      Bucket: bucket,
      CORSConfiguration: {
        CORSRules: [
          {
            // Browser → R2 direct upload via presigned PUT
            AllowedOrigins: origins,
            AllowedMethods: ["PUT"],
            AllowedHeaders: ["Content-Type", "Content-Length", "x-amz-checksum-crc32"],
            MaxAgeSeconds: 3600,
          },
          {
            // Optional: allow GET/HEAD for signed reads (e.g. private preview URLs)
            AllowedOrigins: origins,
            AllowedMethods: ["GET", "HEAD"],
            AllowedHeaders: [],
            MaxAgeSeconds: 3600,
          },
        ],
      },
    }),
  );

  console.log("✓ CORS policy applied successfully.");
  console.log(
    "\nNote: if uploads still fail, check that R2_BUCKET_NAME in your environment\n" +
      "is set to just the bucket name (e.g. `pulse`), not the full KEY=VALUE pair.",
  );
}

run().catch((err) => {
  console.error("\n✗ Failed to set CORS policy:", err.message);
  process.exit(1);
});
