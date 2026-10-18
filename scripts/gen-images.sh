#!/bin/bash
# Generate seed images for WaraNusa cultural items
set -u
OUT="/home/z/my-project/public/uploads/seed"
mkdir -p "$OUT"

gen() {
  local file="$1"; local size="$2"; local prompt="$3"
  if [ -s "$OUT/$file" ]; then echo "SKIP $file (exists)"; return 0; fi
  echo "GEN  $file ..."
  z-ai image -p "$prompt" -o "$OUT/$file" -s "$size" && echo "OK   $file" || echo "FAIL $file"
}

gen "hero-archipelago.png" "1440x720" "Stylized flat illustration of the Indonesian archipelago map with islands shown as layered paper-cut art, teal and ocean blue sea, tropical green islands, warm gold accent sun, traditional ornament motifs subtly in waves, modern editorial illustration, clean composition, high quality, detailed"

gen "rumah-gadang.png" "1344x768" "Traditional Minangkabau Rumah Gadang house in West Sumatra Indonesia with dramatic multi-tiered curved buffalo horn roof, carved wooden walls with red gold geometric ornaments, tropical garden foreground, warm afternoon light, professional architectural photography, high quality, detailed"

gen "joglo.png" "1344x768" "Traditional Javanese Joglo house in Yogyakarta Indonesia, tall carved wooden pillars and layered pyramid roof, open pendopo pavilion, stone floor, lush tropical courtyard, soft morning light, professional architectural photography, high quality, detailed"

gen "batik.png" "1344x768" "Elegant Javanese batik tulis cloth from Yogyakarta with indigo and sogan brown parang and kawung patterns, fabric elegantly draped with canting wax tool beside it, soft studio light, product photography, high quality, detailed"

gen "songket.png" "1344x768" "Minangkabau songket woven textile from Pandai Sikek village West Sumatra, gold metallic threads on deep red silk with geometric motifs, traditional wooden loom in background, warm studio light, product photography, high quality, detailed"

gen "gamelan.png" "1344x768" "Traditional Javanese gamelan saron instrument, bronze keyed metallophone on ornately carved wooden resonator case, wooden mallets resting on top, kraton palace interior softly blurred in background, warm golden light, professional photography, high quality, detailed"

gen "angklung.png" "1344x768" "Traditional Sundanese angklung bamboo musical instruments from West Java Indonesia, set of wooden frame angklung of different sizes hanging on a rack, bamboo texture detail, bright tropical daylight, professional photography, high quality, detailed"

gen "kecak.png" "1344x768" "Balinese Kecak fire dance performance at Uluwatu temple cliff at sunset, circle of seated male dancers raising hands, dramatic orange sky over ocean, dynamic cultural photography, high quality, detailed"

gen "tari-piring.png" "1344x768" "Minangkabau Tari Piring plate dance from West Sumatra, female dancer in traditional red and gold costume holding plates in both hands, dynamic spinning motion, festival stage lighting, cultural performance photography, high quality, detailed"

echo "ALL DONE"
