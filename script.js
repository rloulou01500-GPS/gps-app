// Initialisation de la carte
const map = L.map('map').setView([46.6, 2.4], 6); // centre France

// Fond de carte
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap'
}).addTo(map);

// 🔵 Position de l'utilisateur
if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(pos => {
        const { latitude, longitude } = pos.coords;
        L.marker([latitude, longitude]).addTo(map)
            .bindPopup("Votre position");
        map.setView([latitude, longitude], 10);
    });
}

// 🔴 Chargement radars.geojson local (dans le même dossier)
fetch('./radars.geojson?v=' + Date.now()) // 🔥 évite le cache GitHub Pages
    .then(r => r.json())
    .then(data => {
        L.geoJSON(data, {
            pointToLayer: (feature, latlng) => {
                return L.circleMarker(latlng, {
                    radius: 6,
                    fillColor: "red",
                    color: "black",
                    weight: 1,
                    fillOpacity: 0.9
                });
            },
            onEachFeature: (feature, layer) => {
                layer.bindPopup(`
                    <b>Radar :</b> ${feature.properties.nom || "Inconnu"}
                `);
            }
        }).addTo(map);
    })
    .catch(err => {
        console.error("Erreur lors du chargement du GeoJSON :", err);
        alert("Impossible de charger radars.geojson");
    });
