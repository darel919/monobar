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
  const [refreshing, setRefreshing] = useState(false);

  const fetchRequests = useCallback(async (isManualRefresh = false) => {
    if (isManualRefresh) setRefreshing(true);
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
      if (isManualRefresh) setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    const timerFetch = () => fetchRequests(true);
    timerFetch();
    const interval = setInterval(timerFetch, 10000);
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
      <section className="mb-8 flex sm:flex-row flex-col items-start sm:items-center justify-between">
        <section className="sm:mb-0 mb-4">
          <h1 className="text-4xl">Media Requests</h1>
          {requestData?.length ? (
            <p>{requestData.length} requests found.</p>
          ) : (
            <p>No requests found.</p>
          )}
        </section>
        <div className="flex gap-2">
          <Link 
            href="/search?allowLookup=true" 
            className="btn btn-primary"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="size-6">
  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
</svg>

            New Request
          </Link>
          <button
            className="btn btn-primary flex items-center"
            onClick={() => fetchRequests(true)}
            disabled={loading || refreshing}
            type="button"
          >
            {(loading || refreshing) ? (
              <>
                <span className="loading loading-spinner loading-xs mr-2"></span>
                Loading
              </>
            ) : (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="size-6">
  <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" />
</svg>

                Refresh
              </>
            )}
          </button>
        </div>
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
