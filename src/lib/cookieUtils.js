import Cookies from 'js-cookie';

/**
 * Sets cookies for both current domain and cross-domain (monobar.server.drl <-> monobar.darelisme.my.id)
 * monobar.server.drl is ALWAYS insecure (http)
 * monobar.darelisme.my.id is ALWAYS secure (https)
 */
export function setCrossDomainCookie(name, value, options = {}) {
    if (typeof window === 'undefined') return;
    
    const currentHostname = window.location.hostname;
    const currentProtocol = window.location.protocol;

    const defaultOptions = {
        path: '/',
        sameSite: 'lax',
        expires: 7,
        ...options
    };

    const currentSecure = currentProtocol === 'https:';
    Cookies.set(name, value, {
        ...defaultOptions,
        secure: currentSecure
    });
    

    if (currentHostname === 'monobar.darelisme.my.id') {

        Cookies.set(name, value, {
            ...defaultOptions,
            domain: '.server.drl',
            secure: false
        });
    } else if (currentHostname === 'monobar.server.drl') {

        Cookies.set(name, value, {
            ...defaultOptions,
            domain: '.darelisme.my.id',
            secure: true
        });
    }
}

export function removeCrossDomainCookie(name, options = {}) {
    if (typeof window === 'undefined') return;
    
    const currentHostname = window.location.hostname;

    const defaultOptions = {
        path: '/',
        ...options
    };
    

    Cookies.remove(name, defaultOptions);
    Cookies.remove(name, { path: '/' });
    Cookies.remove(name);
    

    if (currentHostname === 'monobar.darelisme.my.id') {

        Cookies.remove(name, {
            ...defaultOptions,
            domain: '.server.drl'
        });
    } else if (currentHostname === 'monobar.server.drl') {

        Cookies.remove(name, {
            ...defaultOptions,
            domain: '.darelisme.my.id'
        });
    }
}

export function removeAllCrossDomainCookies() {
    const appCookieNames = [
        'jellyAccessToken',
        'jellyUserId', 
        'librarySortBy',
        'librarySortOrder'
    ];
    
    appCookieNames.forEach(cookieName => {
        removeCrossDomainCookie(cookieName);
    });
}


export function setCrossDomainDocumentCookie(name, value, options = {}) {
    if (typeof document === 'undefined') return;
    
    const currentHostname = window.location.hostname;
    const currentProtocol = window.location.protocol;

    const defaultPath = options.path || '/';
    const defaultExpires = options.expires || 7;
    const expiresDate = new Date();
    expiresDate.setDate(expiresDate.getDate() + defaultExpires);

    const currentSecure = currentProtocol === 'https:';
    const currentCookieString = `${name}=${value}; path=${defaultPath}; expires=${expiresDate.toUTCString()}; SameSite=lax${currentSecure ? '; Secure' : ''}`;
    document.cookie = currentCookieString;

    if (currentHostname === 'monobar.darelisme.my.id') {

        const crossCookieString = `${name}=${value}; path=${defaultPath}; domain=.server.drl; expires=${expiresDate.toUTCString()}; SameSite=lax`;
        document.cookie = crossCookieString;
    } else if (currentHostname === 'monobar.server.drl') {
  
        const crossCookieString = `${name}=${value}; path=${defaultPath}; domain=.darelisme.my.id; expires=${expiresDate.toUTCString()}; SameSite=lax; Secure`;
        document.cookie = crossCookieString;
    }
}
