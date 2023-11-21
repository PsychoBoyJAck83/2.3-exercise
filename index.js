// Import required modules and libraries
const express = require("express");

const mongoose = require("mongoose");
Models = require("./models.js");
const Images = Models.Images;

const { getContentType, removeS3Prefix } = require("./functions.js");

const {
  S3Client,
  ListObjectsV2Command,
  PutObjectCommand,
  GetObjectCommand,
} = require("@aws-sdk/client-s3");
const fileUpload = require("express-fileupload");

/*const s3Client = new S3Client({
  region: 'eu-central-1',
})*/

let s3Client;
if (process.env.S3_config) {
  // Use the environment variable directly as an object
  s3Client = new S3Client(json.parse(process.env.S3_config));
} else {
  s3Client = new S3Client({
    region: "us-east-1",
    endpoint: "http://localhost:4566",
    forcePathStyle: true,
  });
}

const app = express();

mongoose
  .connect(
    process.env.Connection_URI ||
      "mongodb://Theo83:Uuurin83@127.0.0.1:27017/images_api",
    {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    }
  )
  .then(() => {
    console.log("Connected to the database!");
  })
  .catch((err) => {
    console.error("Failed to connect to the database:", err);
  });

// Enable CORS for all routes
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE");
  res.header("Access-Control-Allow-Headers", "Content-Type");
  next();
});

//const bucketName = 'my-cool-local-bucket'; // Replace with your S3 bucket name
const bucketName = process.env.Bucket_Name || "local-bucket";
const port = 3000;

// Middleware for file uploads
app.use(fileUpload());

// Define your routes and application logic here
app.get("/", (req, res) => {
  res.status(200).send("It's alive !");
});

// Route to list objects in the S3 bucket
app.get("/listobjects/:prefix", async (req, res) => {
  const { prefix } = req.params;

  try {
    const listObjectsParams = {
      Bucket: bucketName,
      Prefix: `${prefix}/`,
    };

    const command = new ListObjectsV2Command(listObjectsParams);
    const response = await s3Client.send(command);

    const objectKeys = response.Contents.map((object) =>
      object.Key.split("/").pop()
    );
    res.status(200).json({ objectKeys });
  } catch (error) {
    console.error("Error listing objects:", error);
    res.status(500).json({ error: "Failed to list objects" });
  }
});

// Route for handling file uploads
app.post("/upload", async (req, res) => {
  try {
    if (!req.files || !req.files.myFile) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const fileToUpload = req.files.myFile;
    const imageComment = req.body.imageComment;
    const imageTitle = req.body.imageTitle;

    const params = {
      Bucket: bucketName,
      Key: `original-images/${fileToUpload.name}`,
      Body: fileToUpload.data,
    };

    const command = new PutObjectCommand(params);
    await s3Client.send(command);

    Images.create({
      imageFileName: fileToUpload.name,
      imageTitle: imageTitle,
      imageComment: imageComment,
    });

    res.status(200).json({ message: "File uploaded successfully" });
  } catch (error) {
    console.error("Error uploading file:", error);
    res.status(500).json({ error: "Failed to upload the file" });
  }
});

app.get("/download/:fileName", async (req, res) => {
  try {
    const { fileName } = req.params;

    // Specify the S3 getObject parameters
    const params = {
      Bucket: bucketName,
      Key: fileName,
    };

    // Use the S3 getObject command to retrieve the file
    const { Body } = await s3Client.send(new GetObjectCommand(params));

    // Set the appropriate response headers for the file download
    res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);
    res.setHeader("Content-Type", "application/octet-stream");

    // Send the file as the response
    Body.pipe(res);
  } catch (error) {
    console.error("Error retrieving file:", error);
    res
      .status(500)
      .json({ error: "Failed to retrieve the file", details: error.message });
  }
});

app.get("/open/:prefix/:fileName", async (req, res) => {
  try {
    const { fileName, prefix } = req.params;

    // Specify the S3 getObject parameters
    const params = {
      Bucket: bucketName,
      Key: `${prefix}/${fileName}`,
    };

    // Use the S3 getObject command to retrieve the file
    const { Body } = await s3Client.send(new GetObjectCommand(params));

    // Set the appropriate response headers
    const contentType = getContentType(fileName);
    res.setHeader("Content-Type", contentType);

    //Image downloded from S3 bucket will have prefix in the filename
    const noPrefixFileName = removeS3Prefix(fileName);
    res.setHeader(
      "Content-Disposition",
      `inline; filename="${noPrefixFileName}"`
    );

    // Send the file as the response
    Body.pipe(res);
  } catch (error) {
    console.error("Error retrieving file:", error);
    res
      .status(500)
      .json({ error: "Failed to retrieve the file", details: error.message });
  }
});

app.get("/getAll", async (req, res) => {
  try {
    const allEntries = await Images.find({});
    res.status(200).json(allEntries);
  } catch (error) {
    console.error("Error retrieving data:", error);
    res
      .status(500)
      .json({ error: "Failed to retrieve data", details: error.message });
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
