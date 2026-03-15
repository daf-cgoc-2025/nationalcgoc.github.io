// Initialize Leaflet map
const map = L.map('map', {
  zoomControl: false,
  attributionControl: false,
});

// Set default view based on device width
const width = document.documentElement.clientWidth;
if (width < 768) {
  map.setView([40, -99], 2);
} else {
  map.setView([50, 0], 2);
}

// CartoDB Dark Matter tiles for dark aesthetic
L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
  maxZoom: 19,
  attribution: '&copy; <a href="https://carto.com/">CARTO</a> &copy; <a href="https://openstreetmap.org/copyright">OpenStreetMap</a>'
}).addTo(map);

// Set max bounds to avoid infinite scroll
const southWest = L.latLng(-89.98155760646617, -180);
const northEast = L.latLng(89.99346179538875, 180);
const bounds = L.latLngBounds(southWest, northEast);

map.setMaxBounds(bounds);
map.on('drag', function () {
  map.panInsideBounds(bounds, { animate: false });
});

// Gold circle marker style
const markerStyle = {
  radius: 7,
  fillColor: '#fdc501',
  color: '#b8900a',
  weight: 2,
  fillOpacity: 0.85,
};

// Build popup content from feature properties
function buildPopup(feature) {
  const p = feature.properties;

  const region = p.region || '';
  const division = p.division ? `, ${p.division}` : '';
  const branch = p.branch ? `, ${p.branch}` : '';

  let emailStr = '';
  const email = p.org_email !== 'None' ? p.org_email
    : p.primary_email !== 'None' ? p.primary_email
    : p.secondary_email !== 'None' ? p.secondary_email
    : null;
  if (email) {
    emailStr = `<a href="mailto:${email}">Email this Council</a><br>`;
  }

  const websiteStr = p.website
    ? `<a href="${p.website}" target="_blank">Visit their Website</a><br>`
    : '';
  const facebookStr = p.facebook
    ? `<a href="${p.facebook}" target="_blank">Visit their Facebook Page</a><br>`
    : '';
  const instagramStr = p.instagram
    ? `<a href="${p.instagram}" target="_blank">Visit their Instagram</a>`
    : '';

  const liaisonStr = p.liason && p.liason.length >= 5
    ? `Liaison: ${p.liason}<br>`
    : '';

  return `
    <b>${p.base}</b><br>
    ${p.location}<br>
    ${region}${division}${branch}<br>
    <br>
    ${liaisonStr}
    President: ${p.president}<br>
    Vice President: ${p.vp}<br>
    <br>
    ${emailStr}
    ${websiteStr}
    ${facebookStr}
    ${instagramStr}
  `.trim();
}

// Load GeoJSON and add to map with gold circle markers
fetch('../js/installations.geojson')
  .then(response => response.json())
  .then(data => {
    L.geoJSON(data, {
      pointToLayer: function (feature, latlng) {
        return L.circleMarker(latlng, markerStyle);
      },
      onEachFeature: function (feature, layer) {
        layer.bindPopup(buildPopup(feature));
      }
    }).addTo(map);
  });
