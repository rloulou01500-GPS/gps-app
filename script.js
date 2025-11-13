// script.js

// Initialisation de la carte centrée sur la France
const map = L.map('map').setView([46.6, 2.5], 6);

// Ajout du fond de carte OpenStreetMap
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '© OpenStreetMap contributors',
  maxZoom: 19
}).addTo(map);

// Marker pour la position utilisateur
let userMarker = null;
let userCircle = null;

// Fonction pour mettre à jour la position GPS
function updatePosition(position) {
  const lat = position.coords.latitude;
  const lon = position.coords.longitude;

  if (!userMarker) {
    userMarker = L.marker([lat, lon], { title: "Vous êtes ici" }).addTo(map);
    userCircle = L.circle([lat, lon], { radius: position.coords.accuracy }).addTo(map);
    map.setView([lat, lon], 14);
  } else {
    userMarker.setLatLng([lat, lon]);
    userCircle.setLatLng([lat, lon]);
    userCircle.setRadius(position.coords.accuracy);
  }
}

// Suivi GPS en temps réel
if (navigator.geolocation) {
  navigator.geolocation.watchPosition(updatePosition, (err) => {
    console.error("Erreur GPS :", err);
  }, {
    enableHighAccuracy: true,
    maximumAge: 0,
    timeout: 10000
  });
} else {
  alert("Votre navigateur ne supporte pas la géolocalisation.");
}

// Cluster pour les radars
const radarCluster = L.markerClusterGroup();
map.addLayer(radarCluster);

// Fonction pour charger les radars depuis un fichier GeoJSON
async function loadRadars() {
  try {
    const response = await fetch('radars.geojson');
    const geojson = await response.json();

    L.geoJSON(geojson, {
      pointToLayer: (feature, latlng) => {
        const marker = L.marker(latlng, {
          title: feature.properties.nom || "Radar"
        });
        let popupContent = `<b>Type :</b> ${feature.properties.type || "Radar"}<br>`;
        popupContent += `<b>Vitesse :</b> ${feature.properties.vitesse || "?"} km/h<br>`;
        marker.bindPopup(popupContent);
        return marker;
      }
    }).addTo(radarCluster);

  } catch (error) {
    console.error("Impossible de charger les radars :", error);
  }
}

// Chargement initial des radars
loadRadars();
