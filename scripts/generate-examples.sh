#!/bin/bash
# Batch generate example videos with Seedance 2.0
# Runs 5 at a time in async mode, then polls for results

SKILL="/Users/ilker-fal/.claude/skills/fal-generate/scripts/generate.sh"
MODEL="bytedance/seedance-2.0/text-to-video"
RESULTS_FILE="/Users/ilker-fal/Documents/GitHub/fal-awesome-prompts/scripts/results.json"

echo "[]" > "$RESULTS_FILE"

generate_and_track() {
  local idx="$1"
  local prompt="$2"
  local author="$3"
  local source="$4"

  echo "[#$idx] Submitting..."
  local output
  output=$(bash "$SKILL" --prompt "$prompt" --model "$MODEL" --async --timeout 600 2>&1)
  local req_id
  req_id=$(echo "$output" | grep -o 'Request ID: [^ ]*' | cut -d' ' -f3)

  if [ -z "$req_id" ]; then
    echo "[#$idx] FAILED to submit"
    return 1
  fi

  echo "[#$idx] Queued: $req_id"

  # Poll until done (max 10 min)
  for i in $(seq 1 120); do
    sleep 5
    local status
    status=$(bash "$SKILL" --status "$req_id" --model "$MODEL" 2>&1)
    if echo "$status" | grep -q "COMPLETED"; then
      local result
      result=$(bash "$SKILL" --result "$req_id" --model "$MODEL" 2>&1)
      local video_url
      video_url=$(echo "$result" | grep -o 'https://[^ ]*\.mp4' | head -1)
      if [ -n "$video_url" ]; then
        echo "[#$idx] DONE: $video_url"
        # Append to results
        python3 -c "
import json
with open('$RESULTS_FILE','r') as f: data=json.load(f)
data.append({'idx':$idx,'prompt':'''$prompt'''[:100],'author':'$author','source':'$source','video_url':'$video_url','request_id':'$req_id'})
with open('$RESULTS_FILE','w') as f: json.dump(data,f,indent=2)
"
        return 0
      fi
    elif echo "$status" | grep -q "FAILED\|ERROR"; then
      echo "[#$idx] FAILED"
      return 1
    fi
  done
  echo "[#$idx] TIMEOUT"
  return 1
}

# ─── Batch 1: 5 prompts from local seedance_prompts.json ───
echo "=== BATCH 1 (5 prompts) ==="

generate_and_track 1 \
  "Single continuous cinematic shot, no music. From outside the glass window, the dim camera slowly pushes inward into a pizza shop. A bearded white male employee is baking pizza. He removes the pizza from the oven with a metal tray, places it into a red takeaway box, closes the lid, and then hands it to a customer with a warm smile. Final shot: over-the-shoulder perspective." \
  "ilker-fal" \
  "seedance_prompts.json" &

generate_and_track 2 \
  "Generate a 15-second photorealistic street dance battle at night. The urban street has reflective wet pavement, neon lights, and a thin mist. A group of young dancers forms a semicircle. The first 5 seconds focus on one dancer performing challenging solo floor moves. The remaining 10 seconds show the full group performing synchronized choreography combining breaking, popping, locking, and hip-hop." \
  "ilker-fal" \
  "seedance_prompts.json" &

generate_and_track 3 \
  "90s Hong Kong art cinema style with retro grain, yellow-green tint, and step-printing effect. A man or woman in a khaki trench coat listens silently at a rain-soaked red phone booth. Extreme close-ups capture subtle lip trembles and restrained emotion as neon reflections flicker across the face. The character hangs up and walks into the rainy night crowd, with motion blur and step-printing creating a smeared, dreamlike effect." \
  "ilker-fal" \
  "seedance_prompts.json" &

generate_and_track 4 \
  "Create a vertical ASMR video with no music, focusing on macro details. A light blue skincare gel bottle sits on glass. A pale, elegant hand gently taps the glass, producing crisp fingernail tapping sounds. The hand picks up the bottle and slowly twists the cap, with the rotation sound clearly audible. A spoon scoops a portion of gel and drops it onto the glass with a soft plop, showing dense gel with tiny air bubbles." \
  "ilker-fal" \
  "seedance_prompts.json" &

generate_and_track 5 \
  "An ultra-luxury perfume commercial with a dreamy electronic soundtrack and steady drum beats. Begin with a macro shot of a transparent rectangular glass bottle surrounded by violently swirling purple liquid. Capture the churning liquid with bubbles and splashes, accompanied by crisp water sounds. Dissolve into surface ripples of the purple liquid, then show a close-up of delicate iris flowers floating underwater." \
  "ilker-fal" \
  "seedance_prompts.json" &

wait
echo "=== BATCH 1 COMPLETE ==="

# ─── Batch 2: 5 prompts mixed ───
echo "=== BATCH 2 (5 prompts) ==="

generate_and_track 6 \
  "First-person POV dive footage. A scuba diver descends into a pitch-black ocean. The only light is the divers torch cutting a narrow beam into the dark. At depth, the torch clicks off. Total darkness for two seconds. Then faint blue pulses. Bioluminescent creatures begin appearing in the void: a jellyfish drifts past, trailing light. A school of fish materialises as a glowing spiral. The diver reaches out slowly; the fish scatter like sparks." \
  "ilker-fal" \
  "seedance_prompts.json" &

generate_and_track 7 \
  "Extreme macro commercial shot. A crystal whisky glass sits on a dark, textured surface. A slow pour begins from above: amber liquid streams into the glass, splashing in extreme slow motion. Droplets hang in the air, catching backlight. The liquid settles, sloshing against the crystal walls, tiny bubbles forming at the surface. The camera eases back in a smooth dolly-out to reveal the full glass and bottle beside it." \
  "ilker-fal" \
  "seedance_prompts.json" &

generate_and_track 8 \
  "A car sketch on paper. The camera pushes in. The sketch lines rise off the paper, gaining dimensionality and color, transforming into a photorealistic 3D car driving on a road." \
  "ilker-fal" \
  "seedance_prompts.json" &

generate_and_track 9 \
  "Sweeping drone shot ascending from a misty valley floor, slowly revealing a vast mountain range at sunrise, golden light breaking through clouds and casting long shadows across pine forests, orchestral grandeur, National Geographic documentary quality, ultra-smooth camera movement" \
  "ilker-fal" \
  "seedance_prompts.json" &

generate_and_track 10 \
  "A perfect sphere of liquid mercury sitting on a mirror surface, slowly deforming under an invisible force into a cube shape, then morphing back to a sphere, reflections shifting with each transformation, seamless loop-ready motion, ASMR-satisfying aesthetic, macro lens extreme close-up, clean minimalist background" \
  "ilker-fal" \
  "seedance_prompts.json" &

wait
echo "=== BATCH 2 COMPLETE ==="

echo ""
echo "=== ALL DONE ==="
echo "Results saved to: $RESULTS_FILE"
cat "$RESULTS_FILE"
