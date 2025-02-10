const express = require("express");
const fs = require("fs"); // For checking if the file already exists
const path = require("path"); // For path manipulation
const ytdl = require("youtube-dl-exec");

const app = express();
const PORT = process.env.PORT || 3000;
const downloadsDirectory = path.join(__dirname, "downloads"); // Use path.join here too

// Create the downloads directory if it doesn't exist
fs.mkdirSync(downloadsDirectory, { recursive: true });

app.set("view engine", "ejs");

app.use(express.static("public"));
// Needed to parse data for HTML POST request
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.get("/", (req, res) => {
  res.render("index");
});

app.post("/convert-mp3", async (req, res) => {
  const { videoUrl } = req.body;
  if (!videoUrl || videoUrl === "") {
    return res.render("index", {
      success: false,
      message: "Please enter a video URL.",
    });
  } else {
    try {
      const videoInfo = await ytdl(videoUrl, {
        dumpSingleJson: true,
        noWarnings: true,
        noCheckCertificate: true,
        preferFreeFormats: true,
      });

      const title = videoInfo.title.replace(/[^a-zA-Z0-9]/g, "_");
      const outputPath = path.join(downloadsDirectory, `${title}.mp3`);

      // Check if file already has been downloaded
      if (fs.existsSync(outputPath)) {
        return res.render("index", {
          success: true,
          message: `File already exists: ${title}.mp3`, // Indicate success even if file exists
          songTitle: title,
          songLink: `/downloads/${title}.mp3`,
        });
      }

      await ytdl(videoUrl, {
        format: "bestaudio/best",
        extractAudio: true,
        audioFormat: "mp3",
        o: outputPath,
      });

      console.log(`Download complete: ${outputPath}`);
      res.render("index", {
        success: true,
        message: `Download complete: ${title}`,
        songTitle: title,
        songLink: `/downloads/${title}.mp3`,
      });
    } catch (error) {
      console.error("Download failed:", error);
      res.render("index", {
        success: false,
        message: `Download failed: ${error.message}`,
      });
    }
  }
});

// Serve the downloaded files (important!)
// Make the files whom are saved in the downloads directory, accesible through /downloads.
app.use("/downloads", express.static(downloadsDirectory));

app.listen(PORT, () => {
  console.log(`Server started on port ${PORT}`);
});
