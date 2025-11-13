
// URL brute GitHub du fichier radars.geojson
const radarsURL = 'https://raw.githubusercontent.com/rloulou01500-GPS/gps-app/refs/heads/main/radars.geojson //?v=' + Date.now();

// Initialisation de la carte
const map = L.map('map').setView([46.6, 2.5], 6); // Centre approximatif de la France

// Ajout du fond de carte OpenStreetMap
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; OpenStreetMap contributors'
}).addTo(map);

// Marqueur pour la position actuelle
const userMarker = L.marker([0, 0]).addTo(map).bindPopup('Vous êtes ici');

// Fonction pour mettre à jour la position de l'utilisateur
function updatePosition() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(pos => {
            const lat = pos.coords.latitude;
            const lon = pos.coords.longitude;
            userMarker.setLatLng([lat, lon]).update();
            map.setView([lat, lon], 12);
        });
    } else {
        alert('Géolocalisation non supportée par votre navigateur.');
    }
}

// Mise à jour immédiate et toutes les 5 secondes
updatePosition();
setInterval(updatePosition, 5000);

// Chargement des radars depuis GitHub
fetch(radarsURL)
    .then(res => {
        if (!res.ok) throw new Error('Impossible de charger les radars');
        return res.json();
    })
    .then(data => {
        L.geoJSON(data, {
            onEachFeature: (feature, layer) => {
                const props = feature.properties;
                layer.bindPopup(`
                    <b>${props['Type de radar']}</b><br>
                    Vitesse max: ${props['VMA']} km/h<br>
                    Mise en service: ${props['Date de mise-en-service']}
                `);
            }
        }).addTo(map);
    })
    .catch(err => console.error('Erreur chargement radars :', err));
