import { AnimatePresence, motion } from "framer-motion";
import {
  AlertTriangle,
  Bell,
  Cloud,
  CloudDrizzle,
  CloudRain,
  Droplets,
  Sun,
  Wind,
} from "lucide-react";
import { useEffect, useState } from "react";
import client from "../api/client";
import Loader from "../components/Loader.jsx";

function iconFor(condition = "") {
  const c = condition.toLowerCase();
  if (c.includes("heavy rain")) return CloudRain;
  if (c.includes("shower")) return CloudDrizzle;
  if (c.includes("overcast") || c.includes("humid")) return Cloud;
  return Sun;
}

export default function Weather() {
  const [farms, setFarms] = useState([]);
  const [farmId, setFarmId] = useState("");
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);
  const [alertResult, setAlertResult] = useState(null);

  useEffect(() => {
    client.get("/api/farms").then((res) => {
      setFarms(res.data);
      if (res.data.length) setFarmId(String(res.data[0].id));
      else setLoading(false);
    });
  }, []);

  useEffect(() => {
    if (!farmId) return;
    setLoading(true);
    setAlertResult(null);
    client
      .get(`/api/weather/farm/${farmId}`)
      .then((res) => setWeather(res.data))
      .finally(() => setLoading(false));
  }, [farmId]);

  const checkAlerts = async () => {
    setChecking(true);
    try {
      const res = await client.post(`/api/weather/farm/${farmId}/check-alerts`);
      setAlertResult(res.data);
    } finally {
      setChecking(false);
    }
  };

  if (!farms.length && !loading) {
    return <div className="card p-10 text-center text-forest-600">Add a farm first to see its weather forecast.</div>;
  }

  const HeroIcon = weather ? iconFor(weather.current.condition) : Sun;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-display font-semibold text-forest-950">Weather intelligence</h1>
          <p className="text-forest-600 mt-1">Forecast-driven irrigation and field guidance.</p>
        </div>
        <select className="input-field !w-auto" value={farmId} onChange={(e) => setFarmId(e.target.value)}>
          {farms.map((f) => (
            <option key={f.id} value={f.id}>
              {f.name}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <Loader />
      ) : (
        weather && (
          <>
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="card p-8 flex flex-col sm:flex-row items-center justify-between gap-6 bg-gradient-to-br from-forest-800 to-forest-950 text-wheat-50 border-none"
            >
              <div>
                <p className="text-sm text-wheat-200">{weather.location}</p>
                <p className="text-5xl font-display font-semibold mt-1">{weather.current.temperature_c}°C</p>
                <p className="text-wheat-200 mt-1">{weather.current.condition}</p>
              </div>
              <motion.div
                animate={{ y: [0, -6, 0] }}
                transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
              >
                <HeroIcon size={72} className="text-wheat-300" />
              </motion.div>
              <div className="flex gap-6 text-sm">
                <div className="flex items-center gap-2">
                  <Droplets size={18} className="text-wheat-300" />
                  <div>
                    <p className="text-wheat-200 text-xs">Humidity</p>
                    <p className="font-medium">{weather.current.humidity_pct}%</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Wind size={18} className="text-wheat-300" />
                  <div>
                    <p className="text-wheat-200 text-xs">Wind</p>
                    <p className="font-medium">{weather.current.wind_speed_kmh} km/h</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <CloudRain size={18} className="text-wheat-300" />
                  <div>
                    <p className="text-wheat-200 text-xs">Rain chance</p>
                    <p className="font-medium">{weather.current.rain_probability_pct}%</p>
                  </div>
                </div>
              </div>
            </motion.div>

            <div>
              <h3 className="font-display font-semibold text-forest-950 mb-3">5-day forecast</h3>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                {weather.forecast.map((day, i) => {
                  const DayIcon = iconFor(day.condition);
                  return (
                    <motion.div
                      key={day.date}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.06 }}
                      className="card p-4 text-center"
                    >
                      <p className="text-xs text-forest-500">
                        {new Date(day.date).toLocaleDateString(undefined, { weekday: "short" })}
                      </p>
                      <DayIcon size={26} className="mx-auto my-2 text-forest-600" />
                      <p className="font-display font-semibold text-forest-950">{day.temperature_c}°C</p>
                      <p className="text-xs text-forest-500 mt-1">{day.rain_probability_pct}% rain</p>
                    </motion.div>
                  );
                })}
              </div>
            </div>

            <div className="card p-6">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-display font-semibold text-forest-950">Advisories</h3>
                <motion.button whileTap={{ scale: 0.97 }} onClick={checkAlerts} disabled={checking} className="btn-secondary text-sm py-2">
                  <Bell size={15} />
                  {checking ? "Checking…" : "Check for alerts"}
                </motion.button>
              </div>
              <ul className="space-y-2">
                {weather.advisories.map((a, i) => (
                  <motion.li
                    key={i}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.08 }}
                    className="flex items-start gap-2 text-sm text-forest-700"
                  >
                    <AlertTriangle size={15} className="text-wheat-600 mt-0.5 shrink-0" />
                    {a}
                  </motion.li>
                ))}
              </ul>

              <AnimatePresence>
                {alertResult && (
                  <motion.p
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    className="text-sm mt-4 pt-4 border-t border-forest-100 text-forest-600"
                  >
                    {alertResult.alert_created
                      ? "A new rainfall alert was created for this farm."
                      : "No new alert needed — rain probability is below the threshold."}
                  </motion.p>
                )}
              </AnimatePresence>
            </div>
          </>
        )
      )}
    </div>
  );
}
