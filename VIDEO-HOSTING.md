# Where quiz videos live

The Little Wonders Everyday Series web app (`lw-everyday-lvofgqp`) keeps player pages, poster thumbnails and image credits in `video-quizzes/`.

The mp4 files themselves are hosted on a separate GitHub Pages repo so this site stays under the Pages 1 GB artifact limit:

- Repo: https://github.com/littlewondersesl-max/lw-video-quizzes
- Video base URL: https://littlewondersesl-max.github.io/lw-video-quizzes/

For a new quiz video:

1. Encode it as H.264 (1080p is fine) with `ffmpeg -movflags +faststart`. Keep each file under 100 MB. Do **not** use Git LFS — GitHub Pages will not serve LFS files.
2. Add it to `lw-video-quizzes` as `<slug>/video.mp4` and push `main`.
3. Add the player page, thumbnail and credits in this repo under `video-quizzes/<slug>/`, with `<video src="https://littlewondersesl-max.github.io/lw-video-quizzes/<slug>/video.mp4" poster="thumb.jpg">`.
4. Register the card in `js/data.js` (section `quizzes`) and any new English strings in `js/i18n/home.js`.
