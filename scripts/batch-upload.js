/**
 * BATCH UPLOAD HELPER
 * File: scripts/batch-upload.js
 * 
 * Upload multiple sections at once from a config file
 * Usage: node scripts/batch-upload.js --config upload-config.json
 */

import { readFile } from 'fs/promises';
import { uploadPipeline } from './upload-simulations.js';

// ===== BATCH UPLOAD FUNCTION =====

async function batchUpload(configPath) {
  console.log('='.repeat(60));
  console.log('BATCH UPLOAD PIPELINE');
  console.log('='.repeat(60));
  
  try {
    // Read config file
    const configFile = await readFile(configPath, 'utf-8');
    const config = JSON.parse(configFile);
    
    console.log(`Loaded config: ${config.uploads.length} batch(es)\n`);
    
    let totalUploaded = 0;
    let totalFailed = 0;
    
    // Process each upload batch
    for (let i = 0; i < config.uploads.length; i++) {
      const batch = config.uploads[i];
      
      console.log(`\n${'='.repeat(60)}`);
      console.log(`BATCH ${i + 1}/${config.uploads.length}: ${batch.name}`);
      console.log('='.repeat(60));
      
      try {
        await uploadPipeline({
          coursePath: batch.path,
          courseId: batch.courseId,
          sectionId: batch.sectionId
        });
        
        totalUploaded++;
      } catch (error) {
        console.error(`Failed to upload batch ${i + 1}:`, error.message);
        totalFailed++;
      }
      
      // Wait between batches to avoid rate limits
      if (i < config.uploads.length - 1) {
        console.log('\nWaiting 2 seconds before next batch...');
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
    
    // Final summary
    console.log('\n' + '='.repeat(60));
    console.log('BATCH UPLOAD COMPLETE');
    console.log('='.repeat(60));
    console.log(`Total batches: ${config.uploads.length}`);
    console.log(`Successful: ${totalUploaded}`);
    console.log(`Failed: ${totalFailed}`);
    console.log('='.repeat(60));
    
  } catch (error) {
    console.error('FATAL ERROR:', error);
    process.exit(1);
  }
}

// ===== CLI INTERFACE =====

async function main() {
  const args = process.argv.slice(2);
  
  let configPath = null;
  
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--config' && args[i + 1]) {
      configPath = args[i + 1];
    }
  }
  
  if (!configPath) {
    console.log(`
Usage: node scripts/batch-upload.js --config <config-file>

Example:
  node scripts/batch-upload.js --config upload-config.json

Config file format (upload-config.json):
{
  "uploads": [
    {
      "name": "AWS Compute Services",
      "courseId": "aws",
      "sectionId": "aws-sec-003",
      "path": "./simulations/aws/compute"
    },
    {
      "name": "AWS Storage Services",
      "courseId": "aws",
      "sectionId": "aws-sec-004",
      "path": "./simulations/aws/storage"
    }
  ]
}
    `);
    process.exit(1);
  }
  
  await batchUpload(configPath);
}

main();

export { batchUpload };
