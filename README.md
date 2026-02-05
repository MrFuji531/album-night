# 🎵 Album Night

A real-time collaborative music rating app for listening parties. One TV displays the session, four phones submit scores—watch the ratings reveal with dramatic animations!

Built for a J. Cole album listening party with James, Lee, Ben, and Steph.

## ✨ Features

- **Real-time sync** - All screens update instantly via Supabase
- **TV Display** - Big screen shows QR codes, current song, and animated score reveals
- **Phone Scoring** - Each participant rates songs 1-10 on their phone
- **Animated Reveals** - Score bars rise dramatically, confetti bursts when scores land
- **Final Awards** - Stan (highest avg), Hater (lowest avg), Best Song, Most Divisive
- **Downloadable Results** - Share a styled image summary

## 🚀 Quick Start

### 1. Clone & Install

```bash
git clone https://github.com/YOUR_USERNAME/album-night.git
cd album-night
npm install
```

### 2. Set up Supabase

Create a [Supabase](https://supabase.com) project and run this SQL:

```sql
-- Sessions table
CREATE TABLE sessions (
  code TEXT PRIMARY KEY,
  title TEXT NOT NULL DEFAULT 'Album Night',
  status TEXT NOT NULL DEFAULT 'lobby',
  song_index INTEGER NOT NULL DEFAULT 0,
  locked BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Participants table
CREATE TABLE participants (
  session_code TEXT REFERENCES sessions(code) ON DELETE CASCADE,
  participant_id TEXT NOT NULL,
  name TEXT NOT NULL,
  avatar_url TEXT,
  claimed BOOLEAN NOT NULL DEFAULT false,
  claimed_at TIMESTAMPTZ,
  PRIMARY KEY (session_code, participant_id)
);

-- Songs table
CREATE TABLE songs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_code TEXT REFERENCES sessions(code) ON DELETE CASCADE,
  order_index INTEGER NOT NULL,
  title TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Scores table
CREATE TABLE scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_code TEXT REFERENCES sessions(code) ON DELETE CASCADE,
  song_index INTEGER NOT NULL,
  participant_id TEXT NOT NULL,
  score INTEGER NOT NULL CHECK (score >= 1 AND score <= 10),
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(session_code, song_index, participant_id)
);

-- Enable Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE sessions;
ALTER PUBLICATION supabase_realtime ADD TABLE participants;
ALTER PUBLICATION supabase_realtime ADD TABLE songs;
ALTER PUBLICATION supabase_realtime ADD TABLE scores;

-- Enable RLS (optional but recommended)
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE songs ENABLE ROW LEVEL SECURITY;
ALTER TABLE scores ENABLE ROW LEVEL SECURITY;

-- Allow all for this app (adjust for production)
CREATE POLICY "Allow all" ON sessions FOR ALL USING (true);
CREATE POLICY "Allow all" ON participants FOR ALL USING (true);
CREATE POLICY "Allow all" ON songs FOR ALL USING (true);
CREATE POLICY "Allow all" ON scores FOR ALL USING (true);
```

### 3. Configure Environment

Create `.env` file:

```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### 4. Run Locally

```bash
npm run dev
```

## 📱 How to Use

### Setup (Before the Party)

1. Open the app and click "Create New Session"
2. Copy the session code (e.g., `ABC123`)
3. In Admin panel, set the album title
4. Paste the tracklist (one song per line)

### During the Party

1. **TV**: Open `/tv/CODE` on your big screen
2. **Guests**: Scan QR code or go to `/join/CODE`
3. Each guest picks their name
4. Admin starts the album when ready

### For Each Song

1. Song title appears on TV
2. Everyone rates on their phones (1-10)
3. Admin locks scores when 4/4 submitted
4. Watch the animated reveal!
5. Admin clicks "Next Song"

### At the End

1. Admin clicks "Show Awards"
2. Awards reveal one by one with reactions
3. Everyone can download their results image

## 🎵 Audio Setup

Place your J. Cole reaction clips in these folders:

```
public/audio/
├── scores/
│   ├── score_1.mp3    # Reaction for score 1 (disappointed)
│   ├── score_2.mp3
│   ├── score_3.mp3
│   ├── score_4.mp3
│   ├── score_5.mp3    # Neutral reactions
│   ├── score_6.mp3
│   ├── score_7.mp3
│   ├── score_8.mp3
│   ├── score_9.mp3
│   └── score_10.mp3   # Excited/hyped reactions
├── awards/
│   ├── stan.mp3       # For "The Stan" award
│   ├── hater.mp3      # For "The Hater" award
│   ├── highest_rated.mp3
│   ├── lowest_rated.mp3
│   └── most_divisive.mp3
└── ui/
    ├── submit.mp3     # When score submitted
    ├── lock.mp3       # When scores locked
    ├── reveal_start.mp3
    ├── bar_rise.mp3   # Bars rising sound
    ├── bar_stop.mp3   # Pop when bar stops
    ├── confetti.mp3
    ├── drumroll.mp3
    └── fanfare.mp3
```

**Audio format requirements:**
- Format: MP3 (most compatible)
- Bitrate: 128-192 kbps is fine
- Length: 2-5 seconds for reactions, can be longer for drumroll/fanfare
- Volume: Normalize to similar levels

**Tips for sourcing Cole clips:**
- Interview clips where he reacts to things
- Podcast moments
- Keep them short and punchy
- Low scores: skeptical/disappointed sounds
- High scores: excited/impressed sounds

## 🚀 Deployment

### GitHub Pages (Recommended)

1. Push to GitHub
2. Go to Settings → Pages
3. Enable GitHub Actions deployment
4. Add secrets:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
5. Push to main branch to trigger deploy

### Manual Deploy

```bash
npm run build
# Upload contents of `dist/` to any static host
```

## 📁 Project Structure

```
src/
├── components/
│   ├── Avatar.tsx        # Participant avatars with fallbacks
│   ├── AverageFlip.tsx   # Animated number flip for averages
│   ├── AwardReveal.tsx   # Award ceremony animations
│   ├── ResultsSummary.tsx # Downloadable summary card
│   └── ScoreReveal.tsx   # Bar chart reveal animation
├── hooks/
│   ├── useAudio.ts       # Sound effects manager
│   ├── useConfetti.ts    # Confetti animations
│   └── useSessionData.ts # Supabase real-time data
├── pages/
│   ├── Home.tsx          # Create session
│   ├── Join.tsx          # Pick your name
│   ├── Play.tsx          # Submit scores
│   ├── Admin.tsx         # Control panel
│   ├── Tv.tsx            # Big screen display
│   └── Results.tsx       # Final summary
├── types.ts              # TypeScript types
├── utils.ts              # Helper functions
└── styles.css            # J. Cole-inspired theme
```

## 🎨 Customization

### Colors (in `styles.css`)

```css
:root {
  --gold: #D4AF37;        /* Primary accent */
  --forest: #2E8B57;      /* Secondary */
  --earth: #CD853F;       /* Tertiary */
  --bg-deep: #0a0f0a;     /* Background */
}
```

### Add Album Artwork

1. Place artwork as `public/album-cover.jpg`
2. Update the Home/TV pages to display it

### Change Participants

Edit `src/pages/Home.tsx` and `src/utils.ts` to change names/colors.

## 🐛 Troubleshooting

**Scores not syncing?**
- Check Supabase realtime is enabled
- Verify RLS policies allow access
- Check browser console for errors

**Audio not playing?**
- Check files exist in correct paths
- Verify MP3 format
- Some browsers require user interaction before audio

**QR code not working?**
- Ensure devices on same network
- Try the manual URL instead

## License

MIT - Do whatever you want with it! 🎉
