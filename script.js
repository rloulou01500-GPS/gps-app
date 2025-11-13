// Initialisation de la carte
const map = L.map('map').setView([46.6, 2.5], 6); // Vue France

// Carte OpenStreetMap
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  maxZoom: 19
}).addTo(map);

// Marker pour la position
let userMarker = null;
const userCircle = L.circle([0,0], {radius: 5, color: 'blue'}).addTo(map);

// Clustering radars
const radarCluster = L.markerClusterGroup();
map.addLayer(radarCluster);

// Fonction pour suivre la position
function updatePosition(position) {
  const lat = position.coords.latitude;
  const lng = position.coords.longitude;

  if (!userMarker) {
    userMarker = L.marker([lat, lng]).addTo(map);
    map.setView([lat, lng], 13);
  } else {
    userMarker.setLatLng([lat, lng]);
  }
  userCircle.setLatLng([lat, lng]);
}

// Rafraîchir la position toutes les 3 secondes
if (navigator.geolocation) {
  navigator.geolocation.watchPosition(updatePosition, 
    err => console.error("Erreur GPS : ", err),
    { enableHighAccuracy: true, maximumAge: 1000 });
} else {
  alert("Géolocalisation non supportée !");
}

// Charger les radars depuis radars.geojson
async function loadRadars() {
  try {
    const res = await fetch("radars.geojson");
    const data = await res.json();

    data.features.forEach(f => {
      const [lng, lat] = f.geometry.coordinates;
      const name = f.properties.nom || "Radar";
      const type = f.properties.type || "inconnu";
      const marker = L.marker([lat, lng])
        .bindPopup(`<b>${name}</b><br>Type: ${type}`);
      radarCluster.addLayer(marker);
    });
  } catch(err) {
    console.error("Erreur chargement radars : ", err);
  }
}

loadRadars();
