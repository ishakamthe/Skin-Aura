// Types matching data.gov.in Air Quality API response
export interface AqiRecord {
  country: string;
  state: string;
  city: string;
  station: string;
  last_update: string;
  latitude: number;
  longitude: number;
  pollutant_id: string;
  pollutant_min: number;
  pollutant_max: number;
  pollutant_avg: number;
}

export interface GroupedStation {
  station: string;
  city: string;
  state: string;
  country: string;
  latitude: number;
  longitude: number;
  last_update: string;
  pollutants: {
    pollutant_id: string;
    pollutant_min: number;
    pollutant_max: number;
    pollutant_avg: number;
  }[];
  dominantAvg: number; // highest pollutant_avg across all pollutants
}

export const getAqiColor = (avg: number): string => {
  if (avg <= 50) return "hsl(142, 71%, 45%)";   // Green
  if (avg <= 100) return "hsl(48, 96%, 53%)";    // Yellow
  if (avg <= 200) return "hsl(25, 95%, 53%)";    // Orange
  if (avg <= 300) return "hsl(0, 84%, 60%)";     // Red
  return "hsl(270, 50%, 50%)";                    // Purple
};

export const getAqiLevel = (avg: number): string => {
  if (avg <= 50) return "Good";
  if (avg <= 100) return "Moderate";
  if (avg <= 200) return "Unhealthy";
  if (avg <= 300) return "Very Unhealthy";
  return "Hazardous";
};

export const getSkinSeverity = (avg: number): "low" | "moderate" | "high" => {
  if (avg <= 100) return "low";
  if (avg <= 200) return "moderate";
  return "high";
};

export const groupByStation = (records: AqiRecord[]): GroupedStation[] => {
  const map = new Map<string, GroupedStation>();
  for (const r of records) {
    const key = `${r.station}_${r.latitude}_${r.longitude}`;
    if (!map.has(key)) {
      map.set(key, {
        station: r.station,
        city: r.city,
        state: r.state,
        country: r.country,
        latitude: r.latitude,
        longitude: r.longitude,
        last_update: r.last_update,
        pollutants: [],
        dominantAvg: 0,
      });
    }
    const group = map.get(key)!;
    group.pollutants.push({
      pollutant_id: r.pollutant_id,
      pollutant_min: r.pollutant_min,
      pollutant_max: r.pollutant_max,
      pollutant_avg: r.pollutant_avg,
    });
    if (r.pollutant_avg > group.dominantAvg) {
      group.dominantAvg = r.pollutant_avg;
    }
    // Keep latest update time
    if (r.last_update > group.last_update) {
      group.last_update = r.last_update;
    }
  }
  return Array.from(map.values());
};

// ── Mock data matching data.gov.in structure ──

