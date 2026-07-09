#!/usr/bin/env python3
"""Fallback image source when Unsplash (via WebSearch) doesn't have a good enough shot.

Searches Wikimedia Commons for CC-licensed photos and returns direct hotlink URLs
(commons.wikimedia.org/wiki/Special:FilePath/<title>) plus credit metadata — no
download or format conversion needed since the itinerary hotlinks images rather
than embedding them as base64.

Usage:
    python3 wikimedia_search.py "Portara Naxos" --need 3
    python3 wikimedia_search.py "Portara Naxos" "Naxos harbor ruins" --need 3

Prints a JSON array to stdout: [{title, url, descriptionurl, artist, license}, ...]
"""
import json, re, sys, argparse
import urllib.request, urllib.parse

UA = "Mozilla/5.0 TravelItineraryBuilder/1.0 (personal travel doc; contact: user@example.com)"
BAD_TITLE_WORDS = ['map', 'flag', 'coat of arms', 'diagram', 'logo', 'chart', 'icon', 'stamp', 'coin']
GOOD_EXT = ('.jpg', '.jpeg', '.png', '.webp')


def http_get(url, timeout=20):
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    with urllib.request.urlopen(req, timeout=timeout) as r:
        return r.read()


def commons_search(query, limit=15):
    params = {"action": "query", "list": "search", "srsearch": query,
              "srnamespace": "6", "format": "json", "srlimit": str(limit)}
    url = "https://commons.wikimedia.org/w/api.php?" + urllib.parse.urlencode(params)
    data = json.loads(http_get(url))
    return [r["title"] for r in data.get("query", {}).get("search", [])]


def commons_imageinfo(titles):
    if not titles:
        return {}
    params = {"action": "query", "titles": "|".join(titles), "prop": "imageinfo",
              "iiprop": "url|size|extmetadata", "iiurlwidth": "1200", "format": "json"}
    url = "https://commons.wikimedia.org/w/api.php?" + urllib.parse.urlencode(params)
    data = json.loads(http_get(url))
    out = {}
    for _, p in data.get("query", {}).get("pages", {}).items():
        infos = p.get("imageinfo")
        if infos:
            out[p.get("title")] = infos[0]
    return out


def extract_credit(info):
    meta = info.get("extmetadata", {})
    def val(k):
        v = meta.get(k, {}).get("value", "")
        return re.sub(r'<[^>]+>', '', v).strip()
    artist = re.sub(r'\s+', ' ', val("Artist") or "Unknown creator")[:60]
    license_short = val("LicenseShortName") or "CC"
    return artist, license_short


def is_good(title, info):
    tl = title.lower()
    if not tl.endswith(GOOD_EXT):
        return False
    if any(w in tl for w in BAD_TITLE_WORDS):
        return False
    if not info.get("extmetadata", {}).get("LicenseShortName", {}).get("value"):
        return False
    w = info.get("thumbwidth", 0) or info.get("width", 0)
    return not w or w >= 700


def search_and_pick(queries, need=3):
    seen = []
    for q in queries:
        for t in commons_search(q, limit=15):
            if t not in seen:
                seen.append(t)
        if len(seen) >= 20:
            break
    infos = commons_imageinfo(seen)
    picked = []
    for t in seen:
        info = infos.get(t)
        if not info or not is_good(t, info):
            continue
        artist, lic = extract_credit(info)
        # Use the thumbnail URL (upload.wikimedia.org/.../thumb/...), NOT Special:FilePath —
        # Wikimedia explicitly rate-limits/discourages hotlinking full-res originals and asks
        # bots to use thumbnails instead (see https://w.wiki/GHai).
        thumb = info.get("thumburl") or info.get("url")
        picked.append({
            "title": t, "url": thumb,
            "descriptionurl": info.get("descriptionurl", ""),
            "artist": artist, "license": lic,
        })
        if len(picked) >= need:
            break
    return picked


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("queries", nargs="+", help="one or more search queries, tried in order")
    ap.add_argument("--need", type=int, default=3)
    args = ap.parse_args()
    result = search_and_pick(args.queries, need=args.need)
    print(json.dumps(result, indent=2))
    if len(result) < args.need:
        print(f"WARNING: only found {len(result)}/{args.need}", file=sys.stderr)
