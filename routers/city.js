const express = require('express');
const router = express.Router();
const {City} = require('../models/city');
const authJwt = require('../helpers/jwt');

//GET
router.get(`/`,authJwt, async (req,res)=>{
    const cityList = await City.find();

    if(!cityList) {
        res.status(500).json({success:false});
    }

    res.send(cityList);
});

//GETBYID
router.get(`/:id`, async (req,res)=>{
    const city= await City.findById(req.params.id);

    if(!city) {
        res.status(500).json({message: 'kota dengan id yang diberikan tidak ditemukan'});
    }

    res.status(200).send(city);
});

//POST

router.post(`/`,authJwt, async (req,res)=>{
    if (req.auth.role !== 'admin') {
        return res.status(401).json({message : 'anda tidak memiliki izin untuk mengakses laman ini',success:false});
    } else {
    let city = new City({
        name : req.body.name
    });

    city = await city.save();

    if(!city) {
        return res.status(400).send('data kota gagal dibuat');
    }

    res.send(city);
}
});

//DELETE
router.delete('/:id',authJwt, (req,res)=>{
    if (req.auth.role !== 'admin') {
        return res.status(401).json({message : 'anda tidak memiliki izin untuk mengakses laman ini',success:false});
    } else {
    City.findByIdAndRemove(req.params.id).then(city =>{
        if(city){
           return res.status(200).json({success:true,message:'data kota berhasil dihapus!'});
        } else {
            return res.status(404).json({success:false,message:'data tidak ada!, data kota gagal dihapus!'});
        }  
    }).catch(err=>{
        res.status(400).json({
            error : err,
            success : false
        });
    });
}
});

//UPDATE
router.put(`/:id`,authJwt, async (req,res)=>{
    if (req.auth.role !== 'admin') {
        return res.status(401).json({message : 'anda tidak memiliki izin untuk mengakses laman ini',success:false});
    } else {
    const city = await City.findByIdAndUpdate(req.params.id,{
        name : req.body.name
    }, {new:true});
    if(!city) {
        return res.status(400).send('data kota gagal diperbaharui');
    }

    res.send(city);
}
});

module.exports = router;