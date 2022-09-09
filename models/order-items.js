const mongoose = require("mongoose");

const orderItemSchema = mongoose.Schema({
  service: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Service",
  },
});

exports.OrderItem = mongoose.model("OrderItem", orderItemSchema);
