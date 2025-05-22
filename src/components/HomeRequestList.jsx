"use client";

import { useEffect, useState, useCallback } from "react";
import { getRequests } from "@/lib/api";
import Link from "next/link";
import LibraryViewDisplay from "@/components/libraryViewDisplay";

export default function HomeRequestList() {
  const [requestData, setRequestData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const fetchRequests = useCallback(async (isManualRefresh = false) => {
    if (isManualRefresh) setRefreshing(true);
    try {
      const data = await getRequests();
      setRequestData(data);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
      if (isManualRefresh) setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchRequests();
    const interval = setInterval(() => fetchRequests(), 10000);
    return () => clearInterval(interval);
  }, [fetchRequests]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-32">
        <span className="loading loading-spinner loading-lg mb-4"></span>
        <span>Loading requests...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center p-8 bg-base-200 rounded-lg">
        <h3 className="text-xl mb-2">Error loading requests</h3>
        <p className="mb-4">{error}</p>
        <button className="btn btn-primary" onClick={() => fetchRequests(true)} disabled={refreshing}>
          {refreshing ? (
            <><span className="loading loading-spinner loading-xs mr-2"></span>Loading</>
          ) : (
            "Try Again"
          )}
        </button>
      </div>
    );
  }

  return (
    <section>
      {requestData?.length > 0 ? (
        <LibraryViewDisplay data={requestData} viewMode="posterView_comingSoon" />
      ) : (
        <div className="text-center p-12 bg-base-200 rounded-lg">
          <h3 className="text-xl mb-2">No media requests yet</h3>
          <p className="mb-4">Create a new request to add media to the collection.</p>
          <Link href="/search?allowLookup=true" className="btn btn-primary">
            Create Your First Request
          </Link>
        </div>
      )}
    </section>
  );
}
