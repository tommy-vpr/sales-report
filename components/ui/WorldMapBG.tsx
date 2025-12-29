import React from "react";
import { WorldMap } from "./world-map";

const WorldMapBG = () => {
  return (
    <div className="fixed inset-0 flex items-center justify-center pointer-events-none -z-10">
      <div className="w-full opacity-70">
        <WorldMap
          dots={[
            {
              start: { lat: 64.2008, lng: -149.4937 }, // Alaska
              end: { lat: 34.0522, lng: -118.2437 }, // Los Angeles
            },
            {
              start: { lat: 64.2008, lng: -149.4937 }, // Alaska
              end: { lat: -15.7975, lng: -47.8919 }, // Brazil
            },
            {
              start: { lat: -15.7975, lng: -47.8919 }, // Brazil
              end: { lat: 38.7223, lng: -9.1393 }, // Lisbon
            },
            {
              start: { lat: 51.5074, lng: -0.1278 }, // London
              end: { lat: 28.6139, lng: 77.209 }, // New Delhi
            },
            {
              start: { lat: 28.6139, lng: 77.209 }, // New Delhi
              end: { lat: 43.1332, lng: 131.9113 }, // Vladivostok
            },
            {
              start: { lat: 28.6139, lng: 77.209 }, // New Delhi
              end: { lat: -1.2921, lng: 36.8219 }, // Nairobi
            },
          ]}
        />
      </div>
    </div>
  );
};

export default WorldMapBG;
