import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-hot-toast";
import { formatInTimeZone } from "date-fns-tz";
import { useNavigate } from "react-router-dom";

const PAGE_SIZE = 10;

const fetchIssues = async ({ pageParam = 1 }) => {
    const res = await fetch(`${import.meta.env.VITE_BASE_URL}/api/admin/get-all-issues?page=${pageParam}&limit=${PAGE_SIZE}`, {
        method: "GET",
        credentials: "include"
    });
    if (!res.ok) throw new Error("Failed to fetch issues");
    return res.json();
};

const resolveIssue = async (issueId) => {
    const res = await fetch(import.meta.env.VITE_BASE_URL + "/api/admin/resolve-issue", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ issueId }),
        credentials: "include"
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.message || "Failed to resolve issue");
    return data;
};

export default function Support() {
    const [page, setPage] = useState(1);
    const queryClient = useQueryClient();
    const navigate = useNavigate();

    const {
        data,
        isLoading,
        isError,
        error,
        refetch,
    } = useQuery({
        queryKey: ["issues", page],
        queryFn: () => fetchIssues({ pageParam: page }),
        keepPreviousData: true,
    });

    const mutation = useMutation({
        mutationFn: resolveIssue,
        onSuccess: () => {
            toast.success("Issue resolved!");
            queryClient.invalidateQueries({ queryKey: ["issues"] });
        },
        onError: (err) => {
            toast.error(err.message);
        },
    });

    const issues = data?.issues || [];
    const totalPages = Math.ceil((data?.total || 0) / PAGE_SIZE);

    return (
        <div className="p-8 max-w-5xl mx-auto">
            <h1 className="text-3xl font-bold mb-8 text-blue-900">Support Issues</h1>
            {isLoading ? (
                <div className="flex items-center justify-center h-40 text-lg text-blue-600 animate-pulse">Loading...</div>
            ) : isError ? (
                <div className="text-red-500">{error.message}</div>
            ) : (
                <>
                    <table className="w-full border rounded-xl shadow-lg mb-6 overflow-hidden">
                        <thead className="bg-blue-50">
                            <tr>
                                <th className="p-4 text-left font-semibold text-gray-700">Subject</th>
                                <th className="p-4 text-left font-semibold text-gray-700">User</th>
                                <th className="p-4 text-left font-semibold text-gray-700">Date</th>
                                <th className="p-4 text-left font-semibold text-gray-700">Status</th>
                                <th className="p-4 text-left font-semibold text-gray-700">Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {issues.length === 0 ? (
                                <tr><td colSpan={5} className="p-6 text-center text-gray-500">No issues found.</td></tr>
                            ) : (
                                issues.map(issue => (
                                    <tr
                                        key={issue.id}
                                        className="border-t hover:bg-blue-50 cursor-pointer transition"
                                        onClick={e => {
                                            // Prevent row click if resolve button is clicked
                                            if (e.target.tagName === "BUTTON") return;
                                            navigate(`issue/${issue.id}`);
                                        }}
                                    >
                                        <td className="p-4 font-medium text-blue-900">{issue.subject}</td>
                                        <td className="p-4 text-gray-700">{issue.name} <span className="text-xs text-gray-400">({issue.email})</span></td>
                                        <td className="p-4 text-gray-600">
                                            {issue.createdAt
                                                ? formatInTimeZone(new Date(issue.createdAt), "UTC", "dd MMM yyyy, HH:mm")
                                                : "-"}
                                        </td>
                                        <td className="p-4">
                                            <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${issue.status === 'resolved' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>{issue.status === 'resolved' ? 'Resolved' : 'Open'}</span>
                                        </td>
                                        <td className="p-4">
                                            {issue.status === 'resolved' ? (
                                                <span className="inline-block px-3 py-1 bg-green-100 text-green-700 rounded-full">✔</span>
                                            ) : (
                                                <button
                                                    className="bg-blue-600 text-white px-4 py-1 rounded hover:bg-blue-700 transition font-semibold shadow"
                                                    disabled={mutation.isLoading}
                                                    onClick={e => {
                                                        e.stopPropagation();
                                                        mutation.mutate(issue.id);
                                                    }}
                                                >
                                                    {mutation.isLoading ? "Resolving..." : "Resolve"}
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                    <div className="flex justify-between items-center mt-4">
                        <button
                            className="px-4 py-2 bg-gray-200 rounded disabled:opacity-50"
                            onClick={() => setPage(p => Math.max(1, p - 1))}
                            disabled={page === 1}
                        >
                            Previous
                        </button>
                        <span className="mx-4">Page {page} of {totalPages}</span>
                        <button
                            className="px-4 py-2 bg-gray-200 rounded disabled:opacity-50"
                            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                            disabled={page === totalPages}
                        >
                            Next
                        </button>
                    </div>
                </>
            )}
        </div>
    );
}