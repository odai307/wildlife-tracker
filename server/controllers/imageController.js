const fs = require('fs').promises;
const path = require('path');
const os = require('os');
const crypto = require('crypto');
const { spawn } = require('child_process');

const handleUpload = async (req, res) => {
  let tempFilePath = null;
  
  try {
    console.log('=== Upload request received ===');
    console.log('Request headers:', req.headers);
    
    const file = req.file;
    if (!file) {
      console.log('No file in request');
      return res.status(400).json({ error: 'No image file uploaded' });
    }

    console.log('File details:', {
      originalname: file.originalname,
      mimetype: file.mimetype,
      size: file.size
    });

    // Generate a unique temporary filename
    const tempFileName = crypto.randomBytes(16).toString('hex') + path.extname(file.originalname);
    tempFilePath = path.join(os.tmpdir(), tempFileName);

    console.log('Writing temp file to:', tempFilePath);

    // Write buffer to a temporary file (using async/await)
    await fs.writeFile(tempFilePath, file.buffer);
    
    console.log('Temp file created successfully');

    // Spawn Python script - try python3 first, then python
    const pythonCommand = process.platform === 'win32' ? 'python' : 'python3';
    console.log('Starting Python process with command:', pythonCommand);
    
    const python = spawn(pythonCommand, [path.join(__dirname, '../classify.py'), tempFilePath]);

    let stdout = '';
    let stderr = '';

    python.stdout.on('data', (data) => {
      const output = data.toString();
      console.log('Python stdout chunk:', output);
      stdout += output;
    });

    python.stderr.on('data', (data) => {
      const errorOutput = data.toString();
      console.log('Python stderr chunk:', errorOutput);
      stderr += errorOutput;
    });

    python.on('error', (error) => {
      console.error('Failed to start Python process:', error);
      cleanupTempFile(tempFilePath);
      return res.status(500).json({
        error: 'Failed to start Python classification process',
        details: error.message
      });
    });

    python.on('close', async (code) => {
      console.log('Python process finished with code:', code);
      console.log('Final stdout:', stdout);
      console.log('Final stderr:', stderr);
      
      // Always clean up temp file
      await cleanupTempFile(tempFilePath);

      if (code !== 0) {
        console.error('Python script failed with code:', code);
        return res.status(500).json({
          error: 'Image classification failed',
          stderr,
          exitCode: code
        });
      }

      try {
        const trimmedOutput = stdout.trim();
        console.log('Parsing Python output:', trimmedOutput);
        
        if (!trimmedOutput) {
          return res.status(500).json({
            error: 'No output from Python script',
            stderr
          });
        }
        
        const prediction = JSON.parse(trimmedOutput);
        console.log('Parsed prediction:', prediction);
        
        // Check if the prediction contains an error from Python
        if (prediction.error) {
          return res.status(500).json({
            error: 'Classification error',
            details: prediction.error
          });
        }
        
        console.log('Sending successful response');
        return res.status(200).json({ prediction });
      } catch (parseErr) {
        console.error('Failed to parse Python output:', parseErr);
        console.error('Raw output was:', stdout);
        return res.status(500).json({
          error: 'Invalid response from Python script',
          rawOutput: stdout,
          parseError: parseErr.message
        });
      }
    });

  } catch (err) {
    console.error('Unexpected error in image upload controller:', err);
    if (tempFilePath) {
      await cleanupTempFile(tempFilePath);
    }
    res.status(500).json({ 
      error: 'Unexpected error during image classification',
      details: err.message 
    });
  }
};

// Helper function to clean up temp files
async function cleanupTempFile(filePath) {
  try {
    await fs.unlink(filePath);
    console.log('Temp file deleted:', filePath);
  } catch (unlinkErr) {
    console.warn('Could not delete temp file:', filePath, unlinkErr.message);
  }
}

module.exports = handleUpload;