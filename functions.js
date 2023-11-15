function getContentType(fileName) {
    const fileExtension = fileName.split('.').pop().toLowerCase();
  
    switch (fileExtension) {
      case 'jpg':
      case 'jpeg':
        return 'image/jpeg';
      case 'png':
        return 'image/png';
      case 'gif':
        return 'image/gif';
      case 'bmp':
        return 'image/bmp';
      case 'webp':
        return 'image/webp';
      default:
        return 'application/octet-stream'; // Default to binary data if the type is unknown
    }
  }
  
  function removeS3Prefix(prefixedFilename) {
    const noPrefixFilename = prefixedFilename.split('/').pop();
    return noPrefixFilename;
  }



  module.exports = {getContentType, removeS3Prefix};