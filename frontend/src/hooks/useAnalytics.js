import { useCallback } from "react";
import axios from "axios";
import { API } from "@/App";

export const useAnalytics = () => {
  const trackView = useCallback(async (targetType, targetId) => {
    try {
      await axios.post(`${API}/analytics/track`, {
        event_type: "view",
        target_type: targetType,
        target_id: targetId,
      });
    } catch (error) {
      // Silent fail for analytics
      console.debug("Analytics track failed:", error);
    }
  }, []);

  const trackClick = useCallback(async (targetType, targetId) => {
    try {
      await axios.post(`${API}/analytics/track`, {
        event_type: "click",
        target_type: targetType,
        target_id: targetId,
      });
    } catch (error) {
      console.debug("Analytics track failed:", error);
    }
  }, []);

  const trackContact = useCallback(async (prestadorId) => {
    try {
      await axios.post(`${API}/analytics/track`, {
        event_type: "contact",
        target_type: "prestador",
        target_id: prestadorId,
      });
    } catch (error) {
      console.debug("Analytics track failed:", error);
    }
  }, []);

  const trackSearch = useCallback(async (term) => {
    if (!term || term.length < 2) return;
    try {
      await axios.post(`${API}/analytics/search`, { term });
    } catch (error) {
      console.debug("Analytics track failed:", error);
    }
  }, []);

  return { trackView, trackClick, trackContact, trackSearch };
};

export default useAnalytics;
