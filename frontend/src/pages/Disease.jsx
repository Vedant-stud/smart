import { AnimatePresence, motion } from "framer-motion";
import { AlertCircle, Camera, CheckCircle2, Upload } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import client from "../api/client";
import Loader from "../components/Loader.jsx";

export default function Disease() {
  const [farms, setFarms] = useState([]);
  const [farmId, setFarmId] = useState("");
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState(null);
  const inputRef = useRef(null);

  useEffect(() => {
    client.get("/api/farms").then((res) => {
      setFarms(res.data);
      if (res.data.length) setFarmId(String(res.data[0].id));
    });
  }, []);

  const handleFile = (f) => {
    if (!f) return;
    setFile(f);
    setPreview(URL.createObjectURL(f));
    setResult(null);
  };

  const analyze = async () => {
    if (!file || !farmId) return;
    setAnalyzing(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      // Deliberately no explicit Content-Type header here: the browser
      // needs to set it itself so it can include the multipart boundary,
      // which the backend's multipart parser requires to split the body.
      const res = await client.post(`/api/disease/detect?farm_id=${farmId}`, formData);
      setResult(res.data);
    } finally {
      setAnalyzing(false);
    }
  };

  if (!farms.length) {
    return <div className="card p-10 text-center text-forest-600">Add a farm first to run disease detection.</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-display font-semibold text-forest-950">Crop disease detection</h1>
          <p className="text-forest-600 mt-1">Upload a leaf photo for an AI-assisted first read.</p>
        </div>
        <select className="input-field !w-auto" value={farmId} onChange={(e) => setFarmId(e.target.value)}>
          {farms.map((f) => (
            <option key={f.id} value={f.id}>
              {f.name}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="card p-6">
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => handleFile(e.target.files?.[0])}
          />
          <motion.div
            onClick={() => inputRef.current?.click()}
            whileHover={{ scale: 1.01 }}
            className="border-2 border-dashed border-forest-200 rounded-2xl h-64 flex flex-col items-center justify-center cursor-pointer text-forest-500 hover:border-forest-400 transition-colors overflow-hidden relative"
          >
            {preview ? (
              <img src={preview} alt="Leaf preview" className="h-full w-full object-cover" />
            ) : (
              <>
                <Camera size={32} className="mb-2" />
                <p className="text-sm">Click to upload a leaf photo</p>
              </>
            )}
          </motion.div>
          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={analyze}
            disabled={!file || analyzing}
            className="btn-primary w-full mt-4"
          >
            <Upload size={17} />
            {analyzing ? "Analyzing…" : "Analyze image"}
          </motion.button>
        </div>

        <div className="card p-6">
          {analyzing ? (
            <Loader />
          ) : !result ? (
            <div className="h-full flex flex-col items-center justify-center text-center text-forest-500 py-10 gap-2">
              <AlertCircle size={28} className="text-forest-300" />
              <p className="text-sm">Upload and analyze an image to see results here.</p>
            </div>
          ) : (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
              <div>
                <p className="text-xs text-forest-500 mb-1">Predicted condition</p>
                <h3 className="text-xl font-display font-semibold text-forest-950">{result.predicted_condition}</h3>
              </div>

              <div>
                <div className="flex items-center justify-between text-xs text-forest-500 mb-1">
                  <span>Confidence</span>
                  <span>{Math.round(result.confidence * 100)}%</span>
                </div>
                <div className="h-2 rounded-full bg-forest-100 overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${result.confidence * 100}%` }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className="h-full bg-forest-700"
                  />
                </div>
              </div>

              <p className="text-sm text-forest-600">{result.description}</p>

              <div>
                <p className="text-sm font-semibold text-forest-800 mb-1.5">Suggested next steps</p>
                <ul className="space-y-1.5">
                  {result.suggested_next_steps.map((s, i) => (
                    <motion.li
                      key={i}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.08 }}
                      className="flex items-start gap-2 text-sm text-forest-700"
                    >
                      <CheckCircle2 size={15} className="text-forest-500 mt-0.5 shrink-0" />
                      {s}
                    </motion.li>
                  ))}
                </ul>
              </div>

              <p className="text-xs text-forest-400 italic border-t border-forest-100 pt-3">{result.note}</p>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
