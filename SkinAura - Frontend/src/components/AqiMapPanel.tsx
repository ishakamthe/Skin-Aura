import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Search, MapIcon, Clock, Activity, LocateFixed } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import {
  MOCK_AQI_RECORDS, groupByStation,
  getAqiColor, getAqiLevel, getSkinSeverity,
  type GroupedStation, type AqiRecord,
} from "@/data/mockAqiData";
import { MOCK_PRODUCTS } from "@/data/mockProducts";
import { Skeleton } from "@/components/ui/skeleton";

const API_KEY = "579b464db66ec23bdd000001431354d2fb64423470cd33c84679ad6d";

interface AqiMapPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

const MapUpdater = ({ center, zoom }: { center: [number, number]; zoom: number }) => {
  const map = useMap();
  useEffect(() => { map.setView(center, zoom); }, [center, zoom, map]);
  return null;
};

const PollutantBadge = ({ id, avg, aqi }: { id: string; avg: number; aqi: number }) => (
  <span
    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold"
    style={{ backgroundColor: `${getAqiColor(aqi)}22`, color: getAqiColor(aqi) }}
  >
    {id}: {avg} <span className="opacity-60">(AQI {aqi})</span>
  </span>
);

// Find nearest station by haversine distance
const findNearestStation = (lat: number, lng: number, stations: GroupedStation[]): GroupedStation | null => {
  if (!stations.length) return null;
  let nearest = stations[0];
  let minDist = Infinity;
  for (const s of stations) {
    const dLat = (s.latitude - lat) * Math.PI / 180;
    const dLng = (s.longitude - lng) * Math.PI / 180;
    const a = Math.sin(dLat / 2) ** 2 +
      Math.cos(lat * Math.PI / 180) * Math.cos(s.latitude * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
    const dist = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    if (dist < minDist) { minDist = dist; nearest = s; }
  }
  return nearest;
};

const AqiMapPanel = ({ isOpen, onClose }: AqiMapPanelProps) => {
  const [cityFilter, setCityFilter] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedStation, setSelectedStation] = useState<GroupedStation | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLocating, setIsLocating] = useState(false);
  const [allStations, setAllStations] = useState<GroupedStation[]>(() => groupByStation(MOCK_AQI_RECORDS));
  const [usingLiveData, setUsingLiveData] = useState(false);
  const [mapCenter, setMapCenter] = useState<[number, number]>([22.5, 78.9]);
  const [mapZoom, setMapZoom] = useState(5);
  const navigate = useNavigate();

  // Fetch live AQI data on open
  useEffect(() => {
    if (!isOpen) return;
    setIsLoading(true);

    const url = `https://api.data.gov.in/resource/3b01bcb8-0b14-4abf-b6f2-c1bfd384ba69?api-key=${API_KEY}&format=json&limit=all`;

    fetch(url)
      .then((res) => {
        if (!res.ok) throw new Error("API error");
        return res.json();
      })
      .then((data) => {
        // Log first record to inspect actual API field names
        // API uses avg_value/min_value/max_value (not pollutant_avg/min/max like the CSV)
        const records: AqiRecord[] = (data.records || [])
          .filter((r: Record<string, string>) =>
            r.avg_value && r.avg_value !== "NA" && r.avg_value !== "" &&
            !isNaN(parseFloat(r.avg_value)) && parseFloat(r.avg_value) > 0
          )
          .map((r: Record<string, string>) => ({
            country: r.country ?? "",
            state: r.state ?? "",
            city: r.city ?? "",
            station: r.station ?? "",
            last_update: r.last_update ?? "",
            latitude: parseFloat(r.latitude),
            longitude: parseFloat(r.longitude),
            pollutant_id: r.pollutant_id ?? "",
            pollutant_min: parseFloat(r.min_value) || 0,
            pollutant_max: parseFloat(r.max_value) || 0,
            pollutant_avg: parseFloat(r.avg_value),
          }));
        if (records.length > 0) {
          const stations = groupByStation(records);
          setAllStations(stations);
          setUsingLiveData(true);
          return stations;
        }
        return groupByStation(MOCK_AQI_RECORDS);
      })
      .catch(() => {
        setUsingLiveData(false);
        return groupByStation(MOCK_AQI_RECORDS);
      })
      .then((stations) => {
        // Auto-detect location after data is ready
        setIsLoading(false);
        autoLocate(stations);
      });
  }, [isOpen]);

  const [detectedCoords, setDetectedCoords] = useState<{ lat: number; lng: number; accuracy: number } | null>(null);

  const autoLocate = (stations: GroupedStation[]) => {
    if (!navigator.geolocation) return;
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude, accuracy } = pos.coords;
        setDetectedCoords({ lat: latitude, lng: longitude, accuracy: Math.round(accuracy) });
        const nearest = findNearestStation(latitude, longitude, stations);
        if (nearest) {
          setSelectedStation(nearest);
          setCityFilter(nearest.city);
          setMapCenter([nearest.latitude, nearest.longitude]);
          setMapZoom(12);
        }
        setIsLocating(false);
      },
      () => setIsLocating(false),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const handleLocateMe = () => {
    autoLocate(allStations);
  };

  const filteredStations = useMemo(() => {
    if (!cityFilter) return allStations;
    return allStations.filter(s => s.city.toLowerCase().includes(cityFilter.toLowerCase()));
  }, [allStations, cityFilter]);

  const availableCities = useMemo(() =>
    [...new Set(allStations.map(s => s.city))].sort()
  , [allStations]);

  const filteredCities = availableCities.filter(c =>
    c.toLowerCase().includes(cityFilter.toLowerCase())
  );

  const worstAvg = filteredStations.length
    ? Math.max(...filteredStations.map(s => s.dominantAvg))
    : 0;
  const severity = getSkinSeverity(worstAvg);

  const recommendedProducts = useMemo(() => {
    if (severity === "low") return MOCK_PRODUCTS.filter(p => ["Cleanser", "Face Wash"].includes(p.category)).slice(0, 3);
    if (severity === "moderate") return MOCK_PRODUCTS.filter(p => ["Serum", "Sunscreen", "Moisturizer"].includes(p.category)).slice(0, 3);
    return MOCK_PRODUCTS.filter(p => ["Moisturizer", "Serum", "Sunscreen"].includes(p.category)).slice(0, 3);
  }, [severity]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-foreground/40 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="absolute inset-x-0 bottom-0 top-8 md:top-12 bg-background rounded-t-3xl overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                  <MapIcon size={16} className="text-primary" />
                </div>
                <h2 className="text-lg font-bold text-foreground">AQI & Skin Protection</h2>
                {usingLiveData
                  ? <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700 font-medium">● Live</span>
                  : <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground font-medium">Demo data</span>
                }
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => { onClose(); navigate("/help?tab=aqi"); }}
                  title="AQI Help"
                  className="p-2 rounded-xl hover:bg-muted skin-transition text-muted-foreground hover:text-foreground text-sm font-bold w-9 h-9 flex items-center justify-center border border-border"
                >
                  ?
                </button>
                <button onClick={onClose} className="p-2 rounded-xl hover:bg-muted skin-transition">
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="flex flex-col md:flex-row flex-1 overflow-hidden">
              {/* Map */}
              <div className="w-full md:w-[65%] h-64 md:h-full relative">
                {isLoading ? (
                  <div className="w-full h-full flex items-center justify-center bg-muted/30">
                    <div className="space-y-3 w-3/4">
                      <Skeleton className="h-6 w-1/2" />
                      <Skeleton className="h-48 w-full rounded-2xl" />
                      <Skeleton className="h-4 w-2/3" />
                    </div>
                  </div>
                ) : (
                  <MapContainer
                    center={mapCenter}
                    zoom={mapZoom}
                    className="w-full h-full z-0"
                    zoomControl={false}
                    attributionControl={false}
                  >
                    <TileLayer url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png" />
                    <MapUpdater center={mapCenter} zoom={mapZoom} />
                    {filteredStations.map((s) => (
                      <CircleMarker
                        key={s.station}
                        center={[s.latitude, s.longitude]}
                        radius={selectedStation?.station === s.station ? 16 : 10}
                        pathOptions={{
                          color: getAqiColor(s.dominantAvg),
                          fillColor: getAqiColor(s.dominantAvg),
                          fillOpacity: selectedStation?.station === s.station ? 1 : 0.7,
                          weight: selectedStation?.station === s.station ? 3 : 2,
                        }}
                        eventHandlers={{ click: () => { setSelectedStation(s); setMapCenter([s.latitude, s.longitude]); setMapZoom(12); } }}
                      >
                        <Popup>
                          <div className="text-sm font-sans space-y-2 min-w-[200px]">
                            <p className="font-bold text-foreground">{s.station}</p>
                            <p className="text-xs text-muted-foreground">{s.city}, {s.state}</p>
                            <div className="border-t border-border pt-2 space-y-1.5">
                              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Pollutants</p>
                              {s.pollutants.map(p => (
                                <div key={p.pollutant_id} className="flex items-center justify-between text-xs">
                                  <span className="font-medium">{p.pollutant_id}</span>
                                  <div className="flex gap-2 text-muted-foreground">
                                    <span>{p.pollutant_avg} µg/m³</span>
                                    <span className="font-bold" style={{ color: getAqiColor(p.aqi) }}>
                                      AQI {p.aqi}
                                    </span>
                                  </div>
                                </div>
                              ))}
                            </div>
                            <div className="border-t border-border pt-1.5 flex items-center gap-1 text-xs text-muted-foreground">
                              <Clock size={10} />
                              {s.last_update}
                            </div>
                          </div>
                        </Popup>
                      </CircleMarker>
                    ))}
                  </MapContainer>
                )}
              </div>

              {/* Right panel */}
              <div className="w-full md:w-[35%] border-t md:border-t-0 md:border-l border-border overflow-y-auto p-5 space-y-5">

                {/* City search + locate button */}
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                    <input
                      type="text"
                      value={cityFilter}
                      onChange={(e) => { setCityFilter(e.target.value); setShowSuggestions(true); }}
                      onFocus={() => setShowSuggestions(true)}
                      onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                      placeholder="Search city..."
                      className="input-skin pl-10 pr-4 py-2.5 text-sm w-full"
                    />
                    {showSuggestions && cityFilter && (
                      <div className="absolute top-full mt-1 left-0 right-0 bg-card rounded-xl border border-border shadow-lg z-10 overflow-hidden">
                        {filteredCities.length > 0 ? filteredCities.map((c) => (
                          <button
                            key={c}
                            onMouseDown={() => { setCityFilter(c); setShowSuggestions(false); }}
                            className="w-full text-left px-4 py-2.5 text-sm hover:bg-muted skin-transition"
                          >
                            {c}
                          </button>
                        )) : (
                          <p className="px-4 py-2.5 text-sm text-muted-foreground">No cities found</p>
                        )}
                      </div>
                    )}
                  </div>
                  <button
                    onClick={handleLocateMe}
                    disabled={isLocating}
                    title="Detect my location"
                    className="shrink-0 w-10 h-10 flex items-center justify-center rounded-xl border border-border hover:bg-primary/10 hover:border-primary skin-transition disabled:opacity-50"
                  >
                    <LocateFixed size={16} className={`text-primary ${isLocating ? "animate-pulse" : ""}`} />
                  </button>
                </div>

                {/* Debug: detected coords */}
                {detectedCoords && (
                  <div className="text-xs text-muted-foreground bg-muted/50 rounded-xl px-3 py-2 space-y-0.5">
                    <p className="font-semibold text-foreground">📍 Your detected location</p>
                    <p>Lat: {detectedCoords.lat.toFixed(5)}, Lng: {detectedCoords.lng.toFixed(5)}</p>
                    <p>Accuracy: ±{detectedCoords.accuracy}m {detectedCoords.accuracy > 1000 ? "⚠️ Low accuracy" : "✓"}</p>
                  </div>
                )}

                {/* Nearest station card */}
                {selectedStation && (
                  <motion.div
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="card-skin p-4 space-y-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-xs font-bold text-primary uppercase tracking-widest mb-0.5">Nearest Station</p>
                        <p className="font-bold text-sm text-foreground leading-snug">{selectedStation.station}</p>
                        <p className="text-xs text-muted-foreground">{selectedStation.city}, {selectedStation.state}</p>
                      </div>
                      <span
                        className="shrink-0 text-xs font-bold px-2 py-1 rounded-lg"
                        style={{ backgroundColor: `${getAqiColor(selectedStation.dominantAvg)}22`, color: getAqiColor(selectedStation.dominantAvg) }}
                      >
                        {getAqiLevel(selectedStation.dominantAvg)}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {selectedStation.pollutants.map(p => (
                        <PollutantBadge key={p.pollutant_id} id={p.pollutant_id} avg={p.pollutant_avg} aqi={p.aqi} />
                      ))}
                    </div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground/70">
                      <Clock size={10} />
                      {selectedStation.last_update}
                    </div>
                  </motion.div>
                )}

                {/* AQI Legend */}
                <div className="flex flex-wrap gap-2">
                  {[
                    { label: "Good (0-50)", color: getAqiColor(25) },
                    { label: "Satisfactory (51-100)", color: getAqiColor(75) },
                    { label: "Moderate (101-200)", color: getAqiColor(150) },
                    { label: "Poor (201-300)", color: getAqiColor(250) },
                    { label: "Very Poor (301-400)", color: getAqiColor(350) },
                    { label: "Severe (400+)", color: getAqiColor(450) },
                  ].map(l => (
                    <span key={l.label} className="flex items-center gap-1 text-xs text-muted-foreground">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: l.color }} />
                      {l.label}
                    </span>
                  ))}
                </div>

                {/* Station list */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Activity size={16} className="text-primary" />
                    <h4 className="font-semibold text-sm text-foreground">
                      Stations {cityFilter && `in ${cityFilter}`} ({filteredStations.length})
                    </h4>
                  </div>

                  {isLoading ? (
                    <div className="space-y-3">
                      {[1, 2, 3].map(i => (
                        <div key={i} className="card-skin p-3 space-y-2">
                          <Skeleton className="h-4 w-3/4" />
                          <Skeleton className="h-3 w-1/2" />
                          <div className="flex gap-2">
                            <Skeleton className="h-5 w-16 rounded-full" />
                            <Skeleton className="h-5 w-16 rounded-full" />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : filteredStations.length === 0 ? (
                    <div className="card-skin p-6 text-center">
                      <p className="text-sm text-muted-foreground">No stations found for this city.</p>
                      <button onClick={() => setCityFilter("")} className="mt-2 text-xs text-primary font-medium hover:underline">
                        Show all stations
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                      {filteredStations.map((s) => (
                        <button
                          key={s.station}
                          onClick={() => { setSelectedStation(s); setMapCenter([s.latitude, s.longitude]); setMapZoom(12); }}
                          className={`card-skin-hover p-3 w-full text-left space-y-1.5 ${selectedStation?.station === s.station ? "ring-2 ring-primary" : ""}`}
                        >
                          <p className="font-semibold text-sm text-foreground truncate">{s.station}</p>
                          <p className="text-xs text-muted-foreground">{s.city}, {s.state}</p>
                          <div className="flex flex-wrap gap-1">
                            {s.pollutants.map(p => (
                              <PollutantBadge key={p.pollutant_id} id={p.pollutant_id} avg={p.pollutant_avg} aqi={p.aqi} />
                            ))}
                          </div>
                          <div className="flex items-center gap-1 text-xs text-muted-foreground/70">
                            <Clock size={10} />
                            {s.last_update}
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Skin recommendation */}
                <div>
                  <h4 className="font-semibold text-sm text-foreground mb-1">Recommended Skin Protection</h4>
                  <p className="text-xs text-muted-foreground mb-3">
                    Based on {getAqiLevel(worstAvg)} air quality (worst avg: {worstAvg})
                  </p>
                  <div className="space-y-2">
                    {recommendedProducts.map((product) => (
                      <button
                        key={product.id}
                        onClick={() => { onClose(); navigate(`/product/${product.id}`); }}
                        className="card-skin-hover p-3 flex items-center gap-3 w-full text-left"
                      >
                        <img src={product.image} alt={product.name} className="w-10 h-10 rounded-xl object-cover shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm text-foreground truncate">{product.name}</p>
                          <p className="text-xs text-muted-foreground">{product.brand} · {product.category}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default AqiMapPanel;