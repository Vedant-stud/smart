import { AnimatePresence, motion } from "framer-motion";
import { Beaker, Droplets, Download, FileText, MapPin, Plus, Sparkles, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import client from "../api/client";
import Loader from "../components/Loader.jsx";
import Modal from "../components/Modal.jsx";

const emptyForm = {
  name: "",
  location_text: "",
  latitude: "",
  longitude: "",
  area_acres: "",
  soil_type: "",
  irrigation_available: false,
  irrigation_source: "",
};

const emptySoil = {
  ph: "",
  nitrogen_kg_ha: "",
  phosphorus_kg_ha: "",
  potassium_kg_ha: "",
  organic_carbon_pct: "",
  moisture_pct: "",
};

export default function Farms() {
  const [farms, setFarms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const [recoFarm, setRecoFarm] = useState(null);
  const [recoSeason, setRecoSeason] = useState("");
  const [recommendations, setRecommendations] = useState([]);
  const [recoLoading, setRecoLoading] = useState(false);

  const [soilFarm, setSoilFarm] = useState(null);
  const [soilForm, setSoilForm] = useState(emptySoil);
  const [soilResult, setSoilResult] = useState(null);
  const [soilSaving, setSoilSaving] = useState(false);

  const [reportingFarmId, setReportingFarmId] = useState(null);

  const loadFarms = () => {
    setLoading(true);
    client
      .get("/api/farms")
      .then((res) => setFarms(res.data))
      .finally(() => setLoading(false));
  };

  useEffect(loadFarms, []);

  const update = (key) => (e) => {
    const value = e.target.type === "checkbox" ? e.target.checked : e.target.value;
    setForm({ ...form, [key]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        ...form,
        latitude: form.latitude ? parseFloat(form.latitude) : null,
        longitude: form.longitude ? parseFloat(form.longitude) : null,
        area_acres: parseFloat(form.area_acres),
        soil_type: form.soil_type || null,
        irrigation_source: form.irrigation_source || null,
      };
      await client.post("/api/farms", payload);
      setModalOpen(false);
      setForm(emptyForm);
      loadFarms();
    } finally {
      setSaving(false);
    }
  };

  const deleteFarm = async (id) => {
    if (!confirm("Delete this farm and all its crops/tasks?")) return;
    await client.delete(`/api/farms/${id}`);
    loadFarms();
  };

  const openRecommendations = async (farm, season = "") => {
    setRecoFarm(farm);
    setRecoSeason(season);
    setRecoLoading(true);
    try {
      const res = await client.get(`/api/recommendations/crop-selection/${farm.id}`, {
        params: season ? { season } : {},
      });
      setRecommendations(res.data.recommendations);
    } finally {
      setRecoLoading(false);
    }
  };

  const openSoil = (farm) => {
    setSoilFarm(farm);
    setSoilForm(emptySoil);
    setSoilResult(null);
  };

  const submitSoil = async (e) => {
    e.preventDefault();
    setSoilSaving(true);
    try {
      const payload = {
        farm_id: soilFarm.id,
        ph: soilForm.ph ? parseFloat(soilForm.ph) : null,
        nitrogen_kg_ha: soilForm.nitrogen_kg_ha ? parseFloat(soilForm.nitrogen_kg_ha) : null,
        phosphorus_kg_ha: soilForm.phosphorus_kg_ha ? parseFloat(soilForm.phosphorus_kg_ha) : null,
        potassium_kg_ha: soilForm.potassium_kg_ha ? parseFloat(soilForm.potassium_kg_ha) : null,
        organic_carbon_pct: soilForm.organic_carbon_pct ? parseFloat(soilForm.organic_carbon_pct) : null,
        moisture_pct: soilForm.moisture_pct ? parseFloat(soilForm.moisture_pct) : null,
      };
      await client.post("/api/soil/records", payload);
      const res = await client.post("/api/soil/analyze", payload);
      setSoilResult(res.data);
    } finally {
      setSoilSaving(false);
    }
  };

  const downloadReport = async (farmId) => {
    setReportingFarmId(farmId);
    try {
      const gen = await client.post(`/api/reports/farm/${farmId}/generate`);
      const file = await client.get(gen.data.download_url, { responseType: "blob" });
      const url = window.URL.createObjectURL(new Blob([file.data], { type: "application/pdf" }));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `farm_report_${farmId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } finally {
      setReportingFarmId(null);
    }
  };

  if (loading) return <Loader />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-display font-semibold text-forest-950">Farms</h1>
          <p className="text-forest-600 mt-1">Manage the farms in your operation.</p>
        </div>
        <motion.button whileTap={{ scale: 0.97 }} onClick={() => setModalOpen(true)} className="btn-primary">
          <Plus size={18} />
          Add farm
        </motion.button>
      </div>

      {farms.length === 0 ? (
        <div className="card p-10 text-center text-forest-600">No farms yet — add your first one above.</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {farms.map((farm, i) => (
            <motion.div
              key={farm.id}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              className="card p-5 flex flex-col"
            >
              <div className="flex items-start justify-between">
                <h3 className="font-display font-semibold text-lg text-forest-950">{farm.name}</h3>
                <button onClick={() => deleteFarm(farm.id)} className="text-forest-400 hover:text-soil-600 transition-colors">
                  <Trash2 size={16} />
                </button>
              </div>
              <p className="text-sm text-forest-600 flex items-center gap-1 mt-1">
                <MapPin size={14} /> {farm.location_text}
              </p>
              <div className="flex flex-wrap gap-2 mt-3">
                <span className="text-xs px-2.5 py-1 rounded-full bg-forest-50 text-forest-700">{farm.area_acres} acres</span>
                {farm.soil_type && (
                  <span className="text-xs px-2.5 py-1 rounded-full bg-wheat-100 text-wheat-800">{farm.soil_type}</span>
                )}
                {farm.irrigation_available && (
                  <span className="text-xs px-2.5 py-1 rounded-full bg-forest-100 text-forest-700 flex items-center gap-1">
                    <Droplets size={12} /> Irrigated
                  </span>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2 mt-4">
                <button onClick={() => openRecommendations(farm)} className="btn-secondary text-sm py-2">
                  <Sparkles size={15} />
                  Crops
                </button>
                <button onClick={() => openSoil(farm)} className="btn-secondary text-sm py-2">
                  <Beaker size={15} />
                  Soil
                </button>
                <button
                  onClick={() => downloadReport(farm.id)}
                  disabled={reportingFarmId === farm.id}
                  className="btn-secondary text-sm py-2 col-span-2"
                >
                  {reportingFarmId === farm.id ? (
                    <Download size={15} className="animate-bounce" />
                  ) : (
                    <FileText size={15} />
                  )}
                  {reportingFarmId === farm.id ? "Preparing PDF…" : "Download report"}
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Add farm modal */}
      <AnimatePresence>
        {modalOpen && (
          <Modal onClose={() => setModalOpen(false)} title="Add a new farm">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="label-text">Farm name</label>
                  <input required className="input-field" value={form.name} onChange={update("name")} />
                </div>
                <div className="col-span-2">
                  <label className="label-text">Location</label>
                  <input required className="input-field" value={form.location_text} onChange={update("location_text")} placeholder="Village, District, State" />
                </div>
                <div>
                  <label className="label-text">Latitude</label>
                  <input type="number" step="any" className="input-field" value={form.latitude} onChange={update("latitude")} placeholder="19.076" />
                </div>
                <div>
                  <label className="label-text">Longitude</label>
                  <input type="number" step="any" className="input-field" value={form.longitude} onChange={update("longitude")} placeholder="72.877" />
                </div>
                <div>
                  <label className="label-text">Area (acres)</label>
                  <input required type="number" step="any" className="input-field" value={form.area_acres} onChange={update("area_acres")} />
                </div>
                <div>
                  <label className="label-text">Soil type</label>
                  <select className="input-field" value={form.soil_type} onChange={update("soil_type")}>
                    <option value="">Select…</option>
                    <option value="loamy">Loamy</option>
                    <option value="clay">Clay</option>
                    <option value="sandy">Sandy</option>
                  </select>
                </div>
                <div>
                  <label className="label-text">Irrigation source</label>
                  <input className="input-field" value={form.irrigation_source} onChange={update("irrigation_source")} placeholder="Canal, borewell…" />
                </div>
                <label className="col-span-2 flex items-center gap-2 mt-1 text-sm text-forest-700">
                  <input type="checkbox" checked={form.irrigation_available} onChange={update("irrigation_available")} className="rounded border-forest-300" />
                  Irrigation infrastructure available
                </label>
              </div>
              <motion.button whileTap={{ scale: 0.98 }} type="submit" disabled={saving} className="btn-primary w-full">
                {saving ? "Saving…" : "Save farm"}
              </motion.button>
            </form>
          </Modal>
        )}
      </AnimatePresence>

      {/* Recommendations modal */}
      <AnimatePresence>
        {recoFarm && (
          <Modal onClose={() => setRecoFarm(null)} title={`Recommended crops — ${recoFarm.name}`}>
            <div className="flex gap-2 mb-4">
              {["", "Kharif", "Rabi", "Zaid"].map((s) => (
                <button
                  key={s || "any"}
                  onClick={() => openRecommendations(recoFarm, s)}
                  className={`text-xs px-3 py-1.5 rounded-full font-medium transition-colors ${
                    recoSeason === s ? "bg-forest-800 text-wheat-50" : "bg-forest-50 text-forest-700 hover:bg-forest-100"
                  }`}
                >
                  {s || "Any season"}
                </button>
              ))}
            </div>
            {recoLoading ? (
              <Loader />
            ) : recommendations.length === 0 ? (
              <p className="text-sm text-forest-500 text-center py-6">No matching crops for this soil/season combination.</p>
            ) : (
              <div className="space-y-3">
                {recommendations.map((r, i) => (
                  <motion.div
                    key={r.crop}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="border border-forest-100 rounded-xl p-4"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <p className="font-display font-semibold text-forest-950">{r.crop}</p>
                      <span
                        className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                          r.suitable
                            ? r.confidence === "High"
                              ? "bg-forest-100 text-forest-700"
                              : "bg-wheat-100 text-wheat-800"
                            : "bg-soil-100 text-soil-700"
                        }`}
                      >
                        {r.suitable ? `${r.confidence} confidence` : "Limited fit"}
                      </span>
                    </div>
                    <p className="text-sm text-forest-600">{r.reasoning}</p>
                  </motion.div>
                ))}
              </div>
            )}
          </Modal>
        )}
      </AnimatePresence>

      {/* Soil analysis modal */}
      <AnimatePresence>
        {soilFarm && (
          <Modal onClose={() => setSoilFarm(null)} title={`Soil & fertilizer — ${soilFarm.name}`}>
            <form onSubmit={submitSoil} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label-text">Soil pH</label>
                  <input type="number" step="0.1" className="input-field" value={soilForm.ph} onChange={(e) => setSoilForm({ ...soilForm, ph: e.target.value })} placeholder="6.5" />
                </div>
                <div>
                  <label className="label-text">Moisture (%)</label>
                  <input type="number" step="0.1" className="input-field" value={soilForm.moisture_pct} onChange={(e) => setSoilForm({ ...soilForm, moisture_pct: e.target.value })} />
                </div>
                <div>
                  <label className="label-text">Nitrogen (kg/ha)</label>
                  <input type="number" step="any" className="input-field" value={soilForm.nitrogen_kg_ha} onChange={(e) => setSoilForm({ ...soilForm, nitrogen_kg_ha: e.target.value })} />
                </div>
                <div>
                  <label className="label-text">Phosphorus (kg/ha)</label>
                  <input type="number" step="any" className="input-field" value={soilForm.phosphorus_kg_ha} onChange={(e) => setSoilForm({ ...soilForm, phosphorus_kg_ha: e.target.value })} />
                </div>
                <div>
                  <label className="label-text">Potassium (kg/ha)</label>
                  <input type="number" step="any" className="input-field" value={soilForm.potassium_kg_ha} onChange={(e) => setSoilForm({ ...soilForm, potassium_kg_ha: e.target.value })} />
                </div>
                <div>
                  <label className="label-text">Organic carbon (%)</label>
                  <input type="number" step="0.1" className="input-field" value={soilForm.organic_carbon_pct} onChange={(e) => setSoilForm({ ...soilForm, organic_carbon_pct: e.target.value })} />
                </div>
              </div>
              <motion.button whileTap={{ scale: 0.98 }} type="submit" disabled={soilSaving} className="btn-primary w-full">
                {soilSaving ? "Analyzing…" : "Save & analyze"}
              </motion.button>
            </form>

            <AnimatePresence>
              {soilResult && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  className="mt-5 pt-5 border-t border-forest-100 space-y-4"
                >
                  <div>
                    <p className="text-sm font-semibold text-forest-800 mb-1.5">Concerns</p>
                    <ul className="text-sm text-forest-600 space-y-1 list-disc list-inside">
                      {soilResult.concerns.map((c, i) => (
                        <li key={i}>{c}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-forest-800 mb-1.5">Suggestions</p>
                    <ul className="text-sm text-forest-600 space-y-1 list-disc list-inside">
                      {soilResult.suggestions.map((s, i) => (
                        <li key={i}>{s}</li>
                      ))}
                    </ul>
                  </div>
                  <p className="text-xs text-forest-400 italic">{soilResult.disclaimer}</p>
                </motion.div>
              )}
            </AnimatePresence>
          </Modal>
        )}
      </AnimatePresence>
    </div>
  );
}
