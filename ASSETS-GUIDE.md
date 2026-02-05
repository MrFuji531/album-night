# 📁 ASSET SETUP GUIDE - Album Night

## Overview

All assets go in the `public/` folder. Here's the COMPLETE structure:

```
public/
├── avatars/           ← Player profile pictures
│   ├── James.png
│   ├── Lee.png
│   ├── Ben.png
│   └── Steph.png
│
├── audio/
│   ├── scores/        ← J. Cole reaction for each score (1-10)
│   │   ├── score_1.mp3
│   │   ├── score_2.mp3
│   │   ├── score_3.mp3
│   │   ├── score_4.mp3
│   │   ├── score_5.mp3
│   │   ├── score_6.mp3
│   │   ├── score_7.mp3
│   │   ├── score_8.mp3
│   │   ├── score_9.mp3
│   │   └── score_10.mp3
│   │
│   ├── awards/        ← J. Cole reaction for each award
│   │   ├── stan.mp3
│   │   ├── hater.mp3
│   │   ├── highest_rated.mp3
│   │   ├── lowest_rated.mp3
│   │   └── most_divisive.mp3
│   │
│   └── ui/            ← Sound effects
│       ├── drumroll.mp3
│       ├── fanfare.mp3
│       ├── confetti.mp3
│       ├── bar_rise.mp3
│       ├── bar_stop.mp3
│       ├── submit.mp3
│       ├── lock.mp3
│       └── reveal_start.mp3
│
└── album-cover.jpg    ← (Optional) Album artwork
```

---

## 🖼️ AVATARS

### Location: `public/avatars/`

### File Names (MUST match exactly):
- `James.png`
- `Lee.png`
- `Ben.png`
- `Steph.png`

### Specifications:
- **Format**: PNG (recommended) or JPG
- **Size**: 200x200px minimum, square aspect ratio
- **Style**: Face photos, cartoon avatars, or any image you want

### What happens if missing?
✅ **App will NOT break!** 
- If an avatar is missing, the app shows a colored circle with the person's initial
- Each person has a unique color (Gold, Green, Brown, etc.)

### How to add:
1. Get photos of James, Lee, Ben, Steph
2. Crop to square (1:1 ratio)
3. Save as PNG
4. Name files exactly: `James.png`, `Lee.png`, `Ben.png`, `Steph.png`
5. Put them in `public/avatars/`

---

## 🎵 AUDIO - Score Reactions (1-10)

### Location: `public/audio/scores/`

### File Names:
- `score_1.mp3` - For score of 1 (very disappointed Cole)
- `score_2.mp3` - For score of 2 
- `score_3.mp3` - For score of 3
- `score_4.mp3` - For score of 4 (skeptical Cole)
- `score_5.mp3` - For score of 5 (neutral Cole)
- `score_6.mp3` - For score of 6
- `score_7.mp3` - For score of 7 (nodding Cole)
- `score_8.mp3` - For score of 8 (impressed Cole)
- `score_9.mp3` - For score of 9
- `score_10.mp3` - For score of 10 (hyped Cole!)

### Specifications:
- **Format**: MP3
- **Bitrate**: 128-192 kbps
- **Length**: 2-5 seconds ideal
- **Volume**: Normalize all to similar levels

### What happens if missing?
✅ **App will NOT break!**
- Console will show: "Failed to load audio: score_X"
- The reveal animation still works, just silently

### Example content:
| Score | Suggested Reaction |
|-------|-------------------|
| 1-2 | Cole looking confused, "what?", disappointed sigh |
| 3-4 | Skeptical "mmm", "I don't know about that" |
| 5-6 | Neutral nod, "it's aight", "okay" |
| 7-8 | "That's hard", impressed look, nodding |
| 9-10 | "Yo!", excited, "let's go!", big smile |

---

## 🏆 AUDIO - Award Reactions

### Location: `public/audio/awards/`

### File Names:
- `stan.mp3` - For "THE STAN" award (highest average rater)
- `hater.mp3` - For "THE HATER" award (lowest average rater)
- `highest_rated.mp3` - For best song reveal
- `lowest_rated.mp3` - For worst song reveal
- `most_divisive.mp3` - For most divisive song

### Specifications:
- **Format**: MP3
- **Length**: 3-6 seconds
- **Style**: More dramatic/celebratory than score reactions

