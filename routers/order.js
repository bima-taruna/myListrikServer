const express = require("express");
const router = express.Router();
const { Order } = require("../models/order");
const { OrderItem } = require("../models/order-items");
const authJwt = require("../helpers/jwt");
//GET
router.get(`/`, authJwt, async (req, res) => {
  if (req.auth.role !== "admin") {
    return res.status(401).json({
      message: "anda tidak memiliki izin untuk mengakses laman ini",
      success: false,
    });
  } else {
    const ordersList = await Order.find()
      .populate("user", "name")
      .populate("city", "name")
      .populate({
        path: "orderItems",
        populate: {
          path: "service",
        },
      })
      .populate("teknisi", "name")
      .sort({ dateOrdered: -1 });

    if (!ordersList) {
      res.status(500).json({ success: false });
    }

    res.send(ordersList);
  }
});

//GETBYCITY
router.get(`/localorder`, authJwt, async (req, res) => {
  if (req.auth.role !== "instalatir") {
    return res.status(401).json({
      message: "anda tidak memiliki izin untuk mengakses laman ini",
      success: false,
    });
  } else {
    const ordersList = await Order.find({ city: `${req.auth.city}` })
      .populate("user", "name")
      .populate("city", "name")
      .populate({ path: "orderItems", populate: "service" })
      .populate("teknisi", "name")
      .sort({ dateOrdered: -1 });

    if (!ordersList) {
      res.status(500).json({ success: false });
    }

    res.send(ordersList);
  }
});

//GET ORDER TEKNISI
router.get(`/task`, authJwt, async (req, res) => {
  if (req.auth.role === "user") {
    return res.status(401).json({
      message: "anda tidak memiliki izin untuk mengakses laman ini",
      success: false,
    });
  } else {
    const taskList = await Order.find({ teknisi: `${req.auth.userId}` })
      .populate("user", "name")
      .populate("city", "name")
      .populate({ path: "orderItems", populate: { path: "service" } })
      .populate("teknisi")
      .sort({ dateOrdered: -1 });

    if (!taskList) {
      res.status(500).json({ success: false });
    }

    res.send(taskList);
  }
});

//GETBYID
router.get(`/:id`, authJwt, async (req, res) => {
  const order = await Order.findById(req.params.id)
    .populate("user", "name")
    .populate("city", "name")
    .populate({ path: "orderItems", populate: { path: "service" } })
    .sort({ dateOrdered: -1 });

  if (!order) {
    res
      .status(500)
      .json({ message: "order dengan id yang diberikan tidak ditemukan" });
  }

  res.status(200).send(order);
});

router.post(`/`, authJwt, async (req, res) => {
  if (req.auth.role === "teknisi" || req.auth.role === "instalatir") {
    return res.status(401).json({
      message: "anda tidak memiliki izin untuk mengakses laman ini",
      success: false,
    });
  } else {
    const orderItemsIds = async () => {
      let newOrderItem = new OrderItem({
        service: req.body.orderItems,
      });
      newOrderItem = await newOrderItem.save();
      return newOrderItem._id;
    };

    const resolved = await orderItemsIds();

    let order = new Order({
      orderItems: resolved,
      detail: req.body.detail,
      city: req.auth.city,
      alamat: req.body.alamat,
      noHp: req.body.noHp,
      status: req.body.status,
      user: req.auth.userId,
    });

    order = await order.save();

    if (!order) {
      return res.status(400).send("pelayanan gagal dibuat");
    }

    res.send(order);
  }
});

//Update Status
router.put(`/:id`, authJwt, async (req, res) => {
  if (req.auth.role === "user" || req.auth.role === "teknisi") {
    return res.status(401).json({
      message: "anda tidak memiliki izin untuk mengakses laman ini",
      success: false,
    });
  } else {
    let order = await Order.findById(req.params.id);
    const data = {
      teknisi: req.body.teknisi || order.teknisi._id,
      status: req.body.status,
    };

    order = await Order.findByIdAndUpdate(req.params.id, data, { new: true });
    if (!order) {
      return res.status(400).send("status gagal diperbaharui");
    }

    res.send(order);
  }
});

//DELETE
router.delete("/:id", authJwt, async (req, res) => {
  try {
    if (req.auth.role === "user" || req.auth.role === "teknisi") {
      return res.status(401).json({
        message: "anda tidak memiliki izin untuk mengakses laman ini",
        success: false,
      });
    } else {
      // Order.findByIdAndRemove(req.params.id)
      //   .then(async (order) => {
      //     if (order) {
      //       await order.orderItems.map(async (orderItem) => {
      //         await OrderItem.findByIdAndRemove(orderItem);
      //       });
      //       return res
      //         .status(200)
      //         .json({ success: true, message: "order berhasil dihapus!" });
      //     } else {
      //       return res.status(404).json({
      //         success: true,
      //         message: "order tidak ada!, order gagal dihapus!",
      //       });
      //     }
      //   })
      //   .catch((err) => {
      //     res.status(400).json({
      //       error: err,
      //       success: false,
      //     });
      //   });
      let order = await Order.findById(req.params.id);
      if (order) {
        await OrderItem.findByIdAndRemove(order.orderItems.id);
        await Order.remove();
        res.json(order);
      } else {
        return res.status(404).json({
          success: false,
          message: "order tidak ada!, order gagal dihapus!",
        });
      }
    }
  } catch (err) {
    res.status(400).json({
      error: err,
      success: false,
    });
  }
});

//GETORDERBYUSERID
router.get(`/get/user`, authJwt, async (req, res) => {
  const userOrdersList = await Order.find({ user: `${req.auth.userId}` })
    .populate("user", "name")
    .populate("city", "name")
    .populate({
      path: "orderItems",
      populate: {
        path: "service",
      },
    })
    .populate("teknisi", "name")
    .sort({ dateOrdered: -1 });
  if (!userOrdersList) {
    res.status(500).json({ success: false });
  }

  res.send(userOrdersList);
});

module.exports = router;
