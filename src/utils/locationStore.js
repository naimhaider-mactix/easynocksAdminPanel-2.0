/**
 * Simple module-level store for the admin's current coordinates.
 * Set once on login / app load; read by axios interceptors.
 */
let _lat = "22.5726";
let _lng = "88.3639";

export const getLocation = () => ({ lat: _lat, lng: _lng });

export const setLocation = (lat, lng) => {
  _lat = String(lat);
  _lng = String(lng);
};

/** Try to get the browser's real position and update the store */
export const initLocation = () => {
  if (!navigator.geolocation) return;
  navigator.geolocation.getCurrentPosition(
    ({ coords }) => setLocation(coords.latitude, coords.longitude),
    () => {}, // silently fall back to default
  );
};