### What happens if missing?
✅ **App will NOT break!**
- Awards still reveal with animations, just no sound

### Example content:
| Award | Suggested Reaction |
|-------|-------------------|
| stan | Celebration! "My guy!", applause, cheering Cole |
| hater | Playful "damn bro", "cold", joking disappointment |
| highest_rated | "That's the one!", fire emoji energy |
| lowest_rated | "Ehh...", "that one wasn't it" |
| most_divisive | "Interesting...", controversial reaction |

---

## 🔊 AUDIO - UI Sound Effects

### Location: `public/audio/ui/`

### File Names:
- `drumroll.mp3` - Before awards are revealed (5-10 seconds)
- `fanfare.mp3` - Celebration after big reveals (3-5 seconds)
- `confetti.mp3` - Party popper sound (1-2 seconds)
- `bar_rise.mp3` - While score bars are rising (2-3 seconds, can loop)
- `bar_stop.mp3` - Pop when a bar reaches its score (0.5-1 second)
- `submit.mp3` - When player submits score (0.5-1 second)
- `lock.mp3` - When admin locks in scores (1 second)
- `reveal_start.mp3` - Suspense sound before reveal (2-3 seconds)

### Where to get these FREE:
1. **Pixabay Sound Effects** (https://pixabay.com/sound-effects/)
   - Search: "drumroll", "fanfare", "pop", "whoosh"
   - 100% free, no attribution needed

2. **Uppbeat** (https://uppbeat.io/sfx)
   - Search: "celebration", "confetti", "reveal"
   - Free with attribution

3. **Mixkit** (https://mixkit.co/free-sound-effects/)
   - Good quality, free

### What happens if missing?
✅ **App will NOT break!**
- Animations play without sound
- Console shows warnings but app continues

---

## 🎨 ALBUM COVER (Optional)

### Location: `public/album-cover.jpg`

### Specifications:
- **Format**: JPG or PNG
- **Size**: 500x500px or larger, square

### How it's used:
- Currently not displayed by default
- You can add it to Home page or TV page if you want

### To add album cover to the home page:
Edit `src/pages/Home.tsx` and add an img tag where you want it.

---

## ✅ QUICK CHECKLIST

```
public/
├── avatars/
│   ├── James.png     ⬜ (optional - shows initial if missing)
│   ├── Lee.png       ⬜
│   ├── Ben.png       ⬜
│   └── Steph.png     ⬜
│
├── audio/scores/
│   ├── score_1.mp3   ⬜ (optional - plays nothing if missing)
│   ├── score_2.mp3   ⬜
│   ├── score_3.mp3   ⬜
│   ├── score_4.mp3   ⬜
│   ├── score_5.mp3   ⬜
│   ├── score_6.mp3   ⬜
│   ├── score_7.mp3   ⬜
│   ├── score_8.mp3   ⬜
│   ├── score_9.mp3   ⬜
│   └── score_10.mp3  ⬜
│
├── audio/awards/
│   ├── stan.mp3      ⬜
│   ├── hater.mp3     ⬜
│   ├── highest_rated.mp3  ⬜
│   ├── lowest_rated.mp3   ⬜
│   └── most_divisive.mp3  ⬜
│
└── audio/ui/
    ├── drumroll.mp3  ⬜
    ├── fanfare.mp3   ⬜
    ├── confetti.mp3  ⬜
    ├── bar_rise.mp3  ⬜
    ├── bar_stop.mp3  ⬜
    ├── submit.mp3    ⬜
    ├── lock.mp3      ⬜
    └── reveal_start.mp3 ⬜
```

---

## ⚠️ IMPORTANT NOTES

1. **Nothing will break if files are missing!**
   - The app gracefully handles missing assets
   - You'll just see colored initials instead of photos
   - Animations work without sounds

2. **File names are CASE SENSITIVE**
   - `James.png` ✅
   - `james.png` ❌
   - `JAMES.PNG` ❌

3. **Test locally first**
   - Run `npm run dev`
   - Check browser console for any loading errors
   - Errors like "Failed to load audio" are fine if you don't have the files yet

4. **After adding files, rebuild**
   ```bash
   npm run build
   ```

---

## 🚀 MINIMAL SETUP (No Audio)

If you just want to test without audio, you don't need ANY audio files!
The app works completely fine without them.

Just add the avatars if you want profile pictures, or skip those too!
