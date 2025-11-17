// -------------------------------------------------------------
// INITIALISATION DE LA CARTE
// -------------------------------------------------------------
const map = L.map("map").setView([46.6, 2.5], 6);

// Fond de carte
L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution: "© OpenStreetMap"
}).addTo(map);

// -------------------------------------------------------------
// ICÔNES RADARS
// -------------------------------------------------------------
const radarIcons = {
    fix: L.icon({
        iconUrl: "icons/RadarFix.svg",
        iconSize: [32, 32],
        iconAnchor: [16, 32]
    }),
    mobile: L.icon({
        iconUrl: "icons/RadarMobile.svg",
        iconSize: [32, 32],
        iconAnchor: [16, 32]
    }),
    troncon: L.icon({
        iconUrl: "icons/RadarTroncon.svg",
        iconSize: [32, 32],
        iconAnchor: [16, 32]
    }),
    defaut: L.icon({
        iconUrl: "icons/RadarDefaut.svg",
        iconSize: [32, 32],
        iconAnchor: [16, 32]
    })
};

// -------------------------------------------------------------
// CHARGEMENT DES RADARS
// -------------------------------------------------------------
fetch("radars.geojson")
    .then(res => res.json())
    .then(data => {
        L.geoJSON(data, {
            pointToLayer: (feature, latlng) => {
                const type = (feature.properties.type || "").toLowerCase();

                let icon = radarIcons.defaut;

                if (type.includes("fix")) icon = radarIcons.fix;
                else if (type.includes("mobile")) icon = radarIcons.mobile;
                else if (type.includes("tronçon") || type.includes("troncon")) icon = radarIcons.troncon;

                return L.marker(latlng, { icon });
            },
            onEachFeature: (feature, layer) => {
                const props = feature.properties;
                layer.bindPopup(`
                    <b>Radar :</b> ${props.type || "Inconnu"}<br>
                    <b>Vitesse :</b> ${props.vma || "?"} km/h<br>
                    <b>Coordonnées :</b><br>
                    ${feature.geometry.coordinates[1].toFixed(5)}, 
                    ${feature.geometry.coordinates[0].toFixed(5)}
                `);
            }
        }).addTo(map);
    })
    .catch(err => console.error("Erreur chargement GeoJSON :", err));

// -------------------------------------------------------------
// LOCALISATION DE L’UTILISATEUR
// -------------------------------------------------------------
function localiser() {
    if (!navigator.geolocation) {
        alert("La géolocalisation n'est pas supportée.");
        return;
    }

    navigator.geolocation.getCurrentPosition(
        pos => {
            const lat = pos.coords.latitude;
            const lon = pos.coords.longitude;

            map.setView([lat, lon], 14);

            L.marker([lat, lon], {
                icon: L.icon({
                    iconUrl: "https://cdn-icons-png.flaticon.com/512/64/64113.png",
                    iconSize: [32, 32],
                    iconAnchor: [16, 32]
                })
            })
            .addTo(map)
            .bindPopup("📍 Vous êtes ici")
            .openPopup();
        },
        err => {
            alert("Impossible de récupérer votre position.");
        }
    );
}

// Activation au bouton
document.getElementById("btnLocate").addEventListener("click", localiser);
