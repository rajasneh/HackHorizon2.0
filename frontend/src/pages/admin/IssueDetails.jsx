import React, { useState } from "react";
import { toast } from "react-hot-toast";
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { formatInTimeZone } from "date-fns-tz";

const fetchIssue = async (id) => {
  const res = await fetch(`${import.meta.env.VITE_BASE_URL}/api/admin/get-all-issues?id=${id}`, {
    method: "GET",
    credentials: "include"
  });
  if (!res.ok) throw new Error("Failed to fetch issue");
  const data = await res.json();
  if (!data.issues || !data.issues.length) throw new Error("Issue not found");
  return data.issues[0];
};

export default function IssueDetails() {
  const { id } = useParams();
  const { data: issue, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["issue", id],
    queryFn: () => fetchIssue(id),
  });
  const [loading, setLoading] = useState(false);

  const handleResolve = async () => {
    setLoading(true);
    try {
      const res = await fetch(import.meta.env.VITE_BASE_URL + "/api/admin/resolve-issue", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ issueId: id }),
        credentials: "include"
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message || "Failed to resolve issue");
      toast.success("Issue resolved!");
      refetch();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (isLoading) return <div className="p-8">Loading...</div>;
  if (isError) return <div className="p-8 text-red-500">{error.message}</div>;

  return (
    <div className="max-w-2xl mx-auto p-8 bg-white rounded-xl shadow-lg border border-gray-100 mt-8">
      <h2 className="text-2xl font-bold mb-2">{issue.subject}</h2>
      <div className="mb-4 text-gray-500 text-sm">Submitted by <span className="font-semibold text-blue-700">{issue.name}</span> &lt;{issue.email}&gt; on {issue.createdAt ? formatInTimeZone(issue.createdAt, 'UTC', "dd MMM yyyy, HH:mm ") : "-"}</div>
      <div className="mb-4 flex items-center gap-4">
        <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${issue.status === 'resolved' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>{issue.status === 'resolved' ? 'Resolved' : 'Open'}</span>
        {issue.status !== 'resolved' && (
          <button
            className="bg-blue-600 text-white px-5 py-2 rounded-lg font-semibold shadow hover:bg-blue-700 transition disabled:opacity-50"
            disabled={loading}
            onClick={handleResolve}
          >
            {loading ? "Resolving..." : "Resolve"}
          </button>
        )}
      </div>
      {issue.imageUrl && (
        <div className="mb-4">
          <img src={issue.imageUrl} alt="Issue attachment" className="max-w-full rounded border" />
        </div>
      )}
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-1">Description</h3>
        <div className="bg-gray-50 rounded p-4 text-gray-800 whitespace-pre-line">{issue.description}</div>
      </div>
      <div className="grid grid-cols-2 gap-4 text-sm text-gray-700">
        <div><span className="font-semibold">ID:</span> {issue.id}</div>
        <div><span className="font-semibold">Created At:</span> {issue.createdAt ? formatInTimeZone(issue.createdAt, 'UTC', "dd MMM yyyy, HH:mm") : "-"}</div>
        <div><span className="font-semibold">Updated At:</span> {issue.updatedAt ? formatInTimeZone(issue.updatedAt, 'UTC', "dd MMM yyyy, HH:mm") : "-"}</div>
        <div><span className="font-semibold">Email:</span> {issue.email}</div>
      </div>
    </div>
  );
}