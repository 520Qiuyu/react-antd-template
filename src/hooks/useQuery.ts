import React from 'react';
import { useLocation } from 'react-router-dom';
export function useQuery<T = any>() {
  const { search } = useLocation();
  return React.useMemo<T>(() => {
    const query = new URLSearchParams(search);
    // 遍历query
    const params: any = {};
    for (const [key, value] of query.entries()) {
      params[key] = tryParseJson(value) ?? value;
    }
    return params;
  }, [search]);
}

function tryParseJson(str: string) {
  try {
    return JSON.parse(str);
  } catch (e) {
    return str;
  }
}
