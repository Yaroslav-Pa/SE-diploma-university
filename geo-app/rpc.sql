-- Run this in your Supabase SQL Editor to add the spatial query function

CREATE OR REPLACE FUNCTION get_pois_in_bounds(min_lat float, min_lng float, max_lat float, max_lng float)
RETURNS SETOF public.pois AS $$
BEGIN
  RETURN QUERY
  SELECT *
  FROM public.pois
  WHERE location && ST_MakeEnvelope(min_lng, min_lat, max_lng, max_lat, 4326)
  AND (end_date IS NULL OR end_date > NOW());
END;
$$ LANGUAGE plpgsql;
