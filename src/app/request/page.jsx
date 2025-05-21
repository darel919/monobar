"use client"

import { useEffect, useState, useCallback } from "react";
import { getRequests, getWaitingList } from "@/lib/api";
import ErrorState from "@/components/ErrorState";
import Link from "next/link";
import LibraryViewDisplay from "@/components/libraryViewDisplay";

export default function RequestPage() {
  const [requestData, setRequestData] = useState(null);
  const [waitingList, setWaitingList] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchRequests = useCallback(async () => {
    try {
      const [data, waiting] = await Promise.all([
        getRequests(),
        getWaitingList()
      ]);
      setRequestData(data);
      setWaitingList(waiting);
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
        <LibraryViewDisplay data={requestData} viewMode="posterView_comingSoon" cancelMode={true} onRequestCancelled={fetchRequests} />
      ) : (
        <div className="text-center p-12 bg-base-200 rounded-lg">
          <h3 className="text-xl mb-2">No media requests yet</h3>
          <p className="mb-4">Create a new request to add media to the collection.</p>
          <Link href="/search?allowLookup=true" className="btn btn-primary">
            Create Your First Request
          </Link>
        </div>
      )}

      {/* Waiting List Section */}
      <section className="mt-12">
        <h2 className="text-3xl mb-4" title="This is requested already, but we can't find it yet.">Media in Waiting List</h2>
        {waitingList?.length > 0 ? (
          <LibraryViewDisplay data={waitingList} viewMode="posterView_comingSoon" cancelMode={true} onRequestCancelled={fetchRequests} />
        ) : (
          <div className="text-center p-8 bg-base-200 rounded-lg">
            <h3 className="text-lg mb-2">No media in waiting list</h3>
            <p>Media that are being processed or pending approval will appear here.</p>
          </div>
        )}
      </section>
    </section>
  );
}
