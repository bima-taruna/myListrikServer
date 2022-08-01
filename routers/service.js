const express = require('express');
const router = express.Router();
const {Service} = require('../models/service');
const authJwt = require('../helpers/jwt');
const multer = require('multer');
const cloudinary = require('../helpers/cloudinary')
const path = require('path')

const uploadOptions = multer({
      storage : multer.diskStorage({}),
      fileFilter: (req,file,cb) => {
          let ext = path.extname(file.originalname);
          if (ext !== ".jpg" && ext !== ".jpeg" && ext !== ".png") {
              cb(new Error('tipe file tidak support'), false)
              return;
          }
          cb(null,true)
      },
   })

//GET
router.get(`/`,authJwt, async (req,res)=>{
    const servicesList = await Service.find().select('name icon');

    if(!servicesList) {
        res.status(500).json({success:false});
    }

    res.send(servicesList);
});

//GETBYID
router.get(`/:id`,authJwt, async (req,res)=>{
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
        const basePath = await cloudinary.uploader.upload(req.file.path, {public_id:service.cloudinary_id,invalidate:true})
        const serviceData =  {
            name : req.body.name || service.name,
            description : req.body.description || service.description,
            icon : basePath.secure_url || service.icon,
            cloudinary_id : basePath.public_id || service.cloudinary_id
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

    // const file = req.file;
    // if(!file) return res.status(400).send('tidak ada gambar pada request');

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
router.delete(`/:id`,authJwt, async (req,res)=>{
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
})

module.exports = router;