
const express = require('express');
const cors = require('cors');
const { spawn } = require('child_process');
const path = require('path');

const app = express();
const port = 8080;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// API endpoint to trigger the minting (file upload) process
app.post('/api/mint', (req, res) => {
    console.log('Received /api/mint request');

    // For now, we trigger the main script.
    // We will refine this to call specific functions later.
    const tsx = spawn('pnpm', ['run', 'dev']);

    let output = '';
    let errorOutput = '';

    tsx.stdout.on('data', (data) => {
        console.log(`stdout: ${data}`);
        output += data.toString();
    });

    tsx.stderr.on('data', (data) => {
        console.error(`stderr: ${data}`);
        errorOutput += data.toString();
    });

    tsx.on('close', (code) => {
        console.log(`child process exited with code ${code}`);
        if (code !== 0) {
            return res.status(500).json({
                message: "Script execution failed.",
                error: errorOutput,
                output: output,
            });
        }
        res.json({
            message: "Minting process initiated successfully!",
            output: output,
        });
    });
});

// Serve the main page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});
