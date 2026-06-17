AUDIO ASSETS — drop files here by EXACT name.

Supported formats: .mp3, .ogg, .wav (prefer .ogg for looping, .mp3 for one-shots).
The engine synthesizes all audio procedurally by default (Web Audio API); files
here OVERRIDE or supplement the synthesized output when present.

Subfolders:
  music/        Ambient period music loops. Names: camp_ambient.ogg, battle_march.ogg, victory_fanfare.ogg
  sfx/          One-shot effects. Names: cannon_fire.mp3, musket_volley.mp3, bugle_charge.mp3,
                bugle_retreat.mp3, cheer.mp3, rout_cry.mp3
  ambient/      Environmental loops. Names: wind.ogg, rain.ogg, campfire.ogg, crowd_murmur.ogg

The asset loader (src/93-asset-loader.js) probes for each file at runtime.
If the file is missing (404 or file:// access error), the engine uses
its existing procedural synthesis — no error, no regression.

After dropping files, rebuild (node tools/build.mjs) and refresh the browser.
