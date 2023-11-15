const mongoose = require("mongoose");

let imageSchema = mongoose.Schema({
    imageFileName: {type: String, required: true},
    imageTitle: {type: String, required: true},
    imageComment: {type: String, required: false}
});

let Images = mongoose.model("Image", imageSchema);
module.exports.Images = Images;