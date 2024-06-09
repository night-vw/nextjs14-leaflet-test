"use client"
import { useEffect, useRef, useState, useCallback } from 'react';
import L from 'leaflet';
import { FaSearch, FaTimes } from "react-icons/fa";
import { FiPlus } from "react-icons/fi";
import { BiCurrentLocation } from "react-icons/bi";
import { BsX } from "react-icons/bs";
import 'leaflet/dist/leaflet.css';

const MapComponent = () => {
  const mapRef = useRef<L.Map | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [addingMarker, setAddingMarker] = useState(false);
  const [userMarker, setUserMarker] = useState<L.Marker | null>(null);
  let marker_add_check = false;

  useEffect(() => {
    if (mapRef.current === null) {
      mapRef.current = L.map('map', {
        zoomControl: false,
      }).setView([35.68078249, 139.767235], 16);

      L.tileLayer('https://mt1.google.com/vt/lyrs=r&x={x}&y={y}&z={z}', {
        attribution: '<a href="https://developers.google.com/maps/documentation?hl=ja">Google Map</a>',
      }).addTo(mapRef.current);

      const customIcon = L.icon({
        iconUrl: '/marker-icon.png',
        iconSize: [38, 38],
        iconAnchor: [22, 38],
        popupAnchor: [-3, -38],
      });

      L.marker([35.68078249, 139.767235], { icon: customIcon }).addTo(mapRef.current)
        .bindPopup('A pretty CSS3 popup.<br> Easily customizable.')
        .openPopup();
    }

    if (navigator.geolocation) {
      const success = (position: GeolocationPosition) => {
        let { latitude, longitude } = position.coords;
        const accuracy = position.coords.accuracy;

        console.log(`Latitude: ${latitude}, Longitude: ${longitude}, Accuracy: ${accuracy} meters`);

        if (mapRef.current) {
          mapRef.current.setView([latitude, longitude], 16);
          const currentLocationMarker = L.circleMarker([latitude, longitude], {
            color: '#1E90FF',
            radius: 8,
            fillOpacity: 0.5,
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
        maximumAge: 0,
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

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery) return;

    const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${searchQuery}`);
    const data = await response.json();

    if (data && data.length > 0) {
      const { lat, lon } = data[0];

      if (mapRef.current) {
        mapRef.current.flyTo([lat, lon], 16);
        const customIcon = L.icon({
          iconUrl: '/marker-icon.png',
          iconSize: [38, 38],
          iconAnchor: [22, 38],
          popupAnchor: [-3, -38],
        });
        L.marker([lat, lon], { icon: customIcon }).addTo(mapRef.current)
          .bindPopup(`Search Result: ${searchQuery}`)
          .openPopup();
      }
    } else {
      alert("No results found.");
    }
  };

  const fetchSuggestions = useCallback(async (query: string) => {
    if (!query) {
      setSuggestions([]);
      return;
    }

    const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${query}`);
    const data = await response.json();
    setSuggestions(data);
  }, []);

  const handleSuggestionClick = (lat: number, lon: number, display_name: string) => {
    if (mapRef.current) {
      mapRef.current.flyTo([lat, lon], 16);
      const customIcon = L.icon({
        iconUrl: '/marker-icon.png',
        iconSize: [38, 38],
        iconAnchor: [22, 38],
        popupAnchor: [-3, -38],
      });
      L.marker([lat, lon], { icon: customIcon }).addTo(mapRef.current)
        .bindPopup(`Search Result: ${display_name}`)
        .openPopup();
    }
    setSuggestions([]);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);

    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    if (query) {
      debounceTimeoutRef.current = setTimeout(() => {
        fetchSuggestions(query);
      }, 300);
    } else {
      setSuggestions([]);
    }
  };

  const clearSearch = () => {
    setSearchQuery('');
    setSuggestions([]);
  };

  const moveToCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          if (mapRef.current) {
            //現在地に移動する
            mapRef.current.flyTo([latitude, longitude], 16);
          }
        },
        () => {
          alert("Unable to retrieve your location.");
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    } else {
      alert("Geolocation is not supported by this browser.");
    }
  };

  const toggleAddMarker = () => {
    setAddingMarker(!addingMarker);
    if (userMarker) {
      mapRef.current?.removeLayer(userMarker);
      setUserMarker(null);
      marker_add_check = false;
    }
  };

  const handleMapClick = async (e: L.LeafletMouseEvent) => {
    if (addingMarker && mapRef.current) {
      const customIcon = L.icon({
        iconUrl: '/marker-icon.png',
        iconSize: [38, 38],
        iconAnchor: [22, 38],
        popupAnchor: [-3, -38],
      });

      if (marker_add_check == false) {
        const marker = L.marker(e.latlng, { icon: customIcon }).addTo(mapRef.current)
          .bindPopup('Custom Marker')
          .openPopup();
        setUserMarker(marker);
        marker_add_check = true;
      }

    }
  };

  useEffect(() => {
    if (mapRef.current) {
      mapRef.current.on('click', handleMapClick);
    }
    return () => {
      if (mapRef.current) {
        mapRef.current.off('click', handleMapClick);
      }
    };
  }, [addingMarker]);

  return (
    <div className="relative w-full h-screen">
      <form onSubmit={handleSearch} className="absolute top-4 left-1/2 transform -translate-x-1/2 z-20 w-11/12 md:w-1/2">
        <div className="flex shadow-lg relative">
          <input
            type="text"
            value={searchQuery}
            onChange={handleInputChange}
            ref={inputRef}
            className="text-lg w-full p-2 rounded-l-lg mr-0 border-2 text-gray-800 border-indigo-300 bg-white opacity-85"
            placeholder="マップ検索する"
            style={{ willChange: 'transform' }} // will-change プロパティを追加
          />
          {searchQuery && (
            <button
              type="button"
              onClick={clearSearch}
              className="absolute right-14 top-2/4 transform -translate-y-2/4 p-1 text-gray-500 hover:text-gray-700"
            >
              <FaTimes />
            </button>
          )}
          <button
            type="submit"
            className="p-2 rounded-r-lg bg-indigo-500 text-white border-indigo-300 border-t border-b border-r opacity-90"
          ><FaSearch />
          </button>
          {searchQuery && suggestions.length > 0 && (
            <ul className="absolute top-full left-0 w-full bg-white border border-gray-200 z-10 max-h-60 overflow-auto">
              {suggestions.map((suggestion: any, index: number) => (
                <li
                  key={index}
                  className="p-2 cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSuggestionClick(suggestion.lat, suggestion.lon, suggestion.display_name)}
                >
                  {suggestion.display_name}
                </li>
              ))}
            </ul>
          )}
        </div>
      </form>
      <div id="map" className="w-full h-full z-10"></div>
      <button
        onClick={moveToCurrentLocation}
        className="absolute bottom-20 left-1/2 transform -translate-x-1/2 p-3 bg-indigo-500 text-white rounded-full shadow-lg hover:bg-indigo-600 focus:outline-none z-20"
      >
        <BiCurrentLocation size={40} />
      </button>
      <button
        onClick={toggleAddMarker}
        className="absolute bottom-24 right-8 p-3 bg-indigo-500 text-white rounded-full shadow-lg hover:bg-indigo-600 focus:outline-none z-20"
      >
        {addingMarker ? <BsX size={40} /> : <FiPlus size={40} />}
      </button>
    </div>
  );
};

export default MapComponent;
