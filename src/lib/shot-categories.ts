// Auto-generated from awesome-video-prompts repo
// Each option has a real video example from fal.ai

export interface ShotOption {
  id: string;
  label: string;
  description: string;
  video: string;
  thumbnail: string;
}

export interface ShotCategory {
  id: string;
  name: string;
  description: string;
  options: ShotOption[];
}

export const SHOT_CATEGORIES: ShotCategory[] = [
  {
    id: "lighting",
    name: "Lighting",
    description: "Lighting styles and setups for cinematic mood",
    options: [
      { id: "dramatic-backlight", label: "dramatic backlight", description: "dominant rear key creating strong rim, silhouette-capable ratio, controlled ambient, light haze for ", video: "https://v3.fal.media/files/panda/nDEl7Qd6bvoegS9gPzZ1-_output.mp4", thumbnail: "" },
      { id: "natural-sunlight", label: "natural sunlight", description: "directional solar key, sky dome bounce, defined penumbra, neutral white balance, realistic contrast ", video: "https://v3.fal.media/files/zebra/XPpmjiVY8ulLRYbwsJNeX_output.mp4", thumbnail: "" },
      { id: "neon-city-lighting", label: "neon city lighting", description: "saturated cyan-magenta signage spill, localized colored pools, subtle atmospheric bloom, mixed CCT s", video: "https://v3.fal.media/files/koala/6Iujja2xdljwPLtYBkWgq_output.mp4", thumbnail: "" },
      { id: "soft-diffused-lighting", label: "soft diffused lighting", description: "large-area diffused source, even luminance, low specularity, compressed contrast, neutral colorimetr", video: "https://v3.fal.media/files/zebra/UQjPgG7_FFZNEPibNe1oG_output.mp4", thumbnail: "" },
      { id: "soft-golden-hour-lighting", label: "soft golden-hour lighting", description: "low-angle warm sunlight, elongated soft-edged shadows, gentle falloff, warm rim separation, slightly", video: "https://v3.fal.media/files/zebra/UiPHJKIj_NQxbz2m1I2I9_output.mp4", thumbnail: "" },
    ],
  },
  {
    id: "camera_shot",
    name: "Camera Shot",
    description: "Camera framing and composition types",
    options: [
      { id: "aerial-view", label: "aerial view", description: "top-down high vantage, visible ground geometry and patterns, clear parallax lines, layout-revealing ", video: "https://v3.fal.media/files/koala/TkD94GKLFhaMixrWLKPaF_output.mp4", thumbnail: "" },
      { id: "close-up", label: "close-up", description: "tight frame on a single detail, shallow depth of field, low background information, high texture emp", video: "https://v3.fal.media/files/kangaroo/wBD2BjAZ8gPHGj6q05Tzp_output.mp4", thumbnail: "" },
      { id: "low-angle", label: "low angle", description: "camera below focal horizon, upward tilt emphasizing verticals, mild perspective exaggeration, increa", video: "https://v3.fal.media/files/koala/xS5xLi91D1nq0LsL-7j4U_output.mp4", thumbnail: "" },
      { id: "medium-shot", label: "medium shot", description: "balanced framing with moderate subject size, contextual background retention, comfortable headroom a", video: "https://v3.fal.media/files/rabbit/Tu1Id9wogEnaQJuxp5rBl_output.mp4", thumbnail: "" },
      { id: "wide-shot", label: "wide shot", description: "broad field of view prioritizing spatial scale, small frame occupancy for focal element, layered for", video: "https://v3.fal.media/files/tiger/m-eXQ_zWlXpJhzWd5iprY_output.mp4", thumbnail: "" },
    ],
  },
  {
    id: "camera_movement",
    name: "Camera Movement",
    description: "Dynamic camera movements and transitions",
    options: [
      { id: "dolly-forward", label: "dolly forward", description: "linear forward translation, stabilized path, increasing foreground parallax, smooth ease in/out", video: "https://v3.fal.media/files/monkey/cWWmkL8UsaKnnLd9Y1u7D_output.mp4", thumbnail: "" },
      { id: "pan-left", label: "pan left", description: "leftward horizontal pivot on nodal point, constant angular speed, shutter-matched motion blur, horiz", video: "https://v3.fal.media/files/panda/cE3vyAYM-70bTSqItc4jn_output.mp4", thumbnail: "" },
      { id: "pan-right", label: "pan right", description: "rightward horizontal pivot on nodal point, constant angular speed, shutter-matched motion blur, hori", video: "https://v3.fal.media/files/panda/DChXp2Q8fWBGR_DFh9UPg_output.mp4", thumbnail: "" },
      { id: "static-shot", label: "static shot", description: "locked-off support emulation, zero drift, no micro jitter, only intra-frame elements exhibit motion", video: "https://v3.fal.media/files/rabbit/H-sFqjgyJRQSQzUlP0ppC_output.mp4", thumbnail: "" },
      { id: "zoom-in", label: "zoom in", description: "optical-style focal length reduction toward tighter FOV, centered framing retention, gentle accelera", video: "https://v3.fal.media/files/zebra/CQoSTFmik6_iTGbU6eyWO_output.mp4", thumbnail: "" },
    ],
  },
  {
    id: "mood",
    name: "Mood",
    description: "Emotional atmosphere and tone",
    options: [
      { id: "dark-and-moody", label: "dark and moody", description: "suppressed midtones, strong black point, selective illumination zones, desaturated palette bias", video: "https://v3.fal.media/files/tiger/WdPQlJWvvURJ07G908vgP_output.mp4", thumbnail: "" },
      { id: "dramatic-and-intense", label: "dramatic and intense", description: "elevated contrast, deep shadow mass, rapid intensity modulation, bold chroma accents, pronounced tex", video: "https://v3.fal.media/files/zebra/5ha1vfKE8Nx-JDULWKL1a_output.mp4", thumbnail: "" },
      { id: "mystical-and-ethereal", label: "mystical and ethereal", description: "soft highlight glow, faint particulate presence, cool-warm interplay, elongated light decay, floatin", video: "https://v3.fal.media/files/penguin/ifxbXA8Jm4bxaVBJRT9A4_output.mp4", thumbnail: "" },
      { id: "serene-and-peaceful", label: "serene and peaceful", description: "low contrast base, gentle luminance transitions, slow temporal cadence, absence of abrupt intensity ", video: "https://v3.fal.media/files/zebra/f61T7TMEzKje0-PKkX3Mv_output.mp4", thumbnail: "" },
      { id: "warm-and-nostalgic", label: "warm and nostalgic", description: "amber-biased tones, subtle halation, fine-grain texture, soft vignette, lifted shadow floor", video: "https://v3.fal.media/files/penguin/dX6uU-o4DZpDk5VkwQ_fF_output.mp4", thumbnail: "" },
    ],
  },
  {
    id: "style",
    name: "Style",
    description: "Visual and artistic style",
    options: [
      { id: "cinematic-realism", label: "cinematic realism", description: "physically plausible shading and GI, filmic response curve, restrained saturation, subtle lens artif", video: "https://v3.fal.media/files/penguin/OI0ClpOtaUZIbwRpS3CtL_output.mp4", thumbnail: "" },
      { id: "dreamy-and-soft", label: "dreamy and soft", description: "reduced micro-contrast, lifted blacks, diffused highlight bloom, pastel-leaning accents, softened ed", video: "https://v3.fal.media/files/panda/yr0XW07bE8FPpnG9G1EQT_output.mp4", thumbnail: "" },
      { id: "high-contrast", label: "high contrast", description: "compressed midtones, deep blacks, bright speculars, saturated key hues, crisp edge definition", video: "https://v3.fal.media/files/rabbit/SjQ0ige7TwWHTIbR2xQgY_output.mp4", thumbnail: "" },
      { id: "vintage-film", label: "vintage film", description: "fine grain, soft halation, mild gate weave, warm-muted palette, gentle shoulder in highlights", video: "https://v3.fal.media/files/penguin/yBbNhxhKHhIWZNxkWaLCU_output.mp4", thumbnail: "" },
    ],
  },
  {
    id: "subject",
    name: "Subject",
    description: "Primary subject and its attributes",
    options: [
      { id: "animal", label: "animal", description: "species-appropriate locomotion, secondary dynamics on appendages, anisotropic fur/feather shading, m", video: "https://v3.fal.media/files/koala/Ovvt7MrloRhB9tolI3mUs_output.mp4", thumbnail: "" },
      { id: "environment-only", label: "environment-only", description: "no hero subject, spatial depth emphasis, ambient motion sources only, architectural or natural forms", video: "https://v3.fal.media/files/rabbit/WauDDNTnBrgBrS2rSoPOd_output.mp4", thumbnail: "" },
      { id: "human-character", label: "human character", description: "natural joint articulation, facial micro-movements enabled, clothing physics with gravity and airflo", video: "https://v3.fal.media/files/zebra/qZYKtsh9tx_amYqaAidyb_output.mp4", thumbnail: "" },
      { id: "productprop", label: "product/prop", description: "clean silhouette, controlled speculars, rotation-friendly readability, neutral interference from sur", video: "https://v3.fal.media/files/rabbit/7MbelAlKWYgJ5xV1ZVyY-_output.mp4", thumbnail: "" },
      { id: "vehicle", label: "vehicle", description: "mass-aware suspension behavior, rotational blur on wheels, reflective bodywork shading, emissive lig", video: "https://v3.fal.media/files/koala/PVu-9L9d-_NvK28bgQU14_output.mp4", thumbnail: "" },
    ],
  },
  {
    id: "environment",
    name: "Environment",
    description: "Scene location and environmental conditions",
    options: [
      { id: "futuristic-city", label: "futuristic city", description: "vertical stratification, luminous interface elements, advanced transit markers, sleek materials, vol", video: "https://v3.fal.media/files/lion/vYxG15NuBq7MCyENw-A1e_output.mp4", thumbnail: "" },
      { id: "industrial-site", label: "industrial site", description: "metal frameworks, conduit networks, surface wear and patina, utility lighting, repeating structural ", video: "https://v3.fal.media/files/panda/pyEh_UDKTI_fVg-RG9_gV_output.mp4", thumbnail: "" },
      { id: "interior-room", label: "interior room", description: "enclosed volume definition, practical light sources, coherent material set, furniture layout cues, s", video: "https://v3.fal.media/files/panda/oXfEaPef_q1FqUUxn_Boz_output.mp4", thumbnail: "" },
      { id: "natural-landscape", label: "natural landscape", description: "terrain variation, vegetation distribution, geological features, atmospheric perspective gradients, ", video: "https://v3.fal.media/files/zebra/5BzQaopm2UO25pyXyCxhG_output.mp4", thumbnail: "" },
      { id: "urban-street", label: "urban street", description: "roadway and sidewalk structure, signage presence, storefront modules, pavement material variety, lay", video: "https://v3.fal.media/files/monkey/eCUu50skjQtm40M8qqzbq_output.mp4", thumbnail: "" },
    ],
  },
  {
    id: "time_of_day",
    name: "Time of Day",
    description: "Temporal context affecting light and mood",
    options: [
      { id: "blue-hour", label: "blue hour", description: "cool ambient dominance, reduced global contrast, balanced sky-ground luminance, cyan cast stability", video: "https://v3.fal.media/files/lion/FezQvnffCJHVFtXc6j9Lc_output.mp4", thumbnail: "" },
      { id: "dawn", label: "dawn", description: "cool-to-warm sky gradient, low-angle soft luminance, modest ambient level, shallow atmospheric veil", video: "https://v3.fal.media/files/elephant/artPu7fRNMr9KiAxUQ1xy_output.mp4", thumbnail: "" },
      { id: "golden-hour", label: "golden hour", description: "low sun elevation, warm spectral bias, long soft-edged shadows, enhanced highlight separation", video: "https://v3.fal.media/files/panda/EkKio2yZukmezdIsW4fgC_output.mp4", thumbnail: "" },
      { id: "midday", label: "midday", description: "high solar altitude, short hard-edged shadows, high scene illumination, neutral color rendition", video: "https://v3.fal.media/files/rabbit/yW_2u-7B0qKzpU35hJ-Zm_output.mp4", thumbnail: "" },
      { id: "night", label: "night", description: "low ambient baseline, artificial source dependence, deep shadow pockets, noise-controlled exposure", video: "https://v3.fal.media/files/rabbit/o2mmHB3X2Yo3Si1b2ccxa_output.mp4", thumbnail: "" },
    ],
  },
  {
    id: "weather",
    name: "Weather",
    description: "Atmospheric effects and conditions",
    options: [
      { id: "clear", label: "clear", description: "unobstructed visibility, minimal scatter, crisp edge definition, pronounced shadows", video: "https://v3.fal.media/files/elephant/wXCiwbsjKr30OsmDNfAxS_output.mp4", thumbnail: "" },
      { id: "fog", label: "fog", description: "volumetric scattering layer, depth desaturation, softened silhouettes, visible light beams", video: "https://v3.fal.media/files/tiger/hRl58JJZwJ_1qx17NtI7p_output.mp4", thumbnail: "" },
      { id: "overcast", label: "overcast", description: "uniform sky luminance, suppressed shadows, muted chroma, flattened contrast", video: "https://v3.fal.media/files/penguin/vx-cl5FeBDhpsnNLbc5mY_output.mp4", thumbnail: "" },
      { id: "rain", label: "rain", description: "falling streaks, wet-surface reflections, micro-ripples and splashes, elevated specular activity", video: "https://v3.fal.media/files/panda/8mY1gZ64t2ZVv50YuwJme_output.mp4", thumbnail: "" },
      { id: "snow", label: "snow", description: "aerial flakes, soft accumulation, cooler white balance bias, dampened scene contrast", video: "https://v3.fal.media/files/rabbit/MC9awaddGVey4TPt4ycEL_output.mp4", thumbnail: "" },
    ],
  },
  {
    id: "color_grade",
    name: "Color Grade",
    description: "Color grading intent and palette",
    options: [
      { id: "cool-monochrome", label: "cool monochrome", description: "low saturation, blue-tinted grayscale, luminance-driven separation, stable cool cast", video: "https://v3.fal.media/files/elephant/kMGzc1F9z1yHikChAvVuw_output.mp4", thumbnail: "" },
      { id: "earthy-tones", label: "earthy tones", description: "browns and olive greens emphasis, soft midtone contrast, organic texture priority", video: "https://v3.fal.media/files/monkey/KyZXWWyAT2cQ2lZpoIY9j_output.mp4", thumbnail: "" },
      { id: "neon-pop", label: "neon pop", description: "high-chroma magenta-cyan-violet accents, pronounced bloom on brights, deep clean blacks", video: "https://v3.fal.media/files/penguin/PY5rNxmAuQ_N2_U4IXJPr_output.mp4", thumbnail: "" },
      { id: "neutral-filmic", label: "neutral filmic", description: "log-to-film tone map, gentle shoulder and toe, natural neutrals, restrained saturation", video: "https://v3.fal.media/files/elephant/EOGexjXSR_tD4I_evsyXE_output.mp4", thumbnail: "" },
      { id: "teal-and-orange", label: "teal and orange", description: "cyan-biased shadows, warm-biased highlights, preserved neutrals, boosted contrast", video: "https://v3.fal.media/files/monkey/cEV_X4OiJI8fsuu5MqDPR_output.mp4", thumbnail: "" },
    ],
  },
  {
    id: "lens",
    name: "Lens",
    description: "Lens characteristics and optical behavior",
    options: [
      { id: "anamorphic", label: "anamorphic", description: "cinemascope stretch feel, oval bokeh, horizontal flares, gentle edge softness", video: "https://v3.fal.media/files/elephant/RNS1g3JAM0ZjSNtik069Y_output.mp4", thumbnail: "" },
      { id: "macro-detail", label: "macro detail", description: "extreme close focus, high reproduction ratio, pronounced bokeh, micro-texture resolution", video: "https://v3.fal.media/files/lion/0GQrvm3dBWIv1yoKq-HQy_output.mp4", thumbnail: "" },
      { id: "standard-lens", label: "standard lens", description: "approx 35–50mm FOV, natural perspective, balanced background compression", video: "https://v3.fal.media/files/tiger/IplNfztQKI2HC6J7ysNeI_output.mp4", thumbnail: "" },
      { id: "telephoto-lens", label: "telephoto lens", description: "approx 85–135mm FOV, strong compression, shallow depth separation, reduced distortion", video: "https://v3.fal.media/files/rabbit/kQp6twU53PX8EX3a3cHhS_output.mp4", thumbnail: "" },
      { id: "wide-lens", label: "wide lens", description: "approx 24–28mm FOV, expanded perspective, mild barrel distortion, spatial exaggeration", video: "https://v3.fal.media/files/kangaroo/5t4upijfrJP3nrYwNAzaY_output.mp4", thumbnail: "" },
    ],
  },
  {
    id: "focus_control",
    name: "Focus Control",
    description: "Focus behavior and depth of field intent",
    options: [
      { id: "deep-focus", label: "deep focus", description: "broad depth of field from near to far, minimized blur, high spatial readability", video: "https://v3.fal.media/files/zebra/dxelrGmFVrSQWVGLJNDRS_output.mp4", thumbnail: "" },
      { id: "rack-focus-cues", label: "rack focus cues", description: "timed focal plane shifts between set distances, smooth breathing emulation, eased transitions", video: "https://v3.fal.media/files/penguin/epCw3OX_m_MBv5ImrlQyR_output.mp4", thumbnail: "" },
      { id: "shallow-portrait", label: "shallow portrait", description: "narrow depth of field, strong background blur, critical sharp plane maintained, soft bokeh highlight", video: "https://v3.fal.media/files/koala/ADKHv3eHmLu8JOM74Oau6_output.mp4", thumbnail: "" },
      { id: "subject-tracking-af", label: "subject tracking AF", description: "continuous lock on designated focal plane, anticipatory adjustments, stable sharpness maintenance", video: "https://v3.fal.media/files/elephant/bwGKW2sANppANind91q3P_output.mp4", thumbnail: "" },
    ],
  },
  {
    id: "composition",
    name: "Composition",
    description: "Framing rules and staging",
    options: [
      { id: "centered-symmetry", label: "centered symmetry", description: "axial center balance, mirrored elements, minimal tilt, symmetry integrity", video: "https://v3.fal.media/files/tiger/mnTdUtTFDgxHpeGCWzp_4_output.mp4", thumbnail: "" },
      { id: "foreground-framing", label: "foreground framing", description: "edge occluders for depth, parallax layers, frame-within-frame emphasis", video: "https://v3.fal.media/files/zebra/cZFkdIWV3BFcqufg9ZEG5_output.mp4", thumbnail: "" },
      { id: "leading-lines", label: "leading lines", description: "converging line guidance, visible vanishing points, layered depth along line paths", video: "https://v3.fal.media/files/penguin/YlOO41_-rmZZ0HW8PpsOD_output.mp4", thumbnail: "" },
      { id: "negative-space", label: "negative space", description: "expanded unoccupied areas, silhouette clarity, minimal detail clutter", video: "https://v3.fal.media/files/penguin/6iXPYBdmVoZI2c3jTWJni_output.mp4", thumbnail: "" },
      { id: "rule-of-thirds", label: "rule of thirds", description: "primary focus on thirds intersections, balanced negative space, guided gaze hierarchy", video: "https://v3.fal.media/files/tiger/0yYC6OgV98G0LSK2XBvZo_output.mp4", thumbnail: "" },
    ],
  },
  {
    id: "frame_rate_motion",
    name: "Frame Rate & Motion",
    description: "Motion portrayal and shutter characteristics",
    options: [
      { id: "cinematic-shutter", label: "cinematic shutter", description: "approx 180-degree shutter feel, natural blur trails, smooth temporal cadence", video: "https://v3.fal.media/files/panda/bcsK8bcnMYMEkBv3ctiyk_output.mp4", thumbnail: "" },
      { id: "crisp-motion", label: "crisp motion", description: "short effective shutter, minimal blur, staccato temporal response", video: "https://v3.fal.media/files/elephant/vGjJAm0lbn0nhiu5VnON3_output.mp4", thumbnail: "" },
      { id: "dreamy-smear", label: "dreamy smear", description: "long effective shutter, extended trail length, creamy motion transitions", video: "https://v3.fal.media/files/panda/JTRbCeXRVpK_9WH81uO1z_output.mp4", thumbnail: "" },
    ],
  },
  {
    id: "action_blocking",
    name: "Action & Blocking",
    description: "Subject actions and timing (subject-agnostic phrasing only)",
    options: [
      { id: "dynamic-traverse", label: "dynamic traverse", description: "path-following movement across layered spaces, intermittent brief stops, tempo aligned to spatial rh", video: "https://v3.fal.media/files/tiger/S1ANVQWy9Kevg1X2qz7OC_output.mp4", thumbnail: "" },
      { id: "hero-reveal", label: "hero reveal", description: "transition from low-illumination zone to higher exposure, brief silhouette hold, gradual detail roll", video: "https://v3.fal.media/files/penguin/zR8xWVTg0cZVxIByN3hdA_output.mp4", thumbnail: "" },
      { id: "idle-atmospheric", label: "idle atmospheric", description: "minimal pose variance, micro-movements only, extended temporal holds, ambient motion prominence", video: "https://v3.fal.media/files/panda/wqInYRLxUil0pFtcA5UN8_output.mp4", thumbnail: "" },
      { id: "landscape-reveal", label: "landscape reveal", description: "initial occlusion with progressive clearance, widening view, deliberate pacing to register scale", video: "https://v3.fal.media/files/koala/UOwRQtSGRVwHQocA_MdsV_output.mp4", thumbnail: "" },
      { id: "micro-task-montage", label: "micro-task montage", description: "sequence of short-duration inserts, match-on-action continuity, rhythmic temporal spacing", video: "https://v3.fal.media/files/rabbit/HejnAQqZluQUJDrzX-g1W_output.mp4", thumbnail: "" },
      { id: "object-inspection", label: "object inspection", description: "slow orbital path around focal item, incremental perspective shifts, timed pauses for feature clarit", video: "https://v3.fal.media/files/panda/Hyk_6q-w5_ypDcI3FoWIW_output.mp4", thumbnail: "" },
      { id: "rapid-advance-and-check", label: "rapid advance and check", description: "accelerated forward motion followed by brief backward orientation shift, momentum-preserving traject", video: "https://v3.fal.media/files/zebra/E9VrBzw71mrDucI6oZ2OX_output.mp4", thumbnail: "" },
      { id: "walk-cycle", label: "walk cycle", description: "periodic locomotion loop, consistent stride timing, subtle secondary oscillations, steady forward pr", video: "https://v3.fal.media/files/penguin/UGQ4Gp0myxjZKUqjmquoO_output.mp4", thumbnail: "" },
    ],
  },
  {
    id: "motion_logic",
    name: "Motion Logic",
    description: "High-level rules for how motion should behave and escalate",
    options: [
      { id: "constant-glide", label: "constant glide", description: "uniform velocity profile, no abrupt changes, bezier-smooth transitions, persistent directionality", video: "https://v3.fal.media/files/panda/bCZH6-WzHXykqt1uvXb01_output.mp4", thumbnail: "" },
      { id: "contrast-beats", label: "contrast beats", description: "alternation between still holds and swift moves, high speed delta at markers, crisp temporal punctua", video: "https://v3.fal.media/files/panda/u5zqYszvO5ZuqOXiZahc6_output.mp4", thumbnail: "" },
      { id: "parallax-emphasis", label: "parallax emphasis", description: "paths maximizing depth differential, layered occlusion choreography, contrasting foreground/backgrou", video: "https://v3.fal.media/files/monkey/0o18zhUnpbuE7FmQOALeA_output.mp4", thumbnail: "" },
      { id: "pulse-accents", label: "pulse accents", description: "steady baseline with periodic speed spikes, rapid return to base tempo, beat-synced dynamics", video: "https://v3.fal.media/files/panda/TMfFIW1xOYyPNofW64Hta_output.mp4", thumbnail: "" },
      { id: "slow-build", label: "slow build", description: "initial low velocity, gradual amplitude increase, extended early holds, late acceleration", video: "https://v3.fal.media/files/elephant/TejGCA8NW6dz0pwunSqEA_output.mp4", thumbnail: "" },
    ],
  },
  {
    id: "sound_direction",
    name: "Sound Direction",
    description: "Optional guidance for post sound/music (non-visual; metadata only)",
    options: [
      { id: "ambient-soundscape", label: "ambient soundscape", description: "broadband environmental bed, low dynamic range, spatial continuity without rhythmic emphasis", video: "https://v3.fal.media/files/penguin/JBmGczOEOCs-cs4SAmHna_output.mp4", thumbnail: "" },
      { id: "intense-score", label: "intense score", description: "high dynamic range cues, percussive transients at visual beats, rising tension arcs", video: "https://v3.fal.media/files/rabbit/JBwvMRr2az-2dDcGBieJJ_output.mp4", thumbnail: "" },
      { id: "nostalgic-lo-fi", label: "nostalgic lo-fi", description: "band-limited tonal layer, gentle tape hiss, soft transients with warm timbre", video: "https://v3.fal.media/files/elephant/KLK7JRIUVKPCtAUl_aTdm_output.mp4", thumbnail: "" },
    ],
  },
  {
    id: "style_family",
    name: "Style Family",
    description: "Macro visual identity families",
    options: [
      { id: "3d-stylized", label: "3D stylized", description: "non-photoreal proportions, simplified textures, soft SSS where applicable, painterly shading hints", video: "https://v3.fal.media/files/rabbit/Njv68Vkbam29CMsMWd4L4_output.mp4", thumbnail: "" },
      { id: "anime", label: "anime", description: "cel-shaded tonal steps, clean contour lines, limited gradients, stylized smear frames for motion", video: "https://v3.fal.media/files/lion/hhnCoyeYXQh7633QEDbJY_output.mp4", thumbnail: "" },
      { id: "graphic-novel", label: "graphic novel", description: "ink-heavy chiaroscuro, halftone or crosshatch shading, high black-white contrast, minimal gradients", video: "https://v3.fal.media/files/monkey/OSYWim5JbGFuWOvU6fsQc_output.mp4", thumbnail: "" },
      { id: "hand-drawn-look", label: "hand-drawn look", description: "sketched outlines, watercolor or pencil fills, subtle frame-to-frame boil, reduced palette", video: "https://v3.fal.media/files/panda/k06-6QEPX3ly1KXh7Xprv_output.mp4", thumbnail: "" },
      { id: "live-action", label: "live-action", description: "photoreal shading and GI cues, camera artifact realism, physical material responses, grounded motion", video: "https://v3.fal.media/files/monkey/hLPNHuusD9OFguekvsDfv_output.mp4", thumbnail: "" },
      { id: "motion-design-minimal", label: "motion design minimal", description: "flat vector forms, geometric layouts, smooth easing, restrained color blocking, typography-safe spac", video: "https://v3.fal.media/files/panda/tAX9ZWK6r5tFCW4ukTP49_output.mp4", thumbnail: "" },
      { id: "pixel-art", label: "pixel art", description: "low-resolution grid aesthetic, limited palette ramps, dither shading, discrete step motion", video: "https://v3.fal.media/files/elephant/F1Lu1IxA6PMIVX25pjjAD_output.mp4", thumbnail: "" },
      { id: "stop-motion-feel", label: "stop-motion feel", description: "stepped temporal cadence, tactile surface imperfections, subtle frame jitter, handcrafted impression", video: "https://v3.fal.media/files/koala/dwugZH0oHj3g_92MnMe7f_output.mp4", thumbnail: "" },
    ],
  },
  {
    id: "transitions_editing",
    name: "Transitions & Editing",
    description: "Intra-shot and inter-shot transition intent",
    options: [
      { id: "fade-through-black", label: "fade through black", description: "luminance dip to near-black, eased fade curves, clear separation of beats", video: "https://v3.fal.media/files/lion/jHXSv3XP_85s3NKbc7juv_output.mp4", thumbnail: "" },
      { id: "match-cut-intent", label: "match cut intent", description: "exit geometry aligned with entry geometry, motion direction preserved, minimal visual discontinuity", video: "https://v3.fal.media/files/panda/Sr2mJeO3mHEti3a8c63LK_output.mp4", thumbnail: "" },
      { id: "motivated-reveal", label: "motivated reveal", description: "foreground occluder wipes frame, next composition appears along same direction, spatial flow continu", video: "https://v3.fal.media/files/zebra/jNz47liK66jGOCXk9dR-U_output.mp4", thumbnail: "" },
      { id: "whip-pan-feel", label: "whip pan feel", description: "high-speed lateral blur at beat point, directional continuity, brief motion masking window", video: "https://v3.fal.media/files/panda/g2o9w53Jh96rc3q43-bpg_output.mp4", thumbnail: "" },
    ],
  },
  {
    id: "vfx",
    name: "VFX",
    description: "In-frame visual effects and particles",
    options: [
      { id: "dust-motes", label: "dust motes", description: "small floating particulates, depth layering, slow random drift, visibility in strong light cones", video: "https://v3.fal.media/files/penguin/93oncEBzfvlRoemKRqZmO_output.mp4", thumbnail: "" },
      { id: "lens-bloomhalation", label: "lens bloom/halation", description: "soft highlight expansion, glow fringe around brights, controlled intensity to avoid clipping", video: "https://v3.fal.media/files/kangaroo/2w_Qz8IyXeBdR8cxA0W5D_output.mp4", thumbnail: "" },
      { id: "light-haze", label: "light haze", description: "thin uniform volumetric layer, enhanced beam visibility, mild contrast reduction, depth softening", video: "https://v3.fal.media/files/kangaroo/kK1-S2qjALowyaGG8hEPH_output.mp4", thumbnail: "" },
      { id: "rain-splashes", label: "rain splashes", description: "ground impact ripples, surface micro-splashes, window streak artifacts, specular glints", video: "https://v3.fal.media/files/kangaroo/kTM7vh9oIuDYv-Uq30NrG_output.mp4", thumbnail: "" },
      { id: "sparksdebris", label: "sparks/debris", description: "short-lived bright particles with decay, ballistic trajectories, gravity and drag aware", video: "https://v3.fal.media/files/lion/-6KT_guXIJRi2Ozmwq1Jn_output.mp4", thumbnail: "" },
    ],
  },
  {
    id: "historical_period",
    name: "Historical Period",
    description: "Era-specific visual, architecture and material cues (subject-agnostic)",
    options: [
      { id: "1920s", label: "1920s", description: "art deco geometry, polished metals, early automotive markers, geometric ornamentation, smoky ambianc", video: "https://v3.fal.media/files/penguin/xc5xcCgx6QS6UOgrV4m4K_output.mp4", thumbnail: "" },
      { id: "1960s", label: "1960s", description: "mid-century modern forms, bold patterns, analog signage, period electronics housings, saturated acce", video: "https://v3.fal.media/files/panda/TQ_LGYv9hf4IzKdfK82Tl_output.mp4", thumbnail: "" },
      { id: "1980s", label: "1980s", description: "neon-forward signage, chunky plastics, graphic motifs, saturated palette choices, retro tech silhoue", video: "https://v3.fal.media/files/rabbit/cax-6g54kmv42488jouII_output.mp4", thumbnail: "" },
      { id: "ancient", label: "ancient", description: "stone and metal artifacts, hand-crafted surface irregularities, limited glazing, weathered patinas, ", video: "https://v3.fal.media/files/elephant/bJolJtbs6fSxAe8pzrlIO_output.mp4", thumbnail: "" },
      { id: "far-future", label: "far-future", description: "advanced non-terrestrial materials, abstract structural logic, autonomous system cues, unconventiona", video: "https://v3.fal.media/files/rabbit/IlBipBSugVDAPPt6kJ9fa_output.mp4", thumbnail: "" },
      { id: "medieval", label: "medieval", description: "timber-and-stone construction, low-intensity practical illumination, coarse natural materials, pre-m", video: "https://v3.fal.media/files/koala/0CYHAyRRhT1dT3WOPS5Yk_output.mp4", thumbnail: "" },
      { id: "near-future", label: "near-future", description: "minimal luminous interfaces, clean energy indicators, lightweight composites, efficient spatial layo", video: "https://v3.fal.media/files/lion/DK5Wbwpj4hDUtMKvqVTCS_output.mp4", thumbnail: "" },
      { id: "renaissance", label: "renaissance", description: "classical architectural motifs, rich surface finishes, decorative craftsmanship, early scientific in", video: "https://v3.fal.media/files/koala/F1O_1Q2HNAxFy3IR4VfBg_output.mp4", thumbnail: "" },
      { id: "victorian", label: "victorian", description: "ornate ironwork, gaslight-era fixtures, dark wood interiors, early mechanized elements, layered deco", video: "https://v3.fal.media/files/rabbit/Zv0xyq6AjfWVMeCrHAvfr_output.mp4", thumbnail: "" },
    ],
  },
  {
    id: "culture_context",
    name: "Culture & Context",
    description: "Region/culture-inspired motifs, materials, patterns, palette and objects (purely cultural; scene-agnostic)",
    options: [
      { id: "african-inspired", label: "african-inspired", description: "earth-tone base with saturated accent blocks, bold contemporary textile patterns, carved wood textur", video: "https://v3.fal.media/files/rabbit/GEOPyku_aUT6N6bli3xSC_output.mp4", thumbnail: "" },
      { id: "american-inspired", label: "american-inspired", description: "mixed-material palette with brick and glass, bold sans-serif typographic cues, diner-sign aesthetics", video: "https://v3.fal.media/files/koala/4b2AT3D2OEkilN3cKUkjr_output.mp4", thumbnail: "" },
      { id: "eastern-european-inspired", label: "eastern-european-inspired", description: "pastel facade hues, folk pattern motifs, practical material finishes, Cyrillic/Latin signage cues, m", video: "https://v3.fal.media/files/panda/O9bJdn7Qy1Ea_rhtpmN89_output.mp4", thumbnail: "" },
      { id: "indian-inspired", label: "indian-inspired", description: "jewel-tone accents, jaali-like perforation patterns, ornate carvings, polished brass/copper cues, ma", video: "https://v3.fal.media/files/koala/8zpoeYeuLiSXxFbfHqb6M_output.mp4", thumbnail: "" },
      { id: "japanese-inspired", label: "japanese-inspired", description: "minimalist material palette, shoji-like translucency, tatami-inspired textures, restrained neutrals ", video: "https://v3.fal.media/files/monkey/Lx8s6r6I4Oi8eWrVjMjtL_output.mp4", thumbnail: "" },
      { id: "latin-american-inspired", label: "latin-american-inspired", description: "vivid chroma accents, mural-style graphics, patterned tiles, tropical greenery motifs, handcrafted t", video: "https://v3.fal.media/files/koala/tNbMtpXhLZszj_U_M4Wzn_output.mp4", thumbnail: "" },
      { id: "mediterranean-inspired", label: "mediterranean-inspired", description: "stucco and limestone textures, terracotta and ceramic accents, airy pastel palette, natural wood and", video: "https://v3.fal.media/files/kangaroo/5gYjEKrIZtZEND1PdPPnL_output.mp4", thumbnail: "" },
      { id: "middle-eastern-inspired", label: "middle-eastern-inspired", description: "geometric surface patterns, mashrabiya-like lattice motifs, warm neutral stones, teal and ochre tile", video: "https://v3.fal.media/files/elephant/FjiK5uKFe2Pf1lU7iEDhT_output.mp4", thumbnail: "" },
      { id: "scandinavian-inspired", label: "scandinavian-inspired", description: "light-toned woods, clean-lined forms, muted cool palette, soft textiles, functional minimal ornament", video: "https://v3.fal.media/files/zebra/5Vfb9QM1t1vXbb4-X_Zl2_output.mp4", thumbnail: "" },
      { id: "turkish-inspired", label: "turkish-inspired", description: "kilim and geometric textile patterns, blue-and-white ceramic tile cues, copper and glassware motifs,", video: "https://v3.fal.media/files/zebra/IOJo4HCxm6MqhqzSRm7bO_output.mp4", thumbnail: "" },
    ],
  },
];