export const MOCK_AQI_RECORDS: AqiRecord[] = [
  // Delhi – Anand Vihar
  { country: "India", state: "Delhi", city: "Delhi", station: "Anand Vihar, Delhi - DPCC", last_update: "13-03-2026 15:00", latitude: 28.6468, longitude: 77.316, pollutant_id: "PM2.5", pollutant_min: 120, pollutant_max: 195, pollutant_avg: 162 },
  { country: "India", state: "Delhi", city: "Delhi", station: "Anand Vihar, Delhi - DPCC", last_update: "13-03-2026 15:00", latitude: 28.6468, longitude: 77.316, pollutant_id: "PM10", pollutant_min: 180, pollutant_max: 310, pollutant_avg: 245 },
  { country: "India", state: "Delhi", city: "Delhi", station: "Anand Vihar, Delhi - DPCC", last_update: "13-03-2026 15:00", latitude: 28.6468, longitude: 77.316, pollutant_id: "NO2", pollutant_min: 40, pollutant_max: 78, pollutant_avg: 58 },
  { country: "India", state: "Delhi", city: "Delhi", station: "Anand Vihar, Delhi - DPCC", last_update: "13-03-2026 15:00", latitude: 28.6468, longitude: 77.316, pollutant_id: "SO2", pollutant_min: 8, pollutant_max: 18, pollutant_avg: 12 },

  // Delhi – ITO
  { country: "India", state: "Delhi", city: "Delhi", station: "ITO, Delhi - DPCC", last_update: "13-03-2026 14:30", latitude: 28.6289, longitude: 77.2405, pollutant_id: "PM2.5", pollutant_min: 95, pollutant_max: 160, pollutant_avg: 130 },
  { country: "India", state: "Delhi", city: "Delhi", station: "ITO, Delhi - DPCC", last_update: "13-03-2026 14:30", latitude: 28.6289, longitude: 77.2405, pollutant_id: "PM10", pollutant_min: 140, pollutant_max: 260, pollutant_avg: 198 },
  { country: "India", state: "Delhi", city: "Delhi", station: "ITO, Delhi - DPCC", last_update: "13-03-2026 14:30", latitude: 28.6289, longitude: 77.2405, pollutant_id: "CO", pollutant_min: 1.2, pollutant_max: 2.8, pollutant_avg: 1.9 },

  // Delhi – R K Puram
  { country: "India", state: "Delhi", city: "Delhi", station: "R K Puram, Delhi - DPCC", last_update: "13-03-2026 15:00", latitude: 28.5635, longitude: 77.1726, pollutant_id: "PM2.5", pollutant_min: 105, pollutant_max: 175, pollutant_avg: 142 },
  { country: "India", state: "Delhi", city: "Delhi", station: "R K Puram, Delhi - DPCC", last_update: "13-03-2026 15:00", latitude: 28.5635, longitude: 77.1726, pollutant_id: "OZONE", pollutant_min: 20, pollutant_max: 55, pollutant_avg: 38 },

  // Mumbai – Bandra
  { country: "India", state: "Maharashtra", city: "Mumbai", station: "Bandra Kurla Complex, Mumbai - MPCB", last_update: "13-03-2026 14:00", latitude: 19.0596, longitude: 72.8656, pollutant_id: "PM2.5", pollutant_min: 38, pollutant_max: 72, pollutant_avg: 55 },
  { country: "India", state: "Maharashtra", city: "Mumbai", station: "Bandra Kurla Complex, Mumbai - MPCB", last_update: "13-03-2026 14:00", latitude: 19.0596, longitude: 72.8656, pollutant_id: "PM10", pollutant_min: 60, pollutant_max: 110, pollutant_avg: 82 },
  { country: "India", state: "Maharashtra", city: "Mumbai", station: "Bandra Kurla Complex, Mumbai - MPCB", last_update: "13-03-2026 14:00", latitude: 19.0596, longitude: 72.8656, pollutant_id: "NO2", pollutant_min: 18, pollutant_max: 42, pollutant_avg: 30 },
  { country: "India", state: "Maharashtra", city: "Mumbai", station: "Bandra Kurla Complex, Mumbai - MPCB", last_update: "13-03-2026 14:00", latitude: 19.0596, longitude: 72.8656, pollutant_id: "SO2", pollutant_min: 5, pollutant_max: 14, pollutant_avg: 9 },

  // Mumbai – Colaba
  { country: "India", state: "Maharashtra", city: "Mumbai", station: "Colaba, Mumbai - MPCB", last_update: "13-03-2026 14:00", latitude: 18.9067, longitude: 72.8147, pollutant_id: "PM2.5", pollutant_min: 28, pollutant_max: 58, pollutant_avg: 42 },
  { country: "India", state: "Maharashtra", city: "Mumbai", station: "Colaba, Mumbai - MPCB", last_update: "13-03-2026 14:00", latitude: 18.9067, longitude: 72.8147, pollutant_id: "OZONE", pollutant_min: 15, pollutant_max: 40, pollutant_avg: 28 },

  // Bengaluru – Silk Board
  { country: "India", state: "Karnataka", city: "Bengaluru", station: "Silk Board, Bengaluru - KSPCB", last_update: "13-03-2026 13:30", latitude: 12.917, longitude: 77.6227, pollutant_id: "PM2.5", pollutant_min: 18, pollutant_max: 40, pollutant_avg: 28 },
  { country: "India", state: "Karnataka", city: "Bengaluru", station: "Silk Board, Bengaluru - KSPCB", last_update: "13-03-2026 13:30", latitude: 12.917, longitude: 77.6227, pollutant_id: "PM10", pollutant_min: 32, pollutant_max: 65, pollutant_avg: 46 },
  { country: "India", state: "Karnataka", city: "Bengaluru", station: "Silk Board, Bengaluru - KSPCB", last_update: "13-03-2026 13:30", latitude: 12.917, longitude: 77.6227, pollutant_id: "NO2", pollutant_min: 12, pollutant_max: 30, pollutant_avg: 20 },
  { country: "India", state: "Karnataka", city: "Bengaluru", station: "Silk Board, Bengaluru - KSPCB", last_update: "13-03-2026 13:30", latitude: 12.917, longitude: 77.6227, pollutant_id: "NH3", pollutant_min: 8, pollutant_max: 22, pollutant_avg: 14 },

  // Bengaluru – Peenya
  { country: "India", state: "Karnataka", city: "Bengaluru", station: "Peenya, Bengaluru - KSPCB", last_update: "13-03-2026 13:00", latitude: 13.0285, longitude: 77.5193, pollutant_id: "PM2.5", pollutant_min: 14, pollutant_max: 32, pollutant_avg: 22 },
  { country: "India", state: "Karnataka", city: "Bengaluru", station: "Peenya, Bengaluru - KSPCB", last_update: "13-03-2026 13:00", latitude: 13.0285, longitude: 77.5193, pollutant_id: "SO2", pollutant_min: 4, pollutant_max: 12, pollutant_avg: 7 },

  // Chennai – Alandur
  { country: "India", state: "Tamil Nadu", city: "Chennai", station: "Alandur Bus Depot, Chennai - TNPCB", last_update: "13-03-2026 14:00", latitude: 13.0025, longitude: 80.2035, pollutant_id: "PM2.5", pollutant_min: 30, pollutant_max: 62, pollutant_avg: 48 },
  { country: "India", state: "Tamil Nadu", city: "Chennai", station: "Alandur Bus Depot, Chennai - TNPCB", last_update: "13-03-2026 14:00", latitude: 13.0025, longitude: 80.2035, pollutant_id: "PM10", pollutant_min: 50, pollutant_max: 95, pollutant_avg: 70 },
  { country: "India", state: "Tamil Nadu", city: "Chennai", station: "Alandur Bus Depot, Chennai - TNPCB", last_update: "13-03-2026 14:00", latitude: 13.0025, longitude: 80.2035, pollutant_id: "NO2", pollutant_min: 15, pollutant_max: 35, pollutant_avg: 24 },

  // Chennai – Manali
  { country: "India", state: "Tamil Nadu", city: "Chennai", station: "Manali, Chennai - TNPCB", last_update: "13-03-2026 14:00", latitude: 13.1631, longitude: 80.2613, pollutant_id: "PM2.5", pollutant_min: 35, pollutant_max: 68, pollutant_avg: 52 },
  { country: "India", state: "Tamil Nadu", city: "Chennai", station: "Manali, Chennai - TNPCB", last_update: "13-03-2026 14:00", latitude: 13.1631, longitude: 80.2613, pollutant_id: "SO2", pollutant_min: 10, pollutant_max: 28, pollutant_avg: 18 },

  // Kolkata – Victoria Memorial
  { country: "India", state: "West Bengal", city: "Kolkata", station: "Victoria Memorial, Kolkata - WBPCB", last_update: "13-03-2026 13:00", latitude: 22.5448, longitude: 88.3426, pollutant_id: "PM2.5", pollutant_min: 65, pollutant_max: 120, pollutant_avg: 95 },
  { country: "India", state: "West Bengal", city: "Kolkata", station: "Victoria Memorial, Kolkata - WBPCB", last_update: "13-03-2026 13:00", latitude: 22.5448, longitude: 88.3426, pollutant_id: "PM10", pollutant_min: 100, pollutant_max: 185, pollutant_avg: 140 },
  { country: "India", state: "West Bengal", city: "Kolkata", station: "Victoria Memorial, Kolkata - WBPCB", last_update: "13-03-2026 13:00", latitude: 22.5448, longitude: 88.3426, pollutant_id: "NO2", pollutant_min: 25, pollutant_max: 52, pollutant_avg: 38 },
  { country: "India", state: "West Bengal", city: "Kolkata", station: "Victoria Memorial, Kolkata - WBPCB", last_update: "13-03-2026 13:00", latitude: 22.5448, longitude: 88.3426, pollutant_id: "CO", pollutant_min: 0.8, pollutant_max: 2.2, pollutant_avg: 1.4 },

  // Kolkata – Jadavpur
  { country: "India", state: "West Bengal", city: "Kolkata", station: "Jadavpur, Kolkata - WBPCB", last_update: "13-03-2026 13:00", latitude: 22.4968, longitude: 88.3714, pollutant_id: "PM2.5", pollutant_min: 72, pollutant_max: 135, pollutant_avg: 108 },
  { country: "India", state: "West Bengal", city: "Kolkata", station: "Jadavpur, Kolkata - WBPCB", last_update: "13-03-2026 13:00", latitude: 22.4968, longitude: 88.3714, pollutant_id: "OZONE", pollutant_min: 18, pollutant_max: 45, pollutant_avg: 32 },

  // Hyderabad – Zoo Park
  { country: "India", state: "Telangana", city: "Hyderabad", station: "Zoo Park, Hyderabad - TSPCB", last_update: "13-03-2026 14:30", latitude: 17.3504, longitude: 78.4510, pollutant_id: "PM2.5", pollutant_min: 25, pollutant_max: 55, pollutant_avg: 40 },
  { country: "India", state: "Telangana", city: "Hyderabad", station: "Zoo Park, Hyderabad - TSPCB", last_update: "13-03-2026 14:30", latitude: 17.3504, longitude: 78.4510, pollutant_id: "PM10", pollutant_min: 45, pollutant_max: 88, pollutant_avg: 65 },
  { country: "India", state: "Telangana", city: "Hyderabad", station: "Zoo Park, Hyderabad - TSPCB", last_update: "13-03-2026 14:30", latitude: 17.3504, longitude: 78.4510, pollutant_id: "NO2", pollutant_min: 10, pollutant_max: 28, pollutant_avg: 18 },

  // Chittoor – Gangineni Cheruvu
  { country: "India", state: "Andhra Pradesh", city: "Chittoor", station: "Gangineni Cheruvu, Chittoor - APPCB", last_update: "13-03-2026 15:00", latitude: 13.2172, longitude: 79.1003, pollutant_id: "PM10", pollutant_min: 52, pollutant_max: 76, pollutant_avg: 63 },
  { country: "India", state: "Andhra Pradesh", city: "Chittoor", station: "Gangineni Cheruvu, Chittoor - APPCB", last_update: "13-03-2026 15:00", latitude: 13.2172, longitude: 79.1003, pollutant_id: "NO2", pollutant_min: 18, pollutant_max: 38, pollutant_avg: 29 },
  { country: "India", state: "Andhra Pradesh", city: "Chittoor", station: "Gangineni Cheruvu, Chittoor - APPCB", last_update: "13-03-2026 15:00", latitude: 13.2172, longitude: 79.1003, pollutant_id: "OZONE", pollutant_min: 12, pollutant_max: 35, pollutant_avg: 25 },
  { country: "India", state: "Andhra Pradesh", city: "Chittoor", station: "Gangineni Cheruvu, Chittoor - APPCB", last_update: "13-03-2026 15:00", latitude: 13.2172, longitude: 79.1003, pollutant_id: "SO2", pollutant_min: 6, pollutant_max: 18, pollutant_avg: 14 },
];

// Unique city list for search
export const AVAILABLE_CITIES = [...new Set(MOCK_AQI_RECORDS.map(r => r.city))].sort();

// Find nearest city from coordinates
export const findNearestCity = (lat: number, lng: number): string => {
  let nearest = MOCK_AQI_RECORDS[0].city;
  let minDist = Infinity;
  for (const r of MOCK_AQI_RECORDS) {
    const dist = Math.sqrt((lat - r.latitude) ** 2 + (lng - r.longitude) ** 2);
    if (dist < minDist) {
      minDist = dist;
      nearest = r.city;
    }
  }
  return nearest;
};
