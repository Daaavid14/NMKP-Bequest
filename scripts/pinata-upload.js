import "dotenv/config";

/**
 * ============================================================================
 * NOMEKOP BEQUEST — Pinata IPFS Upload Script
 * ============================================================================
 *
 * Uploads all Pokemon GIF assets & metadata JSON to IPFS via Pinata.
 *
 * Prerequisites:
 *   1. Create a free account at https://app.pinata.cloud/register
 *   2. Go to API Keys → New Key → Admin → Create
 *   3. Copy the JWT and your gateway domain into .env:
 *        PINATA_JWT=eyJ...
 *        PINATA_GATEWAY=your-gateway.mypinata.cloud
 *
 * Usage:
 *   npm run upload              # full upload
 *   npm run upload -- --dry-run # list what would be uploaded
 * ============================================================================
 */

import { PinataSDK } from "pinata";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

// ── helpers for __dirname in ESM ──────────────────────────────────────────────
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..");

// ── configuration ─────────────────────────────────────────────────────────────
const PINATA_JWT = process.env.PINATA_JWT;
const PINATA_GATEWAY = process.env.PINATA_GATEWAY;

if (!PINATA_JWT || !PINATA_GATEWAY) {
  console.error(
    "\n  ✗ Missing PINATA_JWT or PINATA_GATEWAY in .env\n\n" +
      "  1. Sign up free at https://app.pinata.cloud/register\n" +
      "  2. Create an API key (API Keys → New Key → Admin)\n" +
      "  3. Copy your gateway domain from the Gateways tab\n" +
      "  4. Add both to your .env file:\n\n" +
      "     PINATA_JWT=eyJhbGciOi...\n" +
      "     PINATA_GATEWAY=your-gateway.mypinata.cloud\n"
  );
  process.exit(1);
}

const pinata = new PinataSDK({
  pinataJwt: PINATA_JWT,
  pinataGateway: PINATA_GATEWAY,
});

const FOLDERS = ["baseForm", "secondForm", "thirdForm"];
const ASSETS_DIR = path.join(ROOT, "assets");
const METADATA_DIR = path.join(ROOT, "metadata");
const CIDS_OUTPUT = path.join(METADATA_DIR, "cids.json");
const DRY_RUN = process.argv.includes("--dry-run");

// ============================================================================
// Utility helpers
// ============================================================================

/**
 * Upload a folder of files to Pinata as individual pins grouped by name.
 * Returns a map of { filename: cid } and the folder group CID.
 */
async function uploadFolder(folderPath, folderLabel) {
  const entries = fs.readdirSync(folderPath).sort();
  const fileCids = {};

  for (const fileName of entries) {
    const filePath = path.join(folderPath, fileName);
    if (!fs.statSync(filePath).isFile()) continue;

    const content = fs.readFileSync(filePath);
    const ext = path.extname(fileName).toLowerCase();
    const mimeTypes = {
      ".gif": "image/gif",
      ".png": "image/png",
      ".jpg": "image/jpeg",
      ".jpeg": "image/jpeg",
      ".json": "application/json",
      ".webp": "image/webp",
      ".svg": "image/svg+xml",
      ".mp4": "video/mp4",
    };
    const type = mimeTypes[ext] || "application/octet-stream";
    const file = new File([content], fileName, { type });

    console.log(`     ↗ ${fileName}`);
    const result = await pinata.upload.public.file(file);
    fileCids[fileName] = result.cid;
    console.log(`       ✓ ${result.cid}`);
  }

  return fileCids;
}

function header(text) {
  console.log(`\n${"═".repeat(60)}`);
  console.log(`  ${text}`);
  console.log(`${"═".repeat(60)}`);
}

// ============================================================================
// Main workflow
// ============================================================================

