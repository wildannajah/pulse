/**
 * Quick R2 connectivity test — run with:
 *   pnpm dotenv -e .env -- npx tsx scripts/test-r2.ts
 *
 * Checks: presign PUT → upload → public GET → delete
 */
import { DeleteObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const accountId = process.env.R2_ACCOUNT_ID!;
const accessKeyId = process.env.R2_ACCESS_KEY_ID!;
const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY!;
const bucket = process.env.R2_BUCKET_NAME!;
const cdnBase = process.env.R2_PUBLIC_URL!.replace(/\/$/, "");

const client = new S3Client({
  region: "auto",
  endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
  credentials: { accessKeyId, secretAccessKey },
});

const key = `_test/${crypto.randomUUID()}.txt`;
const body = "pulse-r2-test-ok";

async function run() {
  console.log(`Bucket : ${bucket}`);
  console.log(`CDN    : ${cdnBase}`);
  console.log(`Key    : ${key}\n`);

  // 1. Presign PUT
  const uploadUrl = await getSignedUrl(
    client,
    new PutObjectCommand({ Bucket: bucket, Key: key, ContentType: "text/plain" }),
    { expiresIn: 60 },
  );
  console.log("✓ Presigned PUT URL generated");

  // 2. Upload
  const putRes = await fetch(uploadUrl, {
    method: "PUT",
    headers: { "Content-Type": "text/plain" },
    body,
  });
  if (!putRes.ok) throw new Error(`PUT failed: ${putRes.status} ${await putRes.text()}`);
  console.log("✓ Upload succeeded");

  // 3. Public GET
  const publicUrl = `${cdnBase}/${key}`;
  const getRes = await fetch(publicUrl);
  if (!getRes.ok) {
    console.warn(
      `⚠  Public GET returned ${getRes.status} — bucket may not have public access enabled`,
    );
  } else {
    const text = await getRes.text();
    if (text !== body) throw new Error(`Content mismatch: "${text}"`);
    console.log("✓ Public URL readable");
  }

  // 4. Delete test object
  await client.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
  console.log("✓ Test object deleted\n");

  console.log("R2 integration is working correctly.");
}

run().catch((err) => {
  console.error("\n✗ R2 test failed:", err.message);
  process.exit(1);
});
