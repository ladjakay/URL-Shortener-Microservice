require('dotenv').config();
const bodyParser = require('body-parser');
const express = require('express');
const cors = require('cors');
const dns = require('dns');
const app = express();

// Basic Configuration
const port = process.env.PORT || 3000;
const shortUrls = new Map();
let nextShortUrl = 1;

app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));

app.use('/public', express.static(`${process.cwd()}/public`));

app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

// Your first API endpoint
app.get('/api/hello', function(req, res) {
  res.json({ greeting: 'hello API' });
});

app.post('/api/shorturl', function(req, res) {
  let originalUrl;
  let submittedUrl;

  try {
    if (typeof req.body.url !== 'string') {
      throw new TypeError('URL must be a string');
    }

    originalUrl = req.body.url;
    submittedUrl = new URL(req.body.url);
  } catch {
    return res.json({ error: 'invalid url' });
  }

  if (
    !['http:', 'https:'].includes(submittedUrl.protocol) ||
    !submittedUrl.hostname
  ) {
    return res.json({ error: 'invalid url' });
  }

  dns.lookup(submittedUrl.hostname, function(error) {
    if (error) {
      return res.json({ error: 'invalid url' });
    }

    const shortUrl = nextShortUrl++;
    shortUrls.set(shortUrl, originalUrl);

    return res.json({
      original_url: originalUrl,
      short_url: shortUrl
    });
  });
});

app.get('/api/shorturl/:short_url', function(req, res) {
  const shortUrl = Number(req.params.short_url);
  const originalUrl = shortUrls.get(shortUrl);

  if (!Number.isInteger(shortUrl) || !originalUrl) {
    return res.status(404).json({ error: 'short url not found' });
  }

  return res.redirect(originalUrl);
});

app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});
