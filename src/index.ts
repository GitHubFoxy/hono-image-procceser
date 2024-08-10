import { serve } from "@hono/node-server";
import { Hono } from "hono";
import path from "path";
import fs from "fs";
import sharp from "sharp";

const app = new Hono();

app.get("/:src", async (c) => {
  const { src } = c.req.param();
  const width = c.req.query("w");
  const quality = c.req.query("q");
  const thumbnail = c.req.query("thumbnail");

  const basename = path.basename(src, path.extname(src));

  if (thumbnail) {
    const thumbnailImage = fs.readFileSync(
      path.join(__dirname, `${basename}-thumbnail.jpg`)
    );
    return new Response(thumbnailImage);
  }

  const imagePath = path.join(__dirname, src);
  const originalImage = fs.readFileSync(imagePath);

  const resizedImageBuffer = await sharp(originalImage)
    .webp({ quality: quality ? Number(quality) : 75 })
    .resize(Number(width))
    .toBuffer();

  return new Response(resizedImageBuffer);
});

app.post("/", async (c) => {
  const formData = await c.req.formData();
  const image = formData.get("image");

  if (!image || !(image instanceof Blob)) {
    return new Response(JSON.stringify({ error: "no image was founded" }), {
      status: 400,
    });
  }

  //   what is array buffer
  const buffer = await image.arrayBuffer();
  const filename = image.name || "image.png";
  const fileExtension = path.extname(filename);
  const baseFilename = path.basename(filename, fileExtension);

  const originalPath = path.join(__dirname, `${baseFilename}${fileExtension}`);

  fs.writeFileSync(originalPath, Buffer.from(buffer));
  const thumnnailBuffer = await sharp(Buffer.from(buffer))
    .blur(1)
    .resize(10)
    .toBuffer();

  const thumnnailPath = path.join(__dirname, `${baseFilename}-thumbnail.jpg`);
  fs.writeFileSync(thumnnailPath, thumnnailBuffer);

  return c.json({ message: "Success" }, 201);
});

const port = 3001;
console.log(`Server is running on port ${port}`);

serve({
  fetch: app.fetch,
  port,
});
