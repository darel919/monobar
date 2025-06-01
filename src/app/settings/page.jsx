"use client";

import { useRouter } from 'next/navigation';
import Settings from '@/components/Settings';

export default function SettingsPage() {
    const router = useRouter();

    return (
        <div className="min-h-screen bg-base-100 pt-20">
            <div className="container mx-auto p-6 max-w-4xl">
                <div className="flex items-center gap-4 mb-8">
                    <button 
                        onClick={() => router.back()}
                        className="btn btn-ghost btn-circle"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="size-5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
                        </svg>
                        Back
                    </button>
                    <h1 className="text-4xl font-bold mb-2">Settings</h1>
                    <p className="text-base-content/70">Customize your moNobar experience</p>
                </div>

                <Settings showBackButton={true} />
            </div>
        </div>    );
}
