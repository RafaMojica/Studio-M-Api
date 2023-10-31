const { Schema, model } = require("mongoose");

const CertificateSchema = new Schema({
  description: {
    type: String,
    required: [false],
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  courseId: {
    type: Schema.Types.ObjectId,
    required: [true, "Course is required"],
    ref: "Course",
  },
  userId: {
    type: Schema.Types.ObjectId,
    required: [true, "Course is required"],
    ref: "User",
  },
});

const Certificate = model("Certificate", CertificateSchema);

module.exports = Certificate;
