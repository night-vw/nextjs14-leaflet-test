"use client"
import { useEffect, useRef, useState, useCallback } from 'react';
import Image from 'next/image';
import L from 'leaflet';
import { LatLngTuple, latLng } from 'leaflet';
import { FaSearch, FaTimes } from "react-icons/fa";
import { FiPlus } from "react-icons/fi";
import { BiCurrentLocation } from "react-icons/bi";
import { BsX } from "react-icons/bs";
import 'leaflet/dist/leaflet.css';
import map_pinIcon from '@/public/map_pin-icon.png';
import workIcon from '@/public/work-icon.png';
import exerciseIcon from '@/public/exercise-icon.png';
import foodIcon from '@/public/food-icon.png';
import shoppingIcon from '@/public/shopping-icon.png';

const MapComponent = () => {
  const mapRef = useRef<L.Map | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [addingMarker, setAddingMarker] = useState(false);
  const [userMarker, setUserMarker] = useState<L.Marker | null>(null);
  const [activeIcon, setActiveIcon] = useState('map_pinIcon');
  const [markerPlaced, setMarkerPlaced] = useState(false);
  const [markerUrl, setMarkerUrl] = useState('/map_pin-icon.png');
  const [formVisible, setFormVisible] = useState(false);
  let marker_add_check = false;
  const [currentDateTime, setCurrentDateTime] = useState('');
  const [selectedOption, setSelectedOption] = useState('on');
  const [isDisabled, setIsDisabled] = useState(true);

  useEffect(() => {
    const now = new Date();
    // 日本時間 (JST) オフセットは UTC+9
    const jstTime = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Tokyo" }));
    const year = jstTime.getFullYear();
    const month = String(jstTime.getMonth() + 1).padStart(2, '0');
    const day = String(jstTime.getDate()).padStart(2, '0');
    const hours = String(jstTime.getHours()).padStart(2, '0');
    const minutes = String(jstTime.getMinutes()).padStart(2, '0');
    
    const formattedDateTime = `${year}-${month}-${day}T${hours}:${minutes}`;
    setCurrentDateTime(formattedDateTime);
    console.log(formattedDateTime)
  }, []);
  
  

  // Disable vertical scroll
  useEffect(() => {
    const preventDefault = (e: Event) => e.preventDefault();
    window.addEventListener('wheel', preventDefault, { passive: false });
    window.addEventListener('touchmove', preventDefault, { passive: false });

    return () => {
      window.removeEventListener('wheel', preventDefault);
      window.removeEventListener('touchmove', preventDefault);
    };
  }, []);

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
            color: '#FFFFFF',
            fillColor: '#0476D9',
            radius: 15,
            fillOpacity: 1,
            weight: 5
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
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  };

  const moveToCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          if (mapRef.current) {
            const currentLocation: LatLngTuple = [latitude, longitude];
            const mapBounds = mapRef.current.getBounds();
            const mapCenter = mapRef.current.getCenter();
            const mapCenterLatLng = latLng(mapCenter.lat, mapCenter.lng);
  
            const distance = mapCenterLatLng.distanceTo(latLng(latitude, longitude));
            const zoomLevel = mapRef.current.getZoom();
  
            const distanceThreshold = 500;
  
            if (mapBounds.contains(currentLocation) && distance < distanceThreshold) {
              mapRef.current.flyTo(currentLocation, zoomLevel);
            } else {
              mapRef.current.setView(currentLocation, 16);
            }
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
      setFormVisible(false)
    }
    setMarkerPlaced(false);
    setFormVisible(false);
  };

  const handleMapClick = async (e: L.LeafletMouseEvent) => {
    if (addingMarker && mapRef.current) {
      const customIcon = L.icon({
        iconUrl: markerUrl,
        iconSize: [60, 60],
        iconAnchor: [22, 38],
        popupAnchor: [-3, -38],
      });

      if (marker_add_check == false) {
        const marker = L.marker(e.latlng, { icon: customIcon }).addTo(mapRef.current)
        setUserMarker(marker);
        marker_add_check = true;
        setMarkerPlaced(true);
        setFormVisible(true);
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
  }, [addingMarker, markerUrl]);

  const map_pinIconClick = ()=>{
    setMarkerUrl('/map_pin-icon.png');
    setActiveIcon('map_pinIcon');
  }

  const workIconClick = ()=>{
    setMarkerUrl('/work-icon.png');
    setActiveIcon('workIcon');
  }

  const exerciseIconClick = ()=>{
    setMarkerUrl('/exercise-icon.png');
    setActiveIcon('exerciseIcon');
  }

  const foodIconClick = ()=>{
    setMarkerUrl('/food-icon.png');
    setActiveIcon('foodIcon');
  }

  const shoppingIconClick = ()=>{
    setMarkerUrl('/shopping-icon.png');
    setActiveIcon('shoppingIcon');
  }

  const handleOptionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedOption(e.target.value);
  };

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
            style={{ willChange: 'transform' }}
          />
          {searchQuery && (
            <button
              type="button"
              onClick={clearSearch}
              className="absolute right-10 top-2/4 transform -translate-y-2/4 p-1 text-gray-500 hover:text-gray-700"
            >
              <FaTimes />
            </button>
          )}
          <button
            type="submit"
            className="p-2 rounded-r-lg bg-indigo-500 text-white border-indigo-300 border-t border-b border-r opacity-90"
          >
            <FaSearch />
          </button>
        </div>
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
      </form>
      <div id="map" className="w-full h-full z-10"></div>
      <button
        onClick={moveToCurrentLocation}
        className="absolute bottom-24 left-1/2 transform -translate-x-1/2 p-3 bg-indigo-500 text-white rounded-full shadow-lg hover:bg-indigo-600 focus:outline-none z-20"
      >
        <BiCurrentLocation size={40} />
      </button>
      <button
        onClick={toggleAddMarker}
        className="absolute bottom-24 right-8 p-3 bg-indigo-500 text-white rounded-full shadow-lg hover:bg-indigo-600 focus:outline-none z-20"
      >
      {addingMarker ? <BsX size={40} /> : <FiPlus size={40} />}
      </button>
      {addingMarker && !markerPlaced && (
        <>
        <button
          onClick={shoppingIconClick}
          className={`absolute bottom-44 right-8 p-3 ${activeIcon === 'shoppingIcon' ? 'bg-rose-500' : 'bg-sky-500'} text-white rounded-full shadow-lg hover:bg-rose-600 focus:outline-none z-20`}
        >
          <Image src={shoppingIcon} alt="shopping Marker" className="w-10 h-10" />
        </button>
        <button
          onClick={foodIconClick}
          className={`absolute bottom-64 right-8 p-3 ${activeIcon === 'foodIcon' ? 'bg-rose-500' : 'bg-sky-500'} text-white rounded-full shadow-lg hover:bg-rose-600 focus:outline-none z-20`}
        >
          <Image src={foodIcon} alt="food Marker" className="w-10 h-10" />
        </button>
        <button
          onClick={exerciseIconClick}
          className={`absolute bottom-84 right-8 p-3 ${activeIcon === 'exerciseIcon' ? 'bg-rose-500' : 'bg-sky-500'} text-white rounded-full shadow-lg hover:bg-rose-600 focus:outline-none z-20`}
        >
          <Image src={exerciseIcon} alt="exercise Marker" className="w-10 h-10" />
        </button>
        <button
          onClick={workIconClick}
          className={`absolute bottom-104 right-8 p-3 ${activeIcon === 'workIcon' ? 'bg-rose-500' : 'bg-sky-500'} text-white rounded-full shadow-lg hover:bg-rose-600 focus:outline-none z-20`}
        >
          <Image src={workIcon} alt="work Marker" className="w-10 h-10" />
        </button>
        <button
          onClick={map_pinIconClick}
          className={`absolute bottom-124 right-8 p-3 ${activeIcon === 'map_pinIcon' ? 'bg-rose-500' : 'bg-sky-500'} text-white rounded-full shadow-lg hover:bg-rose-600 focus:outline-none z-20`}
        >
          <Image src={map_pinIcon} alt="map_pin Marker" className="w-10 h-10" />
        </button>
        </>
      )}
      {formVisible && (
        <div className="absolute top-20 left-1/2 transform -translate-x-1/2 w-11/12 md:w-1/2 p-4 bg-white bg-opacity-70 shadow-lg rounded-lg z-30">
          <button
            onClick={toggleAddMarker}
            className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
          >
            <FaTimes />
          </button>
          <form>
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2">タスク名</label>
              <input type="text" className="w-full p-2 border rounded-lg opacity-70 border-slate-700" />
            </div>
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2">詳細/説明</label>
              <textarea className="w-full p-2 border rounded-lg opacity-70 border-slate-700"></textarea>
            </div>
          <label className="block text-gray-700 text-sm font-bold mb-2">期限あり / なし</label>
          <div className='flex'>
          <div className='mr-10'>
          <label className='text-sm font-bold'>
            <input
              type="radio"
              value="on"
              checked={selectedOption === 'on'}
              onChange={handleOptionChange}/>
              あり
          </label>
          </div>
          <div>
            <label className='text-sm font-bold'>
              <input
              type="radio"
              value="off"
              checked={selectedOption === 'off'}
              onChange={handleOptionChange}/>
              なし
            </label>
          </div>
        </div>
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2">期限</label>
              <input type="datetime-local" value={currentDateTime} className="w-full p-2 border rounded-lg opacity-70 border-slate-700" disabled={isDisabled} />
            </div>
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2">優先度</label>
              <select className="w-full p-2 border rounded-lg opacity-70 border-slate-700">
                <option value="high">高</option>
                <option value="medium" selected>中</option>
                <option value="low">低</option>
              </select>
            </div>
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2">場所の詳細</label>
              <textarea className="w-full p-2 border rounded-lg opacity-70 border-slate-700"></textarea>
            </div>
            <button type="submit" className="w-full p-2 bg-indigo-500 text-white rounded-lg opacity-80 hover:opacity-90">タスクを保存する</button>
          </form>
        </div>
      )}
    </div>
  );
};

export default MapComponent;