async function main() {
  header("NOMEKOP BEQUEST — Pinata IPFS Upload");

  if (DRY_RUN) {
    console.log("  ⚠  DRY-RUN mode — nothing will be uploaded.\n");
  }

  // Test auth
  console.log("\n  Testing Pinata connection…");
  try {
    const test = await pinata.testAuthentication();
    console.log(`  ✓ Authenticated! Welcome.\n`);
  } catch (err) {
    console.error("  ✗ Pinata auth failed:", err.message);
    console.error("    Check your PINATA_JWT in .env");
    process.exit(1);
  }

  const cidRecord = {
    uploadedAt: new Date().toISOString(),
    gateway: `https://${PINATA_GATEWAY}`,
    images: {},
    metadata: {},
  };

  // ────────────────────────────────────────────────────────────────────────
  // STEP 1 — Upload images from each folder
  // ────────────────────────────────────────────────────────────────────────
  header("STEP 1 · Upload Images");

  for (const folder of FOLDERS) {
    const folderPath = path.join(ASSETS_DIR, folder);

    if (!fs.existsSync(folderPath)) {
      console.warn(`  ⚠  Skipping missing folder: assets/${folder}`);
      continue;
    }

    const imageFiles = fs
      .readdirSync(folderPath)
      .filter((f) => /\.(gif|png|jpg|jpeg|webp|svg|mp4)$/i.test(f))
      .sort();

    console.log(`\n  📁 assets/${folder}/ — ${imageFiles.length} image(s)`);

    if (imageFiles.length === 0) continue;

    if (DRY_RUN) {
      imageFiles.forEach((f) => console.log(`     • ${f}`));
      cidRecord.images[folder] = {};
      imageFiles.forEach((f) => (cidRecord.images[folder][f] = "DRY_RUN"));
      continue;
    }

    cidRecord.images[folder] = await uploadFolder(
      folderPath,
      `images-${folder}`
    );
  }

  // ────────────────────────────────────────────────────────────────────────
  // STEP 2 — Update metadata JSON files with real image CIDs
  // ────────────────────────────────────────────────────────────────────────
  header("STEP 2 · Update Metadata with Image CIDs");

  const placeholderMap = {
    baseForm: "REPLACE_WITH_BASE_IMAGE_CID",
    secondForm: "REPLACE_WITH_SECOND_IMAGE_CID",
    thirdForm: "REPLACE_WITH_THIRD_IMAGE_CID",
  };

  const genericPlaceholders = [
    "REPLACE_WITH_IMAGE_CID",
    "REPLACE_WITH_CID",
    "YOUR_CID_HERE",
  ];

  for (const folder of FOLDERS) {
    const metaFolderPath = path.join(METADATA_DIR, folder);
    if (!fs.existsSync(metaFolderPath)) continue;

    const imageCids = cidRecord.images[folder];
    if (!imageCids || Object.values(imageCids)[0] === "DRY_RUN") {
      console.log(`  ⏭  Skipping metadata/${folder} (no image CIDs yet)`);
      continue;
    }

    const jsonFiles = fs
      .readdirSync(metaFolderPath)
      .filter((f) => f.endsWith(".json"))
      .sort();

    console.log(`\n  📁 metadata/${folder}/ — ${jsonFiles.length} file(s)`);

    for (const jsonFile of jsonFiles) {
      const filePath = path.join(metaFolderPath, jsonFile);
      let content = fs.readFileSync(filePath, "utf-8");
      let updated = false;

      // Find matching image CID for this pokemon
      // e.g., Pichu.json → Pichu.gif
      const baseName = path.basename(jsonFile, ".json");
      const matchingGif = `${baseName}.gif`;
      const imageCid = imageCids[matchingGif];

      if (imageCid) {
        // Replace the folder-specific placeholder with per-file CID
        const placeholder = placeholderMap[folder];
        if (placeholder && content.includes(placeholder)) {
          // Replace "ipfs://PLACEHOLDER/Name.gif" with "ipfs://CID"
          const oldPattern = `ipfs://${placeholder}/${matchingGif}`;
          const newValue = `ipfs://${imageCid}`;
          if (content.includes(oldPattern)) {
            content = content.replaceAll(oldPattern, newValue);
            updated = true;
          } else if (content.includes(placeholder)) {
            // Fallback: replace just the placeholder
            content = content.replaceAll(placeholder, imageCid);
            updated = true;
          }
        }

        // Replace any generic placeholders
        for (const gp of genericPlaceholders) {
          if (content.includes(gp)) {
            content = content.replaceAll(gp, imageCid);
            updated = true;
          }
        }
      }

      if (updated) {
        fs.writeFileSync(filePath, content, "utf-8");
        console.log(`     ✏  Updated ${jsonFile} → CID: ${imageCid}`);
      } else {
        console.log(`     ─  ${jsonFile} (no placeholders found, unchanged)`);
      }
    }
  }

  // ────────────────────────────────────────────────────────────────────────
  // STEP 3 — Upload metadata JSON files
  // ────────────────────────────────────────────────────────────────────────
  header("STEP 3 · Upload Metadata");

  for (const folder of FOLDERS) {
    const metaFolderPath = path.join(METADATA_DIR, folder);
    if (!fs.existsSync(metaFolderPath)) continue;

    const jsonFiles = fs
      .readdirSync(metaFolderPath)
      .filter((f) => f.endsWith(".json"))
      .sort();

    console.log(`\n  📁 metadata/${folder}/ — ${jsonFiles.length} file(s)`);

    if (jsonFiles.length === 0) continue;

    if (DRY_RUN) {
      jsonFiles.forEach((f) => console.log(`     • ${f}`));
      cidRecord.metadata[folder] = {};
      jsonFiles.forEach(
        (f) => (cidRecord.metadata[folder][f] = "DRY_RUN")
      );
      continue;
    }

    cidRecord.metadata[folder] = await uploadFolder(
      metaFolderPath,
      `metadata-${folder}`
    );
  }

  // ────────────────────────────────────────────────────────────────────────
  // STEP 4 — Save CID record
  // ────────────────────────────────────────────────────────────────────────
  header("STEP 4 · Save CID Record");

  fs.writeFileSync(CIDS_OUTPUT, JSON.stringify(cidRecord, null, 2), "utf-8");
  console.log(`\n  💾 Saved → metadata/cids.json`);

  // ────────────────────────────────────────────────────────────────────────
  // Summary
  // ────────────────────────────────────────────────────────────────────────
  header("Summary");

  for (const folder of FOLDERS) {
    const imgs = cidRecord.images[folder];
    const metas = cidRecord.metadata[folder];
    console.log(`\n  ${folder}:`);
    console.log(
      `    Images:   ${imgs ? Object.keys(imgs).length : 0} file(s)`
    );
    console.log(
      `    Metadata: ${metas ? Object.keys(metas).length : 0} file(s)`
    );
  }

  console.log(`\n  Gateway: https://${PINATA_GATEWAY}`);
  console.log(`  Example: https://${PINATA_GATEWAY}/ipfs/<CID>`);
  console.log(`\n  ✅ Done!\n`);
}

// ── run ───────────────────────────────────────────────────────────────────────
main().catch((err) => {
  console.error("\n  ✗ Upload failed:", err.message || err);
  process.exit(1);
});
