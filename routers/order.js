const express = require("express");
const router = express.Router();
const { Order } = require("../models/order");
const { OrderItem } = require("../models/order-items");
const authJwt = require("../helpers/jwt");
//GET
router.get(`/`,authJwt, async (req, res) => {
  const ordersList = await Order.find()
    .populate("user", "name")
    .populate("city", "name")
    .populate({ path: "orderItems", populate: "service" })
    .sort({ dateOrdered: -1 });

  if (!ordersList) {
    res.status(500).json({ success: false });
  }

  res.send(ordersList);
});

//GETBYID
router.get(`/:id`,authJwt, async (req, res) => {
  const order = await Order.findById(req.params.id)
    .populate("user", "name")
    .populate("city", "name")
    .populate({ path: 'orderItems', populate: {path : 'service' }})
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
    return res
      .status(401)
      .json({
        message: "anda tidak memiliki izin untuk mengakses laman ini",
        success: false,
      });
  } else {

    let order = new Order({
      orderItems: req.body.orderItems._id,
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
router.put(`/:id`,authJwt, async (req,res)=>{
    if (req.auth.role === 'user' || req.auth.role === 'teknisi') {
        return res.status(401).json({message : 'anda tidak memiliki izin untuk mengakses laman ini',success:false});
    } else {
    const order = await Order.findByIdAndUpdate(req.params.id,{
        status : req.body.status
    }, {new:true});
    if(!order) {
        return res.status(400).send('status gagal diperbaharui');
    }

    res.send(order); }
});

//DELETE
router.delete('/:id',authJwt, (req,res)=>{
    if (req.auth.role === 'user' || req.auth.role === 'teknisi') {
        return res.status(401).json({message : 'anda tidak memiliki izin untuk mengakses laman ini', success:false});
    } else {
    Order.findByIdAndRemove(req.params.id).then(async order =>{
        if(order){
            await order.orderItems.map(async orderItem=>{
                await OrderItem.findByIdAndRemove(orderItem)
            })
           return res.status(200).json({success:true,message:'order berhasil dihapus!'});
        } else {
            return res.status(404).json({success:true,message:'order tidak ada!, order gagal dihapus!'});
        }  
    }).catch(err=>{
        res.status(400).json({
            error : err,
            success : false
        });
    }); }
    
})

//GETORDERBYUSERID
router.get(`/get/userorders/:userid`,authJwt, async (req, res) => {
  const userOrdersList = await Order.find({user : req.params.userid})
    .populate({path : 'orderItems', populate : {
      path : 'service'
    }}).sort({'dateOrdered' : -1});
  if (!userOrdersList) {
    res.status(500).json({ success: false });
  }

  res.send(userOrdersList);
});

module.exports = router;
