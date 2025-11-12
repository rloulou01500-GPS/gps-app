const startCoords = [45.955, 5.336]; // Saint-Denis-en-Bugey
const ORS_API_KEY = "eyJvcmciOiI1YjNjZTM1OTc4NTExMTAwMDFjZjYyNDgiLCJpZCI6IjA4ZWNjMmZiNjA0YzQ4NjM4OGRhYjQ5ZTcxYTFlOTQ3IiwiaCI6Im11cm11cjY0In0="; // <-- remplace par ta clé ORS

const map = L.map('map').setView(startCoords, 15);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '© OpenStreetMap contributors',
  maxZoom: 19,
}).addTo(map);

let userMarker = L.circleMarker(startCoords, {
  radius: 8,
  color: '#007aff',
  fillColor: '#007aff',
  fillOpacity: 0.8,
}).addTo(map);

let pathCoords = JSON.parse(localStorage.getItem('pathCoords')) || [startCoords];
let pathLine = L.polyline(pathCoords, { color: 'blue' }).addTo(map);

let routeLayer = null;

function updatePosition(position) {
  const { latitude, longitude, speed, heading } = position.coords;
  const newPos = [latitude, longitude];

  userMarker.setLatLng(newPos);
  pathCoords.push(newPos);
  pathLine.setLatLngs(pathCoords);
  localStorage.setItem('pathCoords', JSON.stringify(pathCoords));

  document.getElementById('speed').textContent = speed ? (speed*3.6).toFixed(1) : '--';
  document.getElementById('heading').textContent = heading ? heading.toFixed(0) : '--';
}

function showError(err) {
  alert('Erreur de géolocalisation : ' + err.message);
}

if ('geolocation' in navigator) {
  navigator.geolocation.watchPosition(updatePosition, showError, { enableHighAccuracy: true, maximumAge: 0 });
} else {
  alert("La géolocalisation n'est pas disponible sur cet appareil.");
}

// Boutons
document.getElementById('recenter').addEventListener('click', () => {
  if (userMarker.getLatLng()) map.setView(userMarker.getLatLng(), 16);
});

document.getElementById('clear').addEventListener('click', () => {
  localStorage.removeItem('pathCoords');
  pathCoords = [];
  pathLine.setLatLngs([]);
});

document.getElementById('route').addEventListener('click', () => {
  const input = document.getElementById('route-input');
  input.style.display = input.style.display === 'none' ? 'block' : 'none';
});

document.getElementById('go').addEventListener('click', async () => {
  const destName = document.getElementById('destination').value.trim();
  if (!destName) return alert("Veuillez entrer une destination !");

  try {
    const geoRes = await fetch(`https://api.openrouteservice.org/geocode/search?api_key=${ORS_API_KEY}&text=${encodeURIComponent(destName)}&boundary.country=FR`);
    const geoData = await geoRes.json();
    if (!geoData.features || geoData.features.length === 0) return alert("Destination introuvable !");
    const [lon, lat] = geoData.features[0].geometry.coordinates;

    const current = userMarker.getLatLng();

    const routeRes = await fetch("https://api.openrouteservice.org/v2/directions/driving-car", {
      method: "POST",
      headers: { "Authorization": ORS_API_KEY, "Content-Type": "application/json" },
      body: JSON.stringify({ coordinates: [[current.lng, current.lat],[lon, lat]] }),
    });

    const routeData = await routeRes.json();
    if (!routeData.features || routeData.features.length === 0) return alert("Impossible de calculer l'itinéraire.");

    const coords = routeData.features[0].geometry.coordinates.map(c => [c[1], c[0]]);
    if (routeLayer) map.removeLayer(routeLayer);
    routeLayer = L.polyline(coords, { color: 'green', weight: 4 }).addTo(map);
    map.fitBounds(routeLayer.getBounds());
  } catch(err) {
    console.error(err);
    alert("Erreur lors du calcul de l'itinéraire.");
  }
});
