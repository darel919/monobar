"use client"

import { useEffect, useState, useCallback } from "react";
import { getRequests } from "@/lib/api";
import ErrorState from "@/components/ErrorState";
import Link from "next/link";
import LibraryViewDisplay from "@/components/libraryViewDisplay";

export default function RequestPage() {
  const [requestData, setRequestData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchRequests = useCallback(async () => {
    try {
      const data = await getRequests();
      setRequestData(data);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRequests();
    const interval = setInterval(fetchRequests, 10000);
    return () => clearInterval(interval);
  }, [fetchRequests]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <span className="loading loading-spinner loading-lg mb-4"></span>
        <span>Loading requests...</span>
      </div>
    );
  }

  if (error) {
    return (
      <ErrorState 
        message="Currently, the Request feature is unavailable." 
        actionText="Try Again" 
        actionDesc="We are having trouble loading the request data. Please try refreshing the page."
        action="reload"
      />
    );
  }

  return (
    <section className="flex flex-col min-h-screen p-8 mt-12">
      <section className="mb-8 flex sm:flex-row flex-col items-center justify-between">
        <section>
          <h1 className="text-4xl">Media Requests</h1>
          {requestData?.length ? (
            <p>{requestData.length} requests found.</p>
          ) : (
            <p>No requests found.</p>
          )}
        </section>
        <Link 
          href="/search?allowLookup=true" 
          className="btn btn-primary"
        >
          New Media Request
        </Link>
      </section>

      {/* Request List */}
      {requestData?.length > 0 ? (
        <LibraryViewDisplay data={requestData} viewMode="posterView_comingSoon"/>
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
