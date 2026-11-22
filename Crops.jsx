import { AnimatePresence, motion } from "framer-motion";
import { Droplets, Plus, Sprout, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import client from "../api/client";
import Loader from "../components/Loader.jsx";
import Modal from "../components/Modal.jsx";

const STATUS_STYLES = {
  active: "bg-forest-100 text-forest-700",
  harvested: "bg-forest-800 text-wheat-50",
  failed: "bg-soil-100 text-soil-700",
};

const GROWTH_STAGES = ["Sown", "Germination", "Vegetative", "Flowering", "Grain-filling", "Maturity", "Harvested"];

const emptyForm = {
  farm_id: "",
  crop_type: "",
  variety: "",
  season: "",
  growth_stage: "Sown",
  status: "active",
  area_acres: "",
  notes: "",
};

export default function Crops() {
  const [crops, setCrops] = useState([]);
  const [farms, setFarms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [filterFarm, setFilterFarm] = useState("");

  const [adviceCrop, setAdviceCrop] = useState(null);
  const [adviceLoading, setAdviceLoading] = useState(false);
  const [advice, setAdvice] = useState(null);

  const load = () => {
    setLoading(true);
    Promise.all([client.get("/api/crops"), client.get("/api/farms")])
      .then(([cropsRes, farmsRes]) => {
        setCrops(cropsRes.data);
        setFarms(farmsRes.data);
      })
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const update = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await client.post("/api/crops", {
        ...form,
        farm_id: parseInt(form.farm_id),
        area_acres: form.area_acres ? parseFloat(form.area_acres) : 0,
      });
      setModalOpen(false);
      setForm(emptyForm);
      load();
    } finally {
      setSaving(false);
    }
  };

  const updateField = async (crop, patch) => {
    await client.patch(`/api/crops/${crop.id}`, patch);
    load();
  };

  const deleteCrop = async (id) => {
    if (!confirm("Delete this crop?")) return;
    await client.delete(`/api/crops/${id}`);
    load();
  };

  const openAdvice = async (crop) => {
    setAdviceCrop(crop);
    setAdviceLoading(true);
    setAdvice(null);
    try {
      const res = await client.get(`/api/recommendations/irrigation/${crop.farm_id}`, {
        params: { crop_id: crop.id },
      });
      setAdvice(res.data);
    } finally {
      setAdviceLoading(false);
    }
  };

  if (loading) return <Loader />;

  const farmMap = Object.fromEntries(farms.map((f) => [f.id, f.name]));
  const visibleCrops = filterFarm ? crops.filter((c) => c.farm_id === parseInt(filterFarm)) : crops;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-display font-semibold text-forest-950">Crops</h1>
          <p className="text-forest-600 mt-1">Track what's growing across your farms.</p>
        </div>
        <div className="flex items-center gap-2">
          <select className="input-field !w-auto" value={filterFarm} onChange={(e) => setFilterFarm(e.target.value)}>
            <option value="">All farms</option>
            {farms.map((f) => (
              <option key={f.id} value={f.id}>
                {f.name}
              </option>
            ))}
          </select>
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={() => {
              if (!farms.length) return alert("Add a farm first.");
              setForm({ ...emptyForm, farm_id: farms[0].id });
              setModalOpen(true);
            }}
            className="btn-primary"
          >
            <Plus size={18} />
            Add crop
          </motion.button>
        </div>
      </div>

      {visibleCrops.length === 0 ? (
        <div className="card p-10 text-center text-forest-600 flex flex-col items-center gap-2">
          <Sprout className="text-forest-300" size={32} />
          No crops recorded yet.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {visibleCrops.map((crop, i) => (
            <motion.div
              key={crop.id}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
              className="card p-5"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-display font-semibold text-forest-950">{crop.crop_type}</h3>
                  {crop.variety && <p className="text-xs text-forest-500">{crop.variety}</p>}
                </div>
                <button onClick={() => deleteCrop(crop.id)} className="text-forest-400 hover:text-soil-600 transition-colors">
                  <Trash2 size={16} />
                </button>
              </div>
              <p className="text-sm text-forest-600 mt-2">{farmMap[crop.farm_id]}</p>
              {crop.season && <p className="text-xs text-forest-500 mt-0.5">{crop.season} season</p>}

              <div className="flex items-center gap-2 mt-3">
                <select
                  value={crop.status}
                  onChange={(e) => updateField(crop, { status: e.target.value })}
                  className={`text-xs font-semibold px-2.5 py-1.5 rounded-full border-0 cursor-pointer ${STATUS_STYLES[crop.status]}`}
                >
                  <option value="active">Active</option>
                  <option value="harvested">Harvested</option>
                  <option value="failed">Failed</option>
                </select>
                <select
                  value={crop.growth_stage}
                  onChange={(e) => updateField(crop, { growth_stage: e.target.value })}
                  className="text-xs font-medium px-2.5 py-1.5 rounded-full border border-forest-200 text-forest-700 cursor-pointer"
                >
                  {GROWTH_STAGES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>

              <button onClick={() => openAdvice(crop)} className="btn-secondary mt-3 text-sm py-2 w-full">
                <Droplets size={15} />
                Irrigation advice
              </button>
            </motion.div>
          ))}
        </div>
      )}

      <AnimatePresence>
        {modalOpen && (
          <Modal onClose={() => setModalOpen(false)} title="Add a crop">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="label-text">Farm</label>
                <select required className="input-field" value={form.farm_id} onChange={update("farm_id")}>
                  {farms.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label-text">Crop</label>
                <input required className="input-field" value={form.crop_type} onChange={update("crop_type")} placeholder="Wheat" />
              </div>
              <div>
                <label className="label-text">Variety</label>
                <input className="input-field" value={form.variety} onChange={update("variety")} placeholder="HD-2967" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label-text">Season</label>
                  <select className="input-field" value={form.season} onChange={update("season")}>
                    <option value="">Select…</option>
                    <option value="Kharif">Kharif</option>
                    <option value="Rabi">Rabi</option>
                    <option value="Zaid">Zaid</option>
                  </select>
                </div>
                <div>
                  <label className="label-text">Area (acres)</label>
                  <input type="number" step="any" className="input-field" value={form.area_acres} onChange={update("area_acres")} />
                </div>
              </div>
              <div>
                <label className="label-text">Notes</label>
                <textarea className="input-field" rows={2} value={form.notes} onChange={update("notes")} />
              </div>
              <motion.button whileTap={{ scale: 0.98 }} type="submit" disabled={saving} className="btn-primary w-full">
                {saving ? "Saving…" : "Save crop"}
              </motion.button>
            </form>
          </Modal>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {adviceCrop && (
          <Modal onClose={() => setAdviceCrop(null)} title={`Irrigation advice — ${adviceCrop.crop_type}`}>
            {adviceLoading ? (
              <Loader />
            ) : (
              advice && (
                <div className="space-y-3">
                  <span
                    className={`inline-block text-sm font-semibold px-3 py-1.5 rounded-full ${
                      advice.action === "irrigate"
                        ? "bg-forest-100 text-forest-700"
                        : advice.action === "postpone"
                        ? "bg-soil-100 text-soil-700"
                        : "bg-wheat-100 text-wheat-800"
                    }`}
                  >
                    {advice.action === "irrigate" ? "Irrigate now" : advice.action === "postpone" ? "Postpone irrigation" : "Monitor — no action needed"}
                  </span>
                  <p className="text-sm text-forest-600">{advice.reasoning}</p>
                </div>
              )
            )}
          </Modal>
        )}
      </AnimatePresence>
    </div>
  );
}
