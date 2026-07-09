#!/usr/bin/env python3
"""Verify candidate image URLs actually resolve before locking them into the itinerary.

Unsplash photo IDs surfaced via WebSearch results are usually real, but occasionally
a search snippet is stale/wrong. This does a cheap HEAD check and rejects:
  - anything that doesn't return 200
  - plus.unsplash.com / premium_photo URLs (Unsplash+ paid tier — NOT free-licensed,
    do not use even though the URL resolves)

Usage:
    python3 verify_images.py url1 url2 url3 ...
    echo '["url1","url2"]' | python3 verify_images.py --stdin

Prints JSON: {"good": [...], "rejected": [{"url":..., "reason":...}, ...]}
"""
import json, sys, time, argparse
import urllib.request, urllib.error

UA = "Mozilla/5.0 TravelItineraryBuilder/1.0"


def check(url, retries=3):
    if "plus.unsplash.com" in url or "premium_photo" in url:
        return False, "unsplash+ paid tier, not free-licensed"
    for attempt in range(retries):
        try:
            req = urllib.request.Request(url, method="HEAD", headers={"User-Agent": UA})
            with urllib.request.urlopen(req, timeout=10) as r:
                # 2xx/3xx (redirects are auto-followed by urllib) both mean the asset is reachable
                if 200 <= r.status < 400:
                    return True, None
                return False, f"HTTP {r.status}"
        except urllib.error.HTTPError as e:
            if e.code == 429 and attempt < retries - 1:
                time.sleep(2 * (attempt + 1))
                continue
            return False, f"HTTP {e.code}"
        except Exception as e:
            return False, str(e)


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("urls", nargs="*")
    ap.add_argument("--stdin", action="store_true", help="read a JSON array of URLs from stdin")
    args = ap.parse_args()

    urls = args.urls
    if args.stdin:
        urls = json.loads(sys.stdin.read())

    good, rejected = [], []
    for u in urls:
        ok, reason = check(u)
        (good if ok else rejected).append(u if ok else {"url": u, "reason": reason})

    print(json.dumps({"good": good, "rejected": rejected}, indent=2))
