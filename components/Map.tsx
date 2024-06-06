"use client"
import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const MapComponent = () => {
  const mapRef = useRef<L.Map | null>(null);

  // 補正値を設定（例として、緯度と経度をそれぞれ0.001度補正）
  const latitudeCorrection = 0;
  const longitudeCorrection = 0;

  useEffect(() => {
    if (mapRef.current === null) {
      mapRef.current = L.map('map').setView([51.505, -0.09], 13);

      L.tileLayer('https://mt1.google.com/vt/lyrs=r&x={x}&y={y}&z={z}', {
        attribution: '<a href="https://developers.google.com/maps/documentation?hl=ja">Google Map</a>'
      }).addTo(mapRef.current);

      // Create a custom icon
      const customIcon = L.icon({
        iconUrl: '/marker-icon.png',
        iconSize: [38, 38], // size of the icon
        iconAnchor: [22, 38], // point of the icon which will correspond to marker's location
        popupAnchor: [-3, -38] // point from which the popup should open relative to the iconAnchor
      });

      L.marker([51.505, -0.09], { icon: customIcon }).addTo(mapRef.current)
        .bindPopup('A pretty CSS3 popup.<br> Easily customizable.')
        .openPopup();
    }

    if (navigator.geolocation) {
      const success = (position: GeolocationPosition) => {
        let { latitude, longitude } = position.coords;
        const accuracy = position.coords.accuracy;

        // 補正値を適用
        latitude += latitudeCorrection;
        longitude += longitudeCorrection;

        console.log(`Latitude: ${latitude}, Longitude: ${longitude}, Accuracy: ${accuracy} meters`);

        if (mapRef.current) {
          mapRef.current.setView([latitude, longitude], 15);
          // Create a blue circle marker
          const currentLocationMarker = L.circleMarker([latitude, longitude], {
            color: '#1E90FF', // DodgerBlue color
            radius: 8, // Radius of the circle
            fillOpacity: 0.5 // Fill opacity
          }).addTo(mapRef.current)
            .bindPopup('You are here!')
            .openPopup();
        }
      };

      const error = () => {
        alert("Unable to retrieve your location.");
      };

      navigator.geolocation.getCurrentPosition(success, error, {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      });
    } else {
      alert("Geolocation is not supported by this browser.");
    }

    return () => {
      if (mapRef.current !== null) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  return (
    <div id="map" className="w-full h-screen"></div>
  );
};

export default MapComponent;
