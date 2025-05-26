export const SEARCH_TYPES = {
  genre: {
    label: 'Genre',
    placeholder: 'Search for genres',
    displayName: 'Genre'
  },
  // person: {
  //   label: 'Person',
  //   placeholder: 'Search for people',
  //   displayName: 'Person'
  // }
};

export function parseSearchInput(input) {
    if (!input || typeof input !== 'string') {
        return { type: null, query: input || '', hasPrefix: false };
    }

    const trimmedInput = input.trim();
    const prefixMatch = trimmedInput.match(/^(\w+):(.*)$/);
      if (prefixMatch) {
        const [, potentialType, query] = prefixMatch;
        const normalizedType = potentialType.toLowerCase();

        if (SEARCH_TYPES[normalizedType]) {
            return {
                type: normalizedType,
                query: query.trim(),
                hasPrefix: true
            };
        }
    }
  return { type: null, query: trimmedInput, hasPrefix: false };
}

export function getSearchPlaceholder(input) {
  const { type, hasPrefix } = parseSearchInput(input);
  
  if (hasPrefix && type && SEARCH_TYPES[type]) {
    return SEARCH_TYPES[type].placeholder;
  }
  
  return 'Search';
}

export function getSearchTypeDisplayName(type) {
  return SEARCH_TYPES[type]?.displayName || '';
}

export function buildSearchUrl(input, options = {}) {
  const { type, query } = parseSearchInput(input);
  const params = new URLSearchParams();

  if (type) {
    params.set('type', type);
    if (query.trim()) {
      params.set('q', query.trim());
    }
  } else if (query.trim()) {
    params.set('q', query.trim());
  }

  Object.entries(options).forEach(([key, value]) => {
    if (value) {
      params.set(key, value.toString());
    }
  });

  return `/search${params.toString() ? `?${params.toString()}` : ''}`;
}
