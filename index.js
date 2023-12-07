const express = require('express');
const fs = require('fs');
const path = require('path');
const apikey = require('./config.js')
const app = express();
const cors = require('cors');
const port = 3050;

app.use(cors());
app.use(express.raw({ limit: '50mb', type: 'image/jpeg' }));

app.use((req, res, next) => {
  if (req.method === 'DELETE' || req.method === 'PUT') {
    const apiKeyHeader = req.header('api-key');

    if (!apiKeyHeader || apiKeyHeader !== apikey) {
      return res.status(401).send('Unauthorized');
    }
  }

  next();
});

app.head('/content', (req, res) => {
  const filePath = req.query.path;

  if (!filePath) {
    return res.status(400).send('File path is missing');
  }

  const fullPath = path.join(__dirname, 'cdn', filePath);

  fs.exists(fullPath, (exists) => {
    if (exists) {
      res.status(200).end();
    } else {
      res.status(404).end();
    }
  });
});

app.get('/content', (req, res) => {
  const filePath = req.query.path;

  if (!filePath) {
    return res.status(400).send('File path is missing');
  }

  const fullPath = path.join(__dirname, 'cdn', filePath);

  fs.exists(fullPath, (exists) => {
    if (exists) {
      res.sendFile(fullPath);
    } else {
      res.status(404).send('File not found');
    }
  });
});

app.put('/content', (req, res) => {
  const filePath = req.query.path;

  if (!filePath) {
    return res.status(400).send('File path is missing');
  }

  const fullPath = path.join(__dirname, 'cdn', filePath);
  const fileContent = req.body;

  const directoryPath = path.dirname(fullPath);

  // Create parent and children directories if they don't exist
  fs.mkdirSync(directoryPath, { recursive: true }, (err) => {
    if (err) {
      console.error(`Error creating directories: ${err.message}`);
      return res.status(500).send('Internal Server Error');
    }
  });

  fs.writeFile(fullPath, fileContent, 'binary', (err) => {
    if (err) {
      console.error(`Error writing file: ${err.message}`);
      return res.status(500).send('Internal Server Error');
    }

    console.log(`File updated successfully at ${fullPath}`);
    res.status(200).send('File updated successfully');
  });
});

app.delete('/content', (req, res) => {
  const filePath = req.query.path;

  if (!filePath) {
    return res.status(400).send('File path is missing');
  }

  const fullPath = path.join(__dirname, 'cdn', filePath);

  fs.exists(fullPath, (exists) => {
    if (exists) {
      fs.unlink(fullPath, (err) => {
        if (err) {
          console.error(`Error deleting file: ${err.message}`);
          return res.status(500).send('Internal Server Error');
        }
        console.log(`File deleted successfully at ${fullPath}`);
        res.status(200).end();
      });
    } else {
      res.status(404).send('File not found');
    }
  });
});

app.listen(port, () => {
  console.log(`File server listening at http://localhost:${port}`);
});
