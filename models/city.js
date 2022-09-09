const mongoose = require("mongoose");

const citySchema = mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
});

citySchema.virtual("id").get(function () {
  return this._id.toHexString();
});

citySchema.set("toJSON", {
  virtuals: true,
});

exports.City = mongoose.model("City", citySchema);
