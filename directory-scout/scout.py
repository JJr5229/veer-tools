#!/usr/bin/env python3
"""
Directory Scout — count businesses per niche x city with the Google Places API (New).

Usage:
  export GOOGLE_PLACES_KEY=...            # Places API (New) enabled on the key
  python3 scout.py niches.txt cities.txt  # writes counts.csv

niches.txt : one search phrase per line   (e.g. "epoxy garage floor")
cities.txt : one "City, ST" per line      (e.g. "Woodbury, MN")

What it records (aggregates only — Google's terms don't allow caching Places
content for your own directory, so this is for SIZING a market, not for
building listings):
  count             unique businesses found (Text Search caps at 60 -> "60+")
  pct_no_website    share with no website  -> Veer website upsell pool
  pct_under_25_rev  share with < 25 Google reviews -> GBP / review upsell pool
  avg_rating        average star rating
"""
import csv, json, os, sys, time, urllib.request

URL = "https://places.googleapis.com/v1/places:searchText"
FIELDS = ("places.id,places.businessStatus,places.rating,"
          "places.userRatingCount,places.websiteUri,nextPageToken")

def search(key, query):
    seen, token = {}, None
    for _ in range(3):  # API returns max 3 pages x 20 = 60
        body = {"textQuery": query, "pageSize": 20}
        if token:
            body["pageToken"] = token
        req = urllib.request.Request(URL, data=json.dumps(body).encode(), headers={
            "Content-Type": "application/json",
            "X-Goog-Api-Key": key,
            "X-Goog-FieldMask": FIELDS,
        })
        with urllib.request.urlopen(req, timeout=30) as r:
            data = json.load(r)
        for p in data.get("places", []):
            if p.get("businessStatus", "OPERATIONAL") == "OPERATIONAL":
                seen[p["id"]] = p
        token = data.get("nextPageToken")
        if not token:
            break
        time.sleep(2)  # page tokens need a moment to become valid
    return list(seen.values())

def main():
    key = os.environ.get("GOOGLE_PLACES_KEY")
    if not key or len(sys.argv) < 3:
        sys.exit(__doc__)
    niches = [l.strip() for l in open(sys.argv[1]) if l.strip()]
    cities = [l.strip() for l in open(sys.argv[2]) if l.strip()]
    out = sys.argv[3] if len(sys.argv) > 3 else "counts.csv"
    with open(out, "w", newline="") as f:
        w = csv.writer(f)
        w.writerow(["niche", "city", "count", "pct_no_website",
                    "pct_under_25_reviews", "avg_rating"])
        for n in niches:
            for c in cities:
                places = search(key, f"{n} in {c}")
                k = len(places)
                nw = sum(1 for p in places if not p.get("websiteUri"))
                lr = sum(1 for p in places if p.get("userRatingCount", 0) < 25)
                rated = [p["rating"] for p in places if "rating" in p]
                w.writerow([n, c, "60+" if k >= 60 else k,
                            f"{nw / k:.0%}" if k else "",
                            f"{lr / k:.0%}" if k else "",
                            f"{sum(rated) / len(rated):.2f}" if rated else ""])
                f.flush()
                print(f"{n:30s} {c:25s} {k}")

if __name__ == "__main__":
    main()
