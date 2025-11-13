// ----- script.js -----

// Carte centrée sur la France
const map = L.map('map').setView([46.5, 2.5], 6);

// Ajouter le fond de carte OpenStreetMap
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors',
    maxZoom: 19
}).addTo(map);

// Marqueur de la position de l'utilisateur
let userMarker;
if (navigator.geolocation) {
    navigator.geolocation.watchPosition(
        (position) => {
            const lat = position.coords.latitude;
            const lng = position.coords.longitude;

            if (!userMarker) {
                userMarker = L.marker([lat, lng]).addTo(map)
                    .bindPopup('Vous êtes ici')
                    .openPopup();
            } else {
                userMarker.setLatLng([lat, lng]);
            }

            // Optionnel : centrer la carte sur l'utilisateur
            // map.setView([lat, lng]);
        },
        (err) => console.error('Erreur géolocalisation:', err),
        { enableHighAccuracy: true }
    );
}

// Définir les icônes pour les radars
function getRadarIcon(type) {
    switch(type.toLowerCase()) {
        case 'fixe':
            return L.icon({ iconUrl: 'icons/radar-fixe.svg', iconSize:[32,32], iconAnchor:[16,32], popupAnchor:[0,-32] });
        case 'mobile':
            return L.icon({ iconUrl: 'icons/radar-mobile.svg', iconSize:[32,32], iconAnchor:[16,32], popupAnchor:[0,-32] });
        case 'tronçon':
            return L.icon({ iconUrl: 'icons/radar-troncon.svg', iconSize:[32,32], iconAnchor:[16,32], popupAnchor:[0,-32] });
        default:
            return L.icon({ iconUrl: 'icons/radar-default.svg', iconSize:[32,32], iconAnchor:[16,32], popupAnchor:[0,-32] });
    }
}

// Charger le fichier radars.geojson
fetch('radars.geojson?' + Date.now())  // cache-buster
    .then(response => response.json())
    .then(data => {
        L.geoJSON(data, {
            pointToLayer: function(feature, latlng) {
                const type = feature.properties.Type || 'Fixe';
                return L.marker(latlng, { icon: getRadarIcon(type) });
            },
            onEachFeature: function(feature, layer) {
                const props = feature.properties;
                layer.bindPopup(`
                    <b>${props.Type || 'Radar'}</b><br>
                    Vitesse max: ${props.VMA || 'N/A'} km/h<br>
                    Nom: ${props['Numéro de radar'] || 'N/A'}
                `);
            }
        }).addTo(map);
    })
    .catch(err => console.error('Erreur chargement radars.geojson:', err));
