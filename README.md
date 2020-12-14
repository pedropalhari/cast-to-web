# Cast to Chromecast with subtitles

Linux has a bug that Chrome cannot cast the screen to Chromecast with sound (making casting VLC with subs not viable), so you need to cast a tab instead. This project creates an `express` server that streams video by chunks. It also converts `.srt` to `.vtt` to be included in the video as subs.

# Using

## With `npx`

- `npx pedropalhari/chromecast-with-subtitles [filmpath].mp4 [subpath].srt`

## Without `npx`

- Clone this repo
- `yarn`
- `yarn build`
- `yarn start [filmpath].mp4 [subpath].srt`
- Open `http://localhost:8080` using chrome and cast this tab to chromecast.

Both filmpath and subpath must be absolute, they also should be `.mp4` and `.srt` in order.
