import React, { useState } from "react";
import axios from "axios";

const alphabet = Array.from({ length: 26 }, (_, i) => String.fromCharCode(65 + i));

export default function SeatLayoutBuilder({ hallID, screenID }) {
  const [zones, setZones] = useState([
    { name: "Regular", start: "A", end: "D", gaps: "" },
    { name: "Executive", start: "E", end: "F", gaps: "" },
    { name: "Premium", start: "G", end: "H", gaps: "" }
  ]);
  const [rows, setRows] = useState(["A", "B", "C", "D", "E", "F", "G", "H"]);
  const [cols, setCols] = useState({ A: 10, B: 10, C: 10, D: 10, E: 10, F: 10, G: 10, H: 10 });
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  // Add or remove rows dynamically
  const handleAddRow = () => {
    const last = rows[rows.length - 1];
    const next = alphabet[alphabet.indexOf(last) + 1];
    if (next) {
      setRows([...rows, next]);
      setCols({ ...cols, [next]: 10 });
    }
  };
  const handleRemoveRow = () => {
    if (rows.length > 1) {
      const newRows = rows.slice(0, -1);
      const newCols = { ...cols };
      delete newCols[rows[rows.length - 1]];
      setRows(newRows);
      setCols(newCols);
    }
  };

  const handleColChange = (row, value) => {
    setCols({ ...cols, [row]: Number(value) });
  };

  // Zone management functions
  const addZone = () => {
    const newZoneName = `Zone ${zones.length + 1}`;
    setZones([...zones, { name: newZoneName, start: "A", end: "A", gaps: "" }]);
  };

  const removeZone = (index) => {
    if (zones.length > 1) {
      setZones(zones.filter((_, i) => i !== index));
    }
  };

  const updateZone = (index, field, value) => {
    setZones(zones.map((zone, i) => 
      i === index ? { ...zone, [field]: value } : zone
    ));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    try {
      const payload = {
        zones, 
        cols,
        hallID,
        screenID,
      };
      const res = await axios.post(import.meta.env.VITE_BASE_URL + "/api/halls/createSeatLayout", payload);
      setMessage(res.data.message || "Seat layout created!");
    } catch (err) {
      setMessage(err.response?.data?.message || "Error creating seat layout");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full">
      <div className="sticky top-0 z-20 bg-white pb-2 mb-4 border-b flex items-center justify-between shadow-sm">
        <h2 className="text-2xl font-bold text-blue-700">Dynamic Seat Layout Builder</h2>
        <span className="text-xs text-gray-400">Hall ID: <span className="font-mono text-gray-600">{hallID}</span> | Screen ID: <span className="font-mono text-gray-600">{screenID}</span></span>
      </div>
      <form onSubmit={handleSubmit} className="space-y-8 pb-24">
        {/* Dynamic Zones Section */}
        <div className="bg-blue-50 rounded-lg p-4 shadow-sm border border-blue-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-blue-900">Zones Configuration</h3>
            <button
              type="button"
              onClick={addZone}
              className="px-3 py-1 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded transition"
            >
              + Add Zone
            </button>
          </div>
          <div className="space-y-3">
            {zones.map((zone, index) => (
              <div key={index} className="flex items-center gap-3 p-3 bg-white rounded border">
                <input
                  type="text"
                  value={zone.name}
                  onChange={(e) => updateZone(index, 'name', e.target.value)}
                  placeholder="Zone Name"
                  className="border rounded px-2 py-1 w-32 focus:ring-2 focus:ring-blue-300"
                />
                <select
                  value={zone.start}
                  onChange={(e) => updateZone(index, 'start', e.target.value)}
                  className="rounded border px-2 py-1 focus:ring-2 focus:ring-blue-300"
                >
                  {alphabet.map(l => <option key={l}>{l}</option>)}
                </select>
                <span>-</span>
                <select
                  value={zone.end}
                  onChange={(e) => updateZone(index, 'end', e.target.value)}
                  className="rounded border px-2 py-1 focus:ring-2 focus:ring-blue-300"
                >
                  {alphabet.map(l => <option key={l}>{l}</option>)}
                </select>
                <input
                  type="text"
                  value={zone.gaps}
                  onChange={(e) => updateZone(index, 'gaps', e.target.value)}
                  placeholder="Gaps (e.g. 4,7)"
                  className="border rounded px-2 py-1 w-32 focus:ring-2 focus:ring-blue-300"
                />
                <button
                  type="button"
                  onClick={() => removeZone(index)}
                  disabled={zones.length === 1}
                  className="px-2 py-1 bg-red-100 hover:bg-red-200 text-red-700 rounded transition disabled:opacity-50"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Rows & Columns Section */}
        <div className="bg-gray-50 rounded-lg p-4 shadow-sm border border-gray-100">
          <div className="flex gap-2 mb-4">
            <button type="button" className="px-3 py-1 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded transition" onClick={handleAddRow}>+ Row</button>
            <button type="button" className="px-3 py-1 bg-red-100 hover:bg-red-200 text-red-700 rounded transition" onClick={handleRemoveRow} disabled={rows.length === 1}>- Row</button>
          </div>
          <div className="space-y-2">
            {rows.map(row => (
              <div key={row} className="flex items-center gap-3">
                <span className="w-8 font-semibold text-gray-700">{row}</span>
                <input
                  type="number"
                  min={1}
                  className="border rounded px-2 py-1 w-24 focus:ring-2 focus:ring-blue-200"
                  value={cols[row]}
                  onChange={e => handleColChange(row, e.target.value)}
                  required
                />
                <span className="text-gray-500">columns</span>
              </div>
            ))}
          </div>
        </div>
        <div className="flex justify-end">
          <button type="submit" className="px-8 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold shadow transition disabled:opacity-60 disabled:cursor-not-allowed" disabled={loading}>{loading ? "Creating..." : "Create Layout"}</button>
        </div>
        {message && <div className="mt-2 text-center font-semibold text-green-600">{message}</div>}
      </form>
    </div>
  );
} 