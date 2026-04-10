import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";

const vibrantColors = {
  primary: "from-blue-600 to-purple-600",
  accent: "bg-blue-50",
  button: "bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700",
  remove: "bg-red-100 text-red-600 hover:bg-red-200",
};

const RenderField = ({ field, value, onChange }) => {
  const commonProps = {
    name: field.label,
    value: field.type === 'Media' ? undefined : value || '',
    onChange: onChange,
    className: "w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-300",
    placeholder: field.label,
  };

  switch (field.type) {
    case "Text":
      return <input type={field.label.toLowerCase() === 'email' ? 'email' : 'text'} {...commonProps} />;
    case "Number":
      return <input type="number" {...commonProps} />;
    case "Date":
      return <input type="date" {...commonProps} />;
    case "Media":
      return <input type="file" accept="image/*" name={field.label} onChange={onChange} className={commonProps.className} />;
    default:
      return <input type="text" {...commonProps} />;
  }
};

export default function RegisterParticipants() {
  const { eventId } = useParams();
  const [formFields, setFormFields] = useState([]);
  const [participants, setParticipants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [teamRegistration, setTeamRegistration] = useState(false);
  const [minTeamMembers, setMinTeamMembers] = useState(1);
  const [maxTeamMembers, setMaxTeamMembers] = useState(10);
  const [teamSize, setTeamSize] = useState("");
  const [isTeamSizeSet, setIsTeamSizeSet] = useState(false);

  const getInitialParticipant = (fields) => {
    const participant = {};
    fields.forEach(field => {
      participant[field.label] = field.type === 'Media' ? null : '';
    });
    return participant;
  };

  useEffect(() => {
    const fetchFields = async () => {
      try {
        setLoading(true);
        const res = await axios.post(import.meta.env.VITE_BASE_URL + "/api/event/get-reg-fields", { eventId });
        const fields = res.data.fields || [];
        const teamReg = res.data.teamRegistration || false;
        const minMembers = res.data.minParticipant || 1;
        const maxMembers = res.data.maxParticipant || 10;
        
        setFormFields(fields);
        setTeamRegistration(teamReg);

        if (teamReg) {
          setMinTeamMembers(minMembers);
          setMaxTeamMembers(maxMembers);
          setTeamSize(minMembers); // Default to min
        } else {
          setParticipants([getInitialParticipant(fields)]); // Individual registration
        }
      } catch (err) {
        setError("Failed to load registration form fields.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchFields();
  }, [eventId]);

  const handleSetTeamSize = () => {
    const size = parseInt(teamSize, 10);
    if (size >= minTeamMembers && size <= maxTeamMembers) {
      const newParticipants = Array.from({ length: size }, () => getInitialParticipant(formFields));
      setParticipants(newParticipants);
      setIsTeamSizeSet(true);
    } else {
      alert(`Team size must be between ${minTeamMembers} and ${maxTeamMembers}.`);
    }
  };

  const handleChange = (idx, e) => {
    const { name, value, type, files } = e.target;
    setParticipants((prev) =>
      prev.map((p, i) =>
        i === idx ? { ...p, [name]: type === 'file' ? files[0] : value } : p
      )
    );
  };

  const handleAddParticipant = () => {
    setParticipants((prev) => [...prev, getInitialParticipant(formFields)]);
  };

  const handleRemoveParticipant = (idx) => {
    if (participants.length > 1) {
      setParticipants((prev) => prev.filter((_, i) => i !== idx));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Submitting:", participants);
    alert(`Registering ${participants.length} participant(s)! Check console for data.`);
    // Reset after submission
    if (teamRegistration) {
      setIsTeamSizeSet(false);
      setTeamSize(minTeamMembers);
    }
    setParticipants([getInitialParticipant(formFields)]);
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading form...</div>;
  }

  if (error) {
    return <div className="min-h-screen flex items-center justify-center text-red-500">{error}</div>;
  }

  if (teamRegistration && !isTeamSizeSet) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-purple-50 to-indigo-100 px-2 py-8">
        <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl p-8 sm:p-10 text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Team Registration</h1>
          <p className="text-gray-600 mb-6">Please specify the number of participants in your team.</p>
          <div className="mb-4">
            <label className="block text-gray-700 font-medium mb-2">Team Size</label>
            <input
              type="number"
              min={minTeamMembers}
              max={maxTeamMembers}
              value={teamSize}
              onChange={(e) => setTeamSize(e.target.value)}
              className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400 text-center"
            />
            <p className="text-xs text-gray-500 mt-1">
              (Min: {minTeamMembers}, Max: {maxTeamMembers})
            </p>
          </div>
          <button
            onClick={handleSetTeamSize}
            className={`w-full py-3 rounded-lg text-white font-bold shadow-lg transition-all duration-200 ${vibrantColors.button}`}
          >
            Proceed
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-purple-50 to-indigo-100 px-2 py-8">
      <form onSubmit={handleSubmit} className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl p-8 sm:p-10">
        <h1 className="text-3xl font-bold text-gray-900 mb-2 text-center">
          {teamRegistration ? 'Team Registration' : 'Register Participants'}
        </h1>
        <p className="text-gray-500 text-center mb-6">
          Fill in the details for each participant below.
        </p>

        <div className="space-y-8">
          {participants.map((participant, idx) => (
            <div key={idx} className="p-4 border rounded-xl relative bg-gray-50/50">
              <h3 className="font-semibold text-lg mb-4 text-gray-700">Participant #{idx + 1}</h3>
              {participants.length > 1 && !teamRegistration && (
                <button
                  type="button"
                  onClick={() => handleRemoveParticipant(idx)}
                  className={`absolute top-2 right-2 px-2 py-1 rounded text-xs ${vibrantColors.remove}`}
                >
                  Remove
                </button>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {formFields.map((field) => (
                  <div key={field.label}>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{field.label}</label>
                    <RenderField
                      field={field}
                      value={participant[field.label]}
                      onChange={(e) => handleChange(idx, e)}
                    />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className={`flex items-center mt-8 ${!teamRegistration ? 'justify-between' : 'justify-end'}`}>
          {!teamRegistration && (
            <button
              className={`px-5 py-2 rounded-lg text-white font-semibold shadow-md transition-all duration-200 ${vibrantColors.button}`}
              onClick={handleAddParticipant}
              type="button"
            >
              + Add Another Participant
            </button>
          )}
          <button
            className={`px-6 py-2 rounded-lg text-white font-bold shadow-lg transition-all duration-200 ${vibrantColors.button}`}
            type="submit"
          >
            Submit Registration
          </button>
        </div>
      </form>
    </div>
  );
}