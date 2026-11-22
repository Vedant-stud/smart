import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, Circle, Plus, Sparkles, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import client from "../api/client";
import Loader from "../components/Loader.jsx";
import Modal from "../components/Modal.jsx";

const CATEGORY_STYLES = {
  irrigation: "bg-forest-100 text-forest-700",
  fertilizer: "bg-wheat-100 text-wheat-800",
  pest: "bg-soil-100 text-soil-700",
  harvest: "bg-forest-800 text-wheat-50",
  general: "bg-forest-50 text-forest-600",
};

const emptyForm = {
  farm_id: "",
  title: "",
  description: "",
  category: "general",
  due_date: "",
};

export default function Tasks() {
  const [tasks, setTasks] = useState([]);
  const [farms, setFarms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [filterFarm, setFilterFarm] = useState("");

  const load = () => {
    setLoading(true);
    Promise.all([client.get("/api/tasks"), client.get("/api/farms")])
      .then(([taskRes, farmRes]) => {
        setTasks(taskRes.data);
        setFarms(farmRes.data);
      })
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const update = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await client.post("/api/tasks", {
        ...form,
        farm_id: parseInt(form.farm_id),
        due_date: form.due_date ? new Date(form.due_date).toISOString() : null,
      });
      setModalOpen(false);
      setForm(emptyForm);
      load();
    } finally {
      setSaving(false);
    }
  };

  const toggleComplete = async (task) => {
    await client.patch(`/api/tasks/${task.id}`, { is_completed: !task.is_completed });
    load();
  };

  const deleteTask = async (id) => {
    await client.delete(`/api/tasks/${id}`);
    load();
  };

  if (loading) return <Loader />;

  const farmMap = Object.fromEntries(farms.map((f) => [f.id, f.name]));
  const visibleTasks = filterFarm ? tasks.filter((t) => t.farm_id === parseInt(filterFarm)) : tasks;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-display font-semibold text-forest-950">Tasks</h1>
          <p className="text-forest-600 mt-1">Farm activities and reminders, manual or automated.</p>
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
            Add task
          </motion.button>
        </div>
      </div>

      {visibleTasks.length === 0 ? (
        <div className="card p-10 text-center text-forest-600">No tasks yet.</div>
      ) : (
        <div className="space-y-2.5">
          {visibleTasks.map((task, i) => (
            <motion.div
              key={task.id}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.025 }}
              className={`card p-4 flex items-center gap-3 ${task.is_completed ? "opacity-60" : ""}`}
            >
              <button onClick={() => toggleComplete(task)} className="shrink-0 text-forest-600 hover:text-forest-800">
                {task.is_completed ? <CheckCircle2 size={22} className="text-forest-600" /> : <Circle size={22} />}
              </button>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className={`font-medium text-forest-950 ${task.is_completed ? "line-through" : ""}`}>{task.title}</p>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${CATEGORY_STYLES[task.category] || CATEGORY_STYLES.general}`}>
                    {task.category}
                  </span>
                  {task.auto_generated && (
                    <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-forest-950 text-wheat-100 flex items-center gap-1">
                      <Sparkles size={10} /> auto
                    </span>
                  )}
                </div>
                <p className="text-xs text-forest-500 mt-0.5">
                  {farmMap[task.farm_id]}
                  {task.due_date && ` · due ${new Date(task.due_date).toLocaleDateString()}`}
                </p>
                {task.description && <p className="text-sm text-forest-600 mt-1">{task.description}</p>}
              </div>
              <button onClick={() => deleteTask(task.id)} className="text-forest-400 hover:text-soil-600 transition-colors shrink-0">
                <Trash2 size={16} />
              </button>
            </motion.div>
          ))}
        </div>
      )}

      <AnimatePresence>
        {modalOpen && (
          <Modal onClose={() => setModalOpen(false)} title="Add a task">
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
                <label className="label-text">Title</label>
                <input required className="input-field" value={form.title} onChange={update("title")} placeholder="Apply top-dressing fertilizer" />
              </div>
              <div>
                <label className="label-text">Category</label>
                <select className="input-field" value={form.category} onChange={update("category")}>
                  <option value="general">General</option>
                  <option value="irrigation">Irrigation</option>
                  <option value="fertilizer">Fertilizer</option>
                  <option value="pest">Pest</option>
                  <option value="harvest">Harvest</option>
                </select>
              </div>
              <div>
                <label className="label-text">Due date</label>
                <input type="date" className="input-field" value={form.due_date} onChange={update("due_date")} />
              </div>
              <div>
                <label className="label-text">Description</label>
                <textarea className="input-field" rows={2} value={form.description} onChange={update("description")} />
              </div>
              <motion.button whileTap={{ scale: 0.98 }} type="submit" disabled={saving} className="btn-primary w-full">
                {saving ? "Saving…" : "Save task"}
              </motion.button>
            </form>
          </Modal>
        )}
      </AnimatePresence>
    </div>
  );
}
