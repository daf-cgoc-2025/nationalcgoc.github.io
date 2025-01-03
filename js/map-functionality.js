// initialize Leaflet
var map = L.map('map', {
  zoomControl: false, 
  attributionControl: false,
});

// set default view based on device (tablets are between 768 and 922 pixels wide, phones are less than 768 pixels wide)
var width = document.documentElement.clientWidth;
if (width < 768) {
    map.setView({lon: -99, lat: 40}, 2); // for mobile, center on US
}  else {
    map.setView({lon: 0, lat: 50}, 2); // otherwise, center on world
}

// add the OpenStreetMap tiles
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  maxZoom: 19,
  attribution: '&copy; <a href="https://openstreetmap.org/copyright">OpenStreetMap</a>'
}).addTo(map);

// set max bounds to avoid infinite scroll
var southWest = L.latLng(-89.98155760646617, -180),
northEast = L.latLng(89.99346179538875, 180);
var bounds = L.latLngBounds(southWest, northEast);

map.setMaxBounds(bounds);
map.on('drag', function() {
    map.panInsideBounds(bounds, { animate: false });
});

// add points from GeoJSON instance
var geojsonLayer = new L.GeoJSON.AJAX("../js/installations.geojson", {onEachFeature:popUp});

function popUp(feature, layer) {

  // validate region
  var region = "";

  if (!feature.properties.region) {
      region = ""; 
  } else {
    region = feature.properties.region;
  }

  // validate division
  var division = "";

  if (!feature.properties.division) {
      division = ""; 
  } else {
    division = ', ' + feature.properties.division;
  }

  // validate branch
  var branch = "";

  if (!feature.properties.branch) {
      branch = ""; 
  } else {
    branch = ', ' + feature.properties.branch;
  }

  // validate email
  var emailStr = "";

  if (feature.properties.org_email === "None") {
    if (feature.properties.primary_email === "None") {
        if (feature.properties.secondary_email === "None") {
          emailStr = "";
        } else {
          emailStr = '<a href="mailto:' + feature.properties.secondary_email + '">Email this Council</a>' + '<br>';
        }
    } else {
      emailStr = '<a href="mailto:' + feature.properties.primary_email + '">Email this Council</a>' + '<br>';
    }
  } else {
    emailStr = '<a href="mailto:' + feature.properties.org_email + '">Email this Council</a>' + '<br>';
  }

  // validate website
  var websiteStr = "";

  if (!feature.properties.website) {
    websiteStr = ""; 
  } else {
    websiteStr = '<a href="' + feature.properties.website + '" target="_blank">Visit their Website</a>' + '<br>';
  }

  // validate facebook
  var facebookStr = "";

  if (!feature.properties.facebook) {
    facebookStr = ""; 
  } else {
    facebookStr = '<a href="' + feature.properties.facebook + '" target="_blank">Visit their Facebook Page</a>' + '<br>';
  }

  // validate instagram
  var instagramStr = "";

  if (!feature.properties.instagram) {
    instagramStr = ""; 
  } else {
    instagramStr = '<a href="' + feature.properties.instagram + '" target="_blank">Visit their Instagram</a>';
  }

    // validate region
  var liason = "";

  if (!feature.properties.liason) {
      liason = ""; 
  } else {
    liason = feature.properties.liason;
  }

  // create tooltip content
  if (liason.length < 5) {
    var popupContent = 
    '<b>' + feature.properties.base + '</b>' + '<br>' + 
    feature.properties.location + '<br>' +
    region + division + branch +'<br>' +
    '<br>' +
    'President: ' + feature.properties.president + '<br>' +
    'Vice President: ' + feature.properties.vp + '<br>' +
    '<br>' +
    emailStr +
    websiteStr + 
    facebookStr +
    instagramStr;
    layer.bindPopup(popupContent);
  } else {
    var popupContent = 
    '<b>' + feature.properties.base + '</b>' + '<br>' + 
    feature.properties.location + '<br>' +
    region + division + branch +'<br>' +
    '<br>' +
    'Liason: ' + feature.properties.liason + '<br>' +
    'President: ' + feature.properties.president + '<br>' +
    'Vice President: ' + feature.properties.vp + '<br>' +
    '<br>' +
    emailStr +
    websiteStr + 
    facebookStr +
    instagramStr;
    layer.bindPopup(popupContent);
  }
  
}

geojsonLayer.addTo(map);