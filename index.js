// Import required modules and libraries
const express = require('express');
const { S3Client, ListObjectsV2Command, PutObjectCommand, GetObjectCommand } = require('@aws-sdk/client-s3')
const fileUpload = require('express-fileupload');
const s3Client = new S3Client({
  region: 'us-east-1',
  endpoint: 'http://localhost:4566',
  forcePathStyle: true
})
const listObjectsParams = {
  Bucket: 'my-cool-local-bucket'
}
const app = express();
const port = 3000;

// Middleware for file uploads
app.use(fileUpload());

// Define your routes and application logic here
app.get('/', (req, res) => {
  res.send("It's alive !");
});

// Route to list objects in the S3 bucket
app.get('/listobjects', async (req, res) => {
  const bucketName = 'my-cool-local-bucket'; // Replace with your S3 bucket name

  try {
    const  listObjectsParams  = {
      Bucket: bucketName,
    };

    const command = new ListObjectsV2Command( listObjectsParams );
    const response = await s3Client.send(command);

    const objectKeys = response.Contents.map((object) => object.Key);
    res.json({ objectKeys });
  } catch (error) {
    console.error('Error listing objects:', error);
    res.status(500).json({ error: 'Failed to list objects' });
  }
});

// Route for handling file uploads
app.post('/upload', async (req, res) => {
  try {
    if (!req.files || !req.files.myFile) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const fileToUpload = req.files.myFile;
    const bucketName = 'my-cool-local-bucket'; // Replace with your S3 bucket name

    const params = {
      Bucket: bucketName,
      Key: fileToUpload.name,
      Body: fileToUpload.data,
    };

    const command = new PutObjectCommand(params);
    await s3Client.send(command);

    res.json({ message: 'File uploaded successfully' });
  } catch (error) {
    console.error('Error uploading file:', error);
    res.status(500).json({ error: 'Failed to upload the file' });
  }
});

app.get('/download/:fileName', async (req, res) => {
  try {
    const { fileName } = req.params;
    const bucketName = 'my-cool-local-bucket'; // Replace with your S3 bucket name

    // Specify the S3 getObject parameters
    const params = {
      Bucket: bucketName,
      Key: fileName,
    };

    // Use the S3 getObject command to retrieve the file
    const { Body }/*response*/ = await s3Client.send(new GetObjectCommand(params));

    // Set the appropriate response headers for the file download
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.setHeader('Content-Type', 'application/octet-stream');

    // Send the file as the response
    //res.send(Body);
    /*response.*/Body.pipe(res);

  } catch (error) {
    console.error('Error retrieving file:', error);
    res.status(500).json({ error: 'Failed to retrieve the file' , details: error.message });
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
