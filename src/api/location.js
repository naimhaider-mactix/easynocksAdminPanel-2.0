import axios from "axios";

/**
 * Convert location string → lat/lng
 */
export const getCoordinates = async (query) => {
  const res = await axios.get("https://nominatim.openstreetmap.org/search", {
    params: {
      q: query,
      format: "json",
      limit: 1,
    },
  });

  if (!res.data?.length) {
    throw new Error("Location not found");
  }
  console.log("res", res);

  return {
    lat: res.data[0].lat,
    lng: res.data[0].lon,
  };
};

export const searchLocations = async (query) => {
  if (!query || query.length < 3) return [];

  const res = await fetch(`https://photon.komoot.io/api/?q=${query}&limit=5`);

  const data = await res.json();

  return data.features.map((f) => ({
    name: f.properties.name + ", " + f.properties.state || "",
    lat: f.geometry.coordinates[1],
    lng: f.geometry.coordinates[0],
  }));
};
