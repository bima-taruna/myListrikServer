const mongoose = require("mongoose");

const perusahaanSchema = mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  city: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "City",
    required: true,
  },
});

perusahaanSchema.virtual("id").get(function () {
  return this._id.toHexString();
});

perusahaanSchema.set("toJSON", {
  virtuals: true,
});

exports.Perusahaan = mongoose.model("Perusahaan", perusahaanSchema);
