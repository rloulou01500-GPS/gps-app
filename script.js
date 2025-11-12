// ---------------------------
// CONFIGURATION
// ---------------------------
const startCoords = [45.955, 5.336]; // Saint-Denis-en-Bugey
const ORS_API_KEY = "eyJvcmciOiI1YjNjZTM1OTc4NTExMTAwMDFjZjYyNDgiLCJpZCI6IjA4ZWNjMmZiNjA0YzQ4NjM4OGRhYjQ5ZTcxYTFlOTQ3IiwiaCI6Im11cm11cjY0In0="; // <-- Remplace par ta clé OpenRouteService

// ---------------------------
// INITIALISATION DE LA CARTE
// ---------------------------
const map = L.map('map').setView(startCoords, 15);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '© OpenStreetMap contributors',
  maxZoom: 19,
}).addTo(map);

// Marqueur utilisateur
let userMarker = L.circleMarker(startCoords, {
  radius: 8,
  color: '#007aff',
  fillColor: '#007aff',
  fillOpacity: 0.8,
}).addTo(map);

// Tracé du chemin parcouru
let pathCoords = JSON.parse(localStorage.getItem('pathCoords')) || [startCoords];
let pathLine = L.polyline(pathCoords, { color: 'blue' }).addTo(map);

// Couche pour l’itinéraire
let routeLayer = null;

// ---------------------------
// FONCTION DE MISE À JOUR DE LA POSITION
// ---------------------------
function updatePosition(position) {
  const { latitude, longitude, speed, heading } = position.coords;
  const newPos = [latitude, longitude];

  // Marqueur utilisateur
  userMarker.setLatLng(newPos);

  // Tracé du chemin
  pathCoords.push(newPos);
  pathLine.setLatLngs(pathCoords);

  // Sauvegarde dans le localStorage
  localStorage.setItem('pathCoords', JSON.stringify(pathCoords));

  // Affichage vitesse et directi
