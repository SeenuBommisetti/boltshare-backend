import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { v4 as uuidv4 } from "uuid";

const app = express();
const PORT = process.env.PORT || 3000;

// ensure uploads folder exists
if (!fs.existsSync("uploads")) {
  fs.mkdirSync("uploads");
}

// storage config
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) => {
    const uniqueName = uuidv4() + path.extname(file.originalname);
    cb(null, uniqueName);
  },
});

// limit file size (100MB)
const upload = multer({
  storage,
  limits: { fileSize: 100 * 1024 * 1024 },
});

// upload endpoint
app.post("/upload", upload.single("file"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded" });
  }

  const fileUrl = `${req.protocol}://${req.get("host")}/files/${req.file.filename}`;

  // auto delete after 10 mins
  setTimeout(() => {
    fs.unlink(req.file.path, () => {});
  }, 10 * 60 * 1000);

  res.json({
    url: fileUrl,
    fileName: req.file.originalname,
    size: req.file.size,
  });
});

// download endpoint
app.get("/files/:name", (req, res) => {
  const filePath = path.join("uploads", req.params.name);

  if (!fs.existsSync(filePath)) {
    return res.status(404).send("File not found");
  }

  res.download(filePath);
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});