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
    try {
        if (req.auth.role !== 'admin') {
            return res.status(401).json({message : 'anda tidak memiliki izin untuk mengakses laman ini',success:false});
        }
        let service = await Service.findById(req.params.id);
        await cloudinary.uploader.destroy(service.cloudinary_id);
        const basePath = await cloudinary.uploader.upload(req.file.path);
        const serviceData =  {
            name : req.body.name,
            description : req.body.description,
            icon : basePath.secure_url,
            cloudinary_id : basePath.public_id
        };
        service = await Service.findByIdAndUpdate(req.params.id, serviceData, {new:true})
        res.json(service)
    } catch (err) {
        console.log(err)
    }
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
        cloudinary_id : basePath.public_id
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
    try {
        if (req.auth.role !== 'admin') {
            return res.status(401).json({message : 'anda tidak memiliki izin untuk mengakses laman ini', success:false});
        }  
        let service = await Service.findById(req.params.id);
        await cloudinary.uploader.destroy(service.cloudinary_id);
        await service.remove();
        res.json(service);
    } catch (err) {
        console.log(err)
    }
   
}
    
)

module.exports = router;