const ffmpeg = require('ffmpeg-static');
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const videosDir = path.join(__dirname, 'public', 'videos');

// Videos to convert
const videos = [
  { input: 'IMG_0859.MOV', output: 'IMG_0859.mp4' },
  { input: 'IMG_0950.MOV', output: 'IMG_0950.mp4' },
  { input: 'IMG_0949.MOV', output: 'IMG_0949.mp4' },
];

console.log('🎬 Starting video conversion...\n');
console.log(`📁 Videos directory: ${videosDir}\n`);

let successCount = 0;
let failCount = 0;

videos.forEach((video, index) => {
  const inputPath = path.join(videosDir, video.input);
  const outputPath = path.join(videosDir, video.output);
  
  console.log(`[${index + 1}/${videos.length}] Converting ${video.input} → ${video.output}`);
  
  // Check if input file exists
  if (!fs.existsSync(inputPath)) {
    console.log(`   ⚠️  Input file not found, skipping...\n`);
    failCount++;
    return;
  }
  
  // Get input file size
  const inputStats = fs.statSync(inputPath);
  const inputSizeMB = (inputStats.size / (1024 * 1024)).toFixed(2);
  console.log(`   📥 Input size: ${inputSizeMB} MB`);
  
  const startTime = Date.now();
  
  try {
    // Run FFmpeg conversion
    const command = `"${ffmpeg}" -i "${inputPath}" -c:v libx264 -c:a aac -crf 23 -preset medium -y "${outputPath}"`;
    
    console.log(`   ⚙️  Converting...`);
    execSync(command, { stdio: 'inherit' });
    
    const endTime = Date.now();
    const duration = ((endTime - startTime) / 1000).toFixed(1);
    
    // Check output file
    if (fs.existsSync(outputPath)) {
      const outputStats = fs.statSync(outputPath);
      const outputSizeMB = (outputStats.size / (1024 * 1024)).toFixed(2);
      const savings = ((1 - outputStats.size / inputStats.size) * 100).toFixed(1);
      
      console.log(`   📤 Output size: ${outputSizeMB} MB`);
      console.log(`   ⏱️  Time: ${duration}s`);
      if (savings > 0) {
        console.log(`   📉 Size reduction: ${savings}%`);
      }
      console.log(`   ✅ SUCCESS!\n`);
      successCount++;
    } else {
      console.log(`   ❌ FAILED - Output file not created\n`);
      failCount++;
    }
  } catch (error) {
    console.log(`   ❌ FAILED - ${error.message}\n`);
    failCount++;
  }
});

console.log('═══════════════════════════════════════');
console.log('🎉 Conversion Complete!');
console.log(`   ✅ Success: ${successCount}`);
console.log(`   ❌ Failed: ${failCount}`);
console.log('═══════════════════════════════════════\n');

if (successCount === videos.length) {
  console.log('🚀 All videos converted successfully!');
  console.log('📝 Next steps:');
  console.log('   1. Test locally: npm run dev');
  console.log('   2. Commit changes: git add . && git commit -m "feat: Convert videos to MP4"');
  console.log('   3. Push to GitHub: git push origin master');
  console.log('');
  process.exit(0);
} else {
  console.log('⚠️  Some conversions failed. Check the errors above.');
  process.exit(1);
}
