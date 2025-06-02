"use client";

import React, { useEffect, useState } from 'react';
import { getHome } from "@/lib/api";
import ErrorState from "@/components/ErrorState";
import LibraryViewDisplay from "@/components/LibraryViewDisplay";
import Link from 'next/link';
import HomeRequestList from '@/components/HomeRequestList';
import HeroCarousel from '@/components/HomeHeroCarousel';
import { homeViewUtils } from '@/lib/homeViewUtils';

export default function Home() {
    const [homeData, setHomeData] = useState(null);
    const [error, setError] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [homeViewMode, setHomeViewMode] = useState('default_poster_home');

    useEffect(() => {
        const savedViewMode = homeViewUtils.getHomeViewMode();
        setHomeViewMode(savedViewMode);
    }, []);

    const handleViewModeChange = (mode) => {
        setHomeViewMode(mode);
        homeViewUtils.setHomeViewMode(mode);
    };

    useEffect(() => {
        const fetchHomeData = async () => {
            try {
                setIsLoading(true);
                const data = await getHome();
                setHomeData(data);
                setError(null);
            } catch (err) {
                console.error('Home fetch error:', err);
                setError(err.message);
            } finally {
                setIsLoading(false);
            }
        };

        fetchHomeData();
    }, []);

    if (isLoading && !homeData) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-white"></div>
            </div>
        );
    }

    if (error) {
        return (
            <ErrorState 
                message="Currently, moNobar library is unavailable." 
                actionText="Try Again" 
                actionDesc="We are having trouble loading the moNobar content library. Please try refreshing the page."
            />
        );
    }

    if (!homeData || homeData.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen text-center p-8">
                <h1 className="text-3xl font-bold mb-4">Welcome to moNobar</h1>
                <p className="text-gray-400 mb-8">No content libraries are currently available.</p>
                <Link 
                    href="/request" 
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors"
                >
                    Request Content
                </Link>
            </div>
        );
    }

    const getAllLatestItems = () => {
        const allLatest = [];
        homeData.forEach(item => {
            if (item.latest && item.latest.length > 0) {
                allLatest.push(...item.latest);
            }
        });
        return allLatest;
    };

    const heroItems = getAllLatestItems();

    return (
        <>
            <section className="flex flex-col min-h-screen px-8 pb-8 pt-4 mt-16">
                <div className="flex items-center justify-between mb-8">
                    <h1 className="text-4xl">Home</h1>
                    <div className="flex gap-2">
                        {homeViewUtils.getAvailableViewModes().map((mode) => (
                            <button
                                key={mode.id}
                                onClick={() => handleViewModeChange(mode.id)}
                                className={`btn btn-sm ${homeViewMode === mode.id ? 'btn-primary' : 'btn-ghost'}`}
                                title={mode.description}
                            >
                                {mode.icon}
                            </button>
                        ))}
                    </div>
                </div>
                
                {heroItems.length > 0 && (
                    <HeroCarousel items={heroItems} />
                )}

                {homeData.length > 0 ? (
                    <section>
                        {homeData.map((item, index) => (
                            <React.Fragment key={`section-${index}`}>
                                {item.latest && item.latest.length > 0 ? (
                                    <div key={`latest-${index}`} className="mt-8">
                                        <a href={`/library?id=${item.Id}`} className="hover:underline">
                                            <h2 className="text-2xl font-bold mb-4">Latest {item.Name}</h2>
                                        </a>
                                        <LibraryViewDisplay data={item.latest} viewMode={homeViewMode} />
                                    </div>
                                ) : null}
                                {item.comingSoon && item.comingSoon.length > 0 ? (
                                    <div className="mt-8" title="These titles are currently being downloaded and soon will be available in the library.">
                                        <Link href="/request" className="hover:underline">
                                            <h2 className="text-2xl font-bold mb-4">Coming Soon to MoNobar</h2>
                                            <HomeRequestList />
                                        </Link>
                                    </div>
                                ) : null}
                            </React.Fragment>
                        ))}
                    </section>
                ) : null}
            </section>
        </>
    );
}
