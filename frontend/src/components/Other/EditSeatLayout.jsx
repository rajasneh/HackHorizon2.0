import React, { useEffect, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";

const alphabet = Array.from({ length: 26 }, (_, i) => String.fromCharCode(65 + i));

export default function EditSeatLayout({ screenID, hallID, onClose }) {
  const [zones, setZones] = useState([]); // [{ name, start, end, gaps, rows: [A,B,...] }]
  const [cols, setCols] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Fetch current seat layout and reconstruct zones
  useEffect(() => {
    axios.get(`${import.meta.env.VITE_BASE_URL}/api/halls/seats/${screenID}`)
      .then(res => {
        const seatList = res.data.seats || [];
        // Group by seatType
        const zoneMap = {};
        seatList.forEach(s => {
          if (!zoneMap[s.seatType]) zoneMap[s.seatType] = [];
          zoneMap[s.seatType].push(s);
        });
        // Build zones array
        const zoneArr = Object.entries(zoneMap).map(([name, seats]) => {
          const rows = Array.from(new Set(seats.map(s => s.row))).sort();
          const start = rows[0];
          const end = rows[rows.length - 1];
          // Gaps: collect all gap columns for all rows in this zone
          const gapsPerRow = {};
          rows.forEach(row => {
            const gapCols = seats.filter(s => s.row === row && s.isGap).map(s => Math.floor(s.col - 0.5));
            gapsPerRow[row] = gapCols.length ? gapCols.join(",") : "";
          });
          return { name, start, end, gaps: gapsPerRow, rows };
        });
        setZones(zoneArr);
        // Columns per row
        const newCols = {};
        seatList.forEach(s => {
          if (!s.isGap) {
            if (!newCols[s.row] || s.col > newCols[s.row]) newCols[s.row] = s.col;
          }
        });
        setCols(newCols);
        setLoading(false);
      });
  }, [screenID]);

  // Handlers for editing
  const handleColChange = (row, value) => {
    setCols({ ...cols, [row]: Number(value) });
  };
  const handleGapChange = (zoneIdx, row, value) => {
    const newZones = [...zones];
    newZones[zoneIdx].gaps = { ...newZones[zoneIdx].gaps, [row]: value };
    setZones(newZones);
  };
  // Add/Remove row in a zone
  const handleAddRow = (zoneIdx) => {
    const zone = zones[zoneIdx];
    const last = zone.rows[zone.rows.length - 1];
    const next = alphabet[alphabet.indexOf(last) + 1];
    if (next) {
      const newRows = [...zone.rows, next];
      const newZones = [...zones];
      newZones[zoneIdx] = { ...zone, rows: newRows, end: next, gaps: { ...zone.gaps, [next]: "" } };
      setZones(newZones);
      setCols({ ...cols, [next]: 10 });
    }
  };
  const handleRemoveRow = (zoneIdx) => {
    const zone = zones[zoneIdx];
    if (zone.rows.length > 1) {
      const newRows = zone.rows.slice(0, -1);
      const newZones = [...zones];
      newZones[zoneIdx] = { ...zone, rows: newRows, end: newRows[newRows.length - 1] };
      setZones(newZones);
      // Optionally remove cols/gaps for removed row
    }
  };

  // Generate preview seats for all zones
  const previewSeats = zones.flatMap(zone =>
    zone.rows.map(row => {
      const numCols = cols[row] || 1;
      const gapCols = (zone.gaps[row] || "").split(",").map(Number).filter(n => !isNaN(n));
      const seats = [];
      for (let col = 1; col <= numCols; col++) {
        seats.push({ row, col, isGap: false });
        if (gapCols.includes(col)) {
          seats.push({ row, col: col + 0.5, isGap: true });
        }
      }
      return { row, seats, zone: zone.name };
    })
  );

  const handleSave = async () => {
    setSaving(true);
    try {
      // Prepare zones array for backend
      const zonesForBackend = zones.map(z => ({
        name: z.name,
        start: z.rows[0],
        end: z.rows[z.rows.length - 1],
        gaps: Object.values(z.gaps).filter(Boolean).join(",")
      }));
      const payload = {
        cols,
        zones: zonesForBackend,
        hallID,
        screenID,
      };
      await axios.post(import.meta.env.VITE_BASE_URL + "/api/halls/createSeatLayout", payload);
      toast.success("Seat layout updated!");
      onClose();
    } catch (err) {
      toast.error("Failed to update seat layout");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div>Loading current seat layout...</div>;

  return (
    <div>
      <h2 className="text-lg font-bold mb-4">Advanced Edit Seat Layout</h2>
      {zones.map((zone, zoneIdx) => (
        <div key={zone.name} className="mb-6 p-4 border rounded-lg bg-gray-50">
          <div className="flex items-center gap-2 mb-2">
            <span className="font-semibold text-blue-700">{zone.name} Zone</span>
            <button className="px-2 py-1 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded" onClick={() => handleAddRow(zoneIdx)}>+ Row</button>
            <button className="px-2 py-1 bg-red-100 hover:bg-red-200 text-red-700 rounded" onClick={() => handleRemoveRow(zoneIdx)} disabled={zone.rows.length === 1}>- Row</button>
          </div>
          {zone.rows.map(row => (
            <div key={row} className="flex items-center gap-3 mb-1">
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
              <input
                type="text"
                value={zone.gaps[row] || ""}
                onChange={e => handleGapChange(zoneIdx, row, e.target.value)}
                placeholder="Gaps (e.g. 4,7)"
                className="border rounded px-2 py-1 w-32 focus:ring-2 focus:ring-blue-300"
              />
              <span className="text-gray-400 text-xs">(comma separated)</span>
            </div>
          ))}
        </div>
      ))}
      <div className="mb-6">
        <div className="text-sm text-gray-600 mb-2">Live Preview:</div>
        <div className="flex flex-col gap-1">
          {previewSeats.map(({ row, seats, zone }) => (
            <div key={zone + row} className="flex items-center gap-1">
              <span className="w-6 font-bold text-gray-700">{row}</span>
              {seats.map((seat, idx) => (
                seat.isGap ? (
                  <span key={idx} className="w-7 h-7 inline-block" />
                ) : (
                  <span key={idx} className="w-7 h-7 flex items-center justify-center rounded border text-xs bg-gray-100">{seat.col}</span>
                )
              ))}
              <span className="ml-2 text-xs text-blue-500">{zone}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="flex gap-2 justify-end">
        <button
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? "Saving..." : "Save Changes"}
        </button>
        <button
          className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
          onClick={onClose}
        >
          Cancel
        </button>
      </div>
    </div>
  );
} 