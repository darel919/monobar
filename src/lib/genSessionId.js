export function getOrCreateGenSessionId() {
    if (typeof window === 'undefined') return null;
    let genSessionId = localStorage.getItem('genSessionId');
    if (!genSessionId) {
        genSessionId = crypto.randomUUID ? crypto.randomUUID() : ([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g, c=>(c^crypto.getRandomValues(new Uint8Array(1))[0]&15>>c/4).toString(16));
        localStorage.setItem('genSessionId', genSessionId);
    }
    return genSessionId;
}
