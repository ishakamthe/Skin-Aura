import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Search, MapIcon, Clock, Activity } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import {
  MOCK_AQI_RECORDS, groupByStation,
  getAqiColor, getAqiLevel, getSkinSeverity, findNearestCity,
  type GroupedStation, type AqiRecord,
} from "@/data/mockAqiData";
import { MOCK_PRODUCTS } from "@/data/mockProducts";
import { Skeleton } from "@/components/ui/skeleton";

interface AqiMapPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

const MapUpdater = ({ center, zoom }: { center: [number, number]; zoom: number }) => {
  const map = useMap();
  useEffect(() => { map.setView(center, zoom); }, [center, zoom, map]);
  return null;
};

const PollutantBadge = ({ id, avg }: { id: string; avg: number }) => (
  <span
    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold"
    style={{ backgroundColor: `${getAqiColor(avg)}22`, color: getAqiColor(avg) }}
  >
    {id}: {avg}
  </span>
);

const AqiMapPanel = ({ isOpen, onClose }: AqiMapPanelProps) => {
  const [cityFilter, setCityFilter] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedStation, setSelectedStation] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [geoAttempted, setGeoAttempted] = useState(false);
  const [allStations, setAllStations] = useState<GroupedStation[]>(() => groupByStation(MOCK_AQI_RECORDS));
  const [usingLiveData, setUsingLiveData] = useState(false);
  const navigate = useNavigate();

  // Fetch live AQI data from data.gov.in
  useEffect(() => {
    if (!isOpen) return;

    const apiKey = import.meta.env.VITE_AQI_API_KEY;
    if (!apiKey) {
      // No API key — stay on mock data
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const url = `https://api.data.gov.in/resource/3b01bcb8-0b14-4abf-b6f2-c1bfd384ba69?api-key=${apiKey}&format=json&limit=500`;

    fetch(url)
      .then((res) => {
        if (!res.ok) throw new Error("API error");
        return res.json();
      })
      .then((data) => {
        const records: AqiRecord[] = (data.records || []).map((r: Record<string, string>) => ({
          country: r.country ?? "",
          state: r.state ?? "",
          city: r.city ?? "",
          station: r.station ?? "",
          last_update: r.last_update ?? "",
          latitude: parseFloat(r.latitude) || 0,
          longitude: parseFloat(r.longitude) || 0,
          pollutant_id: r.pollutant_id ?? "",
          pollutant_min: parseFloat(r.pollutant_min) || 0,
          pollutant_max: parseFloat(r.pollutant_max) || 0,
          pollutant_avg: parseFloat(r.pollutant_avg) || 0,
        }));
        if (records.length > 0) {
          setAllStations(groupByStation(records));
          setUsingLiveData(true);
        }
      })
      .catch(() => {
        // CORS or network error — silently fall back to mock data
        setAllStations(groupByStation(MOCK_AQI_RECORDS));
        setUsingLiveData(false);
      })
      .finally(() => setIsLoading(false));
  }, [isOpen]);

  // Auto-detect location
  useEffect(() => {
    if (isOpen && !geoAttempted && navigator.geolocation) {
      setGeoAttempted(true);
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const nearest = findNearestCity(pos.coords.latitude, pos.coords.longitude);
          setCityFilter(nearest);
        },
        () => {},
        { timeout: 5000 }
      );
    }
  }, [isOpen, geoAttempted]);

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

  const mapCenter: [number, number] = filteredStations.length
    ? [filteredStations[0].latitude, filteredStations[0].longitude]
    : [22.5, 78.9];

  const mapZoom = cityFilter && filteredStations.length ? 11 : 5;

  // Skin recommendations based on worst pollutant avg
  const worstAvg = filteredStations.length
    ? Math.max(...filteredStations.map(s => s.dominantAvg))
    : 0;
  const severity = getSkinSeverity(worstAvg);

  const recommendedProducts = useMemo(() => {
    if (severity === "low") {
      return MOCK_PRODUCTS.filter(p => ["Cleanser", "Face Wash"].includes(p.category)).slice(0, 3);
    }
    if (severity === "moderate") {
      return MOCK_PRODUCTS.filter(p => ["Serum", "Sunscreen", "Moisturizer"].includes(p.category)).slice(0, 3);
    }
    return MOCK_PRODUCTS.filter(p => ["Moisturizer", "Serum", "Sunscreen"].includes(p.category)).slice(0, 3);
  }, [severity]);

  const handleStationClick = (station: GroupedStation) => {
    setSelectedStation(station.station);
  };

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
              <button onClick={onClose} className="p-2 rounded-xl hover:bg-muted skin-transition">
                <X size={18} />
              </button>
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
                        radius={12}
                        pathOptions={{
                          color: getAqiColor(s.dominantAvg),
                          fillColor: getAqiColor(s.dominantAvg),
                          fillOpacity: 0.8,
                          weight: 2,
                        }}
                        eventHandlers={{ click: () => handleStationClick(s) }}
                      >
                        <Popup>
                          <div className="text-sm font-sans space-y-2 min-w-[200px]">
                            <p className="font-bold text-foreground">{s.station}</p>
                            <p className="text-xs text-muted-foreground">
                              {s.city}, {s.state}
                            </p>
                            <div className="border-t border-border pt-2 space-y-1.5">
                              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Pollutants</p>
                              {s.pollutants.map(p => (
                                <div key={p.pollutant_id} className="flex items-center justify-between text-xs">
                                  <span className="font-medium">{p.pollutant_id}</span>
                                  <div className="flex gap-2 text-muted-foreground">
                                    <span>Min {p.pollutant_min}</span>
                                    <span>Max {p.pollutant_max}</span>
                                    <span className="font-bold" style={{ color: getAqiColor(p.pollutant_avg) }}>
                                      Avg {p.pollutant_avg}
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
                {/* City search */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                  <input
                    type="text"
                    value={cityFilter}
                    onChange={(e) => { setCityFilter(e.target.value); setShowSuggestions(true); }}
                    onFocus={() => setShowSuggestions(true)}
                    onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                    placeholder="Search city..."
                    className="input-skin pl-10 pr-4 py-2.5 text-sm"
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

                {/* AQI Legend */}
                <div className="flex flex-wrap gap-2">
                  {[
                    { label: "Good", color: getAqiColor(25) },
                    { label: "Moderate", color: getAqiColor(75) },
                    { label: "Unhealthy", color: getAqiColor(150) },
                    { label: "Very Unhealthy", color: getAqiColor(250) },
                    { label: "Hazardous", color: getAqiColor(350) },
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
                      <button
                        onClick={() => setCityFilter("")}
                        className="mt-2 text-xs text-primary font-medium hover:underline"
                      >
                        Show all stations
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                      {filteredStations.map((s) => (
                        <button
                          key={s.station}
                          onClick={() => handleStationClick(s)}
                          className={`card-skin-hover p-3 w-full text-left space-y-1.5 ${
                            selectedStation === s.station ? "ring-2 ring-primary" : ""
                          }`}
                        >
                          <p className="font-semibold text-sm text-foreground truncate">{s.station}</p>
                          <p className="text-xs text-muted-foreground">{s.city}, {s.state}</p>
                          <div className="flex flex-wrap gap-1">
                            {s.pollutants.map(p => (
                              <PollutantBadge key={p.pollutant_id} id={p.pollutant_id} avg={p.pollutant_avg} />
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
                        <img
                          src={product.image}
                          alt={product.name}
                          className="w-10 h-10 rounded-xl object-cover shrink-0"
                        />
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
