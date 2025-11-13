// Initialisation de la carte centrée sur la France
const map = L.map('map').setView([46.5, 2.5], 6);

// Ajouter le fond de carte OpenStreetMap
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '© OpenStreetMap'
}).addTo(map);

// URL du fichier GeoJSON local (radars générés via updateRadars.js)
const radarsURL = 'radars.geojson';

// Charger les radars et les ajouter à la carte
fetch(radarsURL)
    .then(response => response.json())
    .then(data => {
        L.geoJSON(data, {
            onEachFeature: (feature, layer) => {
                const props = feature.properties;
                let popupText = `<b>Type:</b> ${props.Type} <br> <b>Vitesse max:</b> ${props.VMA} km/h`;
                layer.bindPopup(popupText);
            }
        }).addTo(map);
    })
    .catch(err => console.error("Erreur chargement radars:", err));

// Optionnel : marquer la position de l'utilisateur
map.locate({ setView: true, maxZoom: 16 });
function onLocationFound(e) {
    const radius = e.accuracy / 2;
    L.marker(e.latlng).addTo(map)
        .bindPopup("Vous êtes ici").openPopup();
    L.circle(e.latlng, radius).addTo(map);
}
map.on('locationfound', onLocationFound);
