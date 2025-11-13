// updateRadars.js
// Télécharge le CSV officiel des radars (France) et écrit radars.geojson
// Usage: node updateRadars.js

const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');

const STATIC_CSV_URL = 'https://static.data.gouv.fr/resources/liste-des-radars-fixes-en-france/20241018-124508/jeu-de-donnees-liste-des-radars-fixes-en-france-2024-.csv';
const STABLE_API_URL  = 'https://www.data.gouv.fr/api/1/datasets/r/402aa4fe-86a9-4dcd-af88-23753e290a58';
const OUT_FILE = path.join(__dirname, 'radars.geojson');

// Choose which URL to use (static is usually direct). If you prefer stable api, change here.
const CSV_URL = STATIC_CSV_URL;

// --- utilitaires ---
function followRedirect(url, cb) {
  const client = url.startsWith('https:') ? https : http;
  client.get(url, res => {
    if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
      // follow redirect (absolute or relative)
      const next = res.headers.location.startsWith('http') ? res.headers.location : new URL(res.headers.location, url).toString();
      res.resume();
      followRedirect(next, cb);
      return;
    }
    if (res.statusCode !== 200) {
      cb(new Error('HTTP ' + res.statusCode));
      res.resume();
      return;
    }
    let raw = '';
    res.on('data', c => raw += c);
    res.on('end', () => cb(null, raw));
  }).on('error', err => cb(err));
}

function normalizeHeaderName(h) {
  if (!h) return '';
  // remove BOM
  h = h.replace(/^\uFEFF/, '');
  // lowercase
  h = h.toLowerCase();
  // remove accents
  const accents = { 'à':'a','á':'a','â':'a','ã':'a','ä':'a','å':'a','ç':'c','è':'e','é':'e','ê':'e','ë':'e','ì':'i','í':'i','î':'i','ï':'i','ñ':'n','ò':'o','ó':'o','ô':'o','õ':'o','ö':'o','ù':'u','ú':'u','û':'u','ü':'u','ý':'y','ÿ':'y' };
  h = h.replace(/[^\u0000-\u007E]/g, c => accents[c] || '');
  // remove non-alphanumeric
  h = h.replace(/[^a-z0-9]/g, '');
  return h;
}

// tries common names and returns index or -1
function findIndex(headerNorm, candidates) {
  for (let c of candidates) {
    const norm = c.toLowerCase().replace(/[^a-z0-9]/g,'');
    const idx = headerNorm.findIndex(h => h.includes(norm));
    if (idx !== -1) return idx;
  }
  return -1;
}

// --- MAIN ---
console.log('📡 Téléchargement du CSV des radars depuis :', CSV_URL);

followRedirect(CSV_URL, (err, csvText) => {
  if (err) {
    console.error('❌ Erreur téléchargement :', err.message);
    return;
  }

  if (!csvText || !csvText.trim()) {
    console.error('❌ Le fichier CSV est vide ou introuvable.');
    return;
  }

  // Normalize line endings and split
  const lines = csvText.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n').filter(Boolean);
  if (lines.length < 2) {
    console.error('❌ Fichier CSV trop court (pas de données).');
    return;
  }

  // Detect separator by inspecting header: prefer ';' if present, else ','
  const rawHeader = lines[0];
  const sep = rawHeader.includes(';') ? ';' : (rawHeader.includes(',') ? ',' : ';');
  // Build header normalized array
  const headerCols = rawHeader.split(sep).map(h => h.trim());
  const headerNorm = headerCols.map(normalizeHeaderName);

  // Find relevant indices
  const latIdx = findIndex(headerNorm, ['latitude','lat']);
  const lonIdx = findIndex(headerNorm, ['longitude','lon','long']);
  const numIdx = findIndex(headerNorm, ['numero','num','id']);
  const typeIdx = findIndex(headerNorm, ['type','typeradar']);
  const vmaIdx = findIndex(headerNorm, ['vma','vitesse','vitessekph','vitessevehiculeslegers']);

  if (latIdx === -1 || lonIdx === -1) {
    console.error('❌ Impossible de trouver les colonnes latitude/longitude dans l\'en-tête CSV.');
    console.log('En-tête détectée :', headerCols);
    return;
  }

  // parse lines
  const features = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    const cols = line.split(sep).map(c => c.trim());

    // sometimes rows have fewer cols due to separators in field - skip if not enough
    if (cols.length <= Math.max(latIdx, lonIdx)) continue;

    const rawLat = cols[latIdx] || '';
    const rawLon = cols[lonIdx] || '';
    const lat = parseFloat(rawLat.replace(',', '.'));
    const lon = parseFloat(rawLon.replace(',', '.'));
    if (isNaN(lat) || isNaN(lon)) continue;

    const props = {};
    if (numIdx !== -1) props.numero = cols[numIdx] || '';
    if (typeIdx !== -1) props.type = cols[typeIdx] || '';
    if (vmaIdx !== -1) props.vma = cols[vmaIdx] || '';

    features.push({
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [lon, lat] },
      properties: props
    });
  }

  const geojson = { type: 'FeatureCollection', features };

  try {
    fs.writeFileSync(OUT_FILE, JSON.stringify(geojson, null, 2), 'utf8');
    console.log(`✅ Fichier ${OUT_FILE} mis à jour (${features.length} radars).`);
  } catch (e) {
    console.error('❌ Erreur écriture fichier :', e.message);
  }
});
