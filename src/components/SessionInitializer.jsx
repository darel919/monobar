'use client';

import { useEffect } from 'react';
import { getOrCreateGenSessionId } from '@/lib/genSessionId';

export default function SessionInitializer() {
    useEffect(() => {
        getOrCreateGenSessionId();
    }, []);
    return null;
}
