const express = require("express");
const router = express.Router();
const { Perusahaan } = require("../models/perusahaan");
const { City } = require("../models/city");
const mongoose = require("mongoose");
const authJwt = require("../helpers/jwt");
//GET
router.get(`/`, async (req, res) => {
  let filter = {};

  if (req.query.cities) {
    filter = { city: req.query.cities.split(",") };
  }
  const perusahaanList = await Perusahaan.find(filter).populate("city");

  if (!perusahaanList) {
    res.status(500).json({ success: false });
  }

  res.send(perusahaanList);
});

//GETBYID
router.get(`/:id`, async (req, res) => {
  const perusahaan = await Perusahaan.findById(req.params.id).populate("city");

  if (!perusahaan) {
    res
      .status(500)
      .json({ message: "perusahaan dengan id yang diberikan tidak ditemukan" });
  }

  res.status(200).send(perusahaan);
});

//POST
router.post(`/`, authJwt, async (req, res) => {
  if (req.auth.role !== "admin") {
    return res
      .status(401)
      .json({
        message: "anda tidak memiliki izin untuk mengakses laman ini",
        success: false,
      });
  } else {
    const city = await City.findById(req.body.city);
    if (!city) return res.status(400).send("data kota tidak ada");

    let perusahaan = new Perusahaan({
      name: req.body.name,
      city: req.body.city,
    });

    perusahaan = await perusahaan.save();

    if (!perusahaan) {
      return res.status(500).send("data perusahaan gagal dibuat");
    }

    res.send(perusahaan);
  }
});

//UPDATE
router.put(`/:id`, authJwt, async (req, res) => {
  if (req.auth.role !== "admin") {
    return res
      .status(401)
      .json({
        message: "anda tidak memiliki izin untuk mengakses laman ini",
        success: false,
      });
  } else {
    if (!mongoose.isValidObjectId(req.params.id)) {
      res.status(400).send("invalid perusahaan id");
    }
    const city = await City.findById(req.body.city);
    if (!city) return res.status(400).send("invalid city id");

    const perusahaan = await Perusahaan.findByIdAndUpdate(
      req.params.id,
      {
        name: req.body.name,
        city: req.body.city,
      },
      { new: true }
    ).populate("city");
    if (!perusahaan) {
      return res.status(500).send("data perusahaan gagal diperbaharui");
    }

    res.send(perusahaan);
  }
});

//DELETE
router.delete("/:id", authJwt, (req, res) => {
  if (req.auth.role !== "admin") {
    return res
      .status(401)
      .json({
        message: "anda tidak memiliki izin untuk mengakses laman ini",
        success: false,
      });
  } else {
    Perusahaan.findByIdAndRemove(req.params.id)
      .then((perusahaan) => {
        if (perusahaan) {
          return res
            .status(200)
            .json({
              success: true,
              message: "data perusahaan berhasil dihapus!",
            });
        } else {
          return res
            .status(404)
            .json({
              success: false,
              message: "data tidak ada!, data kota gagal dihapus!",
            });
        }
      })
      .catch((err) => {
        res.status(400).json({
          error: err,
          success: false,
        });
      });
  }
});

module.exports = router;
