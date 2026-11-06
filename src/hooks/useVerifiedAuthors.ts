import { useState, useEffect } from 'react';
import { AuthorProfile } from '../types';
import { getAuthorProfiles } from '../services/db';
import { isAuthorVerificationActive } from '../components/common/ColombianVerifiedBadge';

let cachedProfiles: AuthorProfile[] | null = null;
let cacheTimestamp = 0;
const CACHE_TTL_MS = 60_000;

export function useAuthorDirectory() {
  const [profiles, setProfiles] = useState<AuthorProfile[]>(cachedProfiles || []);

  useEffect(() => {
    let mounted = true;
    const now = Date.now();
    if (cachedProfiles && now - cacheTimestamp < CACHE_TTL_MS) {
      setProfiles(cachedProfiles);
      return;
    }

    getAuthorProfiles()
      .then((list) => {
        cachedProfiles = list;
        cacheTimestamp = Date.now();
        if (mounted) setProfiles(list);
      })
      .catch(() => {});

    return () => {
      mounted = false;
    };
  }, []);

  const findAuthorProfile = (email?: string, name?: string): AuthorProfile | undefined => {
    if (!email && !name) return undefined;
    const cleanEmail = email?.trim().toLowerCase();
    const cleanName = name?.trim().toLowerCase();
    return profiles.find(
      (p) =>
        (cleanEmail && p.email?.toLowerCase() === cleanEmail) ||
        (cleanName && p.fullName?.toLowerCase() === cleanName)
    );
  };

  const isVerifiedAuthor = (email?: string, name?: string): boolean => {
    const prof = findAuthorProfile(email, name);
    return isAuthorVerificationActive(prof);
  };

  return { profiles, findAuthorProfile, isVerifiedAuthor };
}
