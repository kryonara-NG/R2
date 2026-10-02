Reelhouse - open index.html via a local server (VS Code Live Server, or: python3 -m http.server).
Flow: index (sign in) -> setup (TMDB key) -> home / search / library / me.
Pages without the bottom nav (back-icon header): player, person, genre, notifs, settings.
Own videos: localStorage.setItem('rh_videos', JSON.stringify({"MOVIE_TMDB_ID":"https://your.cdn/movie.mp4"}))
Re-run the survey: Settings > Retake taste survey. It also appears 10 seconds after first opening the app.
v3: profile (followers / following / artists, edit, level, badges), Library list rows with % watched + three-dots menu + Downloads tab,
share to friends (people you follow), haptics (Settings > Vibrations), blue-glass cinematic coming-soon trailer 10s after opening (once per session).
Everything is stored on-device (localStorage). Sharing reaches other accounts signed up on the same device; cross-device delivery needs a backend.
v4: iOS-style liquid-glass orange/black coming-soon trailer; Followers/Following/Artists/Find and Share are full pages (people.html, share.html);
tenure tags on avatars (New, 1 month, 2 months, 6 months, 1 year) + more badges + unlock confetti (preview any tier: me.html?age=400);
hover (desktop) or press-and-hold (phone) a poster for a 10s preview, muted by default (Settings > Preview sound);
TV series support (search Series tab, Trending/Top 10 series rows) with series.html: seasons, episode tiles, resume/up-next, binge time left, spoiler shield, watched ticks.
Own episode videos: rh_videos key "TVID:SEASON:EPISODE".
v5: native player (RH.Player: YouTube chrome hidden, own controls, +-10s, double-tap skip, speed, fullscreen), soon.html for unreleased movies, 'Start watching' button on player.html (links your own video; Resume shown after).
v6: freewatch.html - Internet Archive public-domain films in the native player (FREE button on home).
v7: filters(search), people/share pages, stats, 20 settings/features.
v8: cleaner search UI, story-style guided tour (RH.tour), replay in Settings.