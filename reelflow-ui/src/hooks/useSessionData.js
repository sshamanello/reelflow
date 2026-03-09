import { useCallback, useEffect, useState } from "react";
import { api } from "../lib/api";

export function useSessionData() {
  const [profiles, setProfiles] = useState({});
  const [stats, setStats] = useState(null);
  const [projects, setProjects] = useState([]);
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    setLoading(true);

    try {
      const [meRes, statsRes, projectsRes, videosRes] = await Promise.allSettled([
        api.getMe(),
        api.getStats(),
        api.getProjects(),
        api.getVideos(),
      ]);

      setProfiles(meRes.status === "fulfilled" ? meRes.value.profiles || {} : {});
      setStats(statsRes.status === "fulfilled" ? statsRes.value : null);
      setProjects(projectsRes.status === "fulfilled" ? projectsRes.value.projects || [] : []);
      setVideos(videosRes.status === "fulfilled" ? videosRes.value.videos || [] : []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  return {
    profiles,
    stats,
    projects,
    videos,
    loading,
    reload,
    setProjects,
    setVideos,
    setProfiles,
  };
}
