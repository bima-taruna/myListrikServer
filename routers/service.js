const express = require('express');
const router = express.Router();
const {Service} = require('../models/service');
const authJwt = require('../helpers/jwt');
const multer = require('multer');
const { unlink, unlinkSync } = require('node:fs');
const fs = require('fs')
const cloudinary = require('../helpers/cloudinary')
const FILE_TYPE_MAP = {
    'image/png' : 'png',
    'image/jpeg' : 'jpeg',
    'image/jpg' : 'jpg'
}

let resultHandler = function (err) {
    if (err) {
        console.log("unlink failed", err);
    } else {
        console.log("file deleted");
    }
}

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        // let files = fs.readdirSync(__dirname + '\\..\\public\\uploads');
        // console.log(file.originalname)
        // if (files.includes(file.originalname + '-' + req.auth.userId)) {
        //     fs.unlinkSync(__dirname + '\\..\\public\\uploads' + file.originalname + '-' + req.auth.userId)
        // }
        const isValid = FILE_TYPE_MAP[file.mimetype];
        let uploadError = new Error('tipe file gambar salah');

        if (isValid) {
            uploadError = null
        }
      cb(uploadError, 'public/uploads')
    },
    filename: function (req, file, cb) {
      const fileName = file.originalname.split(' ').join('-');
      const uniqueSuffix = req.auth.userId
      const extension = FILE_TYPE_MAP[file.mimetype];
      cb(null, `${fileName}-${uniqueSuffix}.${extension}`)
    }
  })
  
  const uploadOptions = multer({ storage: storage })

//GET
router.get(`/`,authJwt, async (req,res)=>{
    const servicesList = await Service.find().select('name icon');

    if(!servicesList) {
        res.status(500).json({success:false});
    }

    res.send(servicesList);
});

//GETBYID
router.get(`/:id`, async (req,res)=>{
    const service = await Service.findById(req.params.id);

    if(!service) {
        res.status(500).json({success:false});
    }

    res.status(200).send(service);
});

//UPDATE
router.put(`/:id`,authJwt,uploadOptions.single('icon'), async (req,res)=>{
    
    if (req.auth.role !== 'admin') {
        return res.status(401).json({message : 'anda tidak memiliki izin untuk mengakses laman ini',success:false});
    } else {
        const fileName = req.file.filename;
        const basePath = `${req.protocol}://${req.get('host')}/public/uploads/`;
        
    const service = await Service.findByIdAndUpdate(req.params.id,{
        name : req.body.name,
        description : req.body.description,
        icon : `${basePath}${fileName}`,
    }, {new:true});
    
    if(!service) {
        return res.status(400).send('pelayanan gagal diperbaharui');
    }
    
    res.send(service); }
});

//POST
router.post(`/`,authJwt,uploadOptions.single('icon'), async (req,res)=>{
    if (req.auth.role !== 'admin') {
        return res.status(401).json({message : 'anda tidak memiliki izin untuk mengakses laman ini', success:false});
    } else {

    const file = req.file;
    if(!file) return res.status(400).send('tidak ada gambar pada request');

    const fileName = req.file.filename;
    const basePath = await cloudinary.uploader.upload(req.file.path)
    // `${req.protocol}://${req.get('host')}/public/uploads/`;
    let service = new Service({
        name : req.body.name,
        description : req.body.description,
        icon : basePath.secure_url,
    });

    service = await service.save();

    if(!service) {
        return res.status(400).send('pelayanan gagal dibuat');
    }

    res.send(service); 
}
});

//DELETE
router.delete('/:id',authJwt, async (req,res)=>{
    
    if (req.auth.role !== 'admin') {
        return res.status(401).json({message : 'anda tidak memiliki izin untuk mengakses laman ini', success:false});
    } else {
     
    // Service.findByIdAndRemove(req.params.id).then(service =>{
    //     if(service){
    //         return res.status(200).json({success:true,message:'pelayanan berhasil dihapus!'});
    //     } else {
    //         return res.status(404).json({success:true,message:'pelayanan tidak ada!, pelayanan gagal dihapus!'});
    //     }  
    // }).catch(err=>{
    //     res.status(400).json({
    //         error : err,
    //         success : false
    //     });
    // }); 
    try {
        let service = await Service.findByIdAndRemove(req.params.id);
        await cloudinary.uploader.destroy(service.secure_url);
        res.json(service);
    } catch (err) {
        console.log(err)
    }
   
}
    
})

module.exports = router;