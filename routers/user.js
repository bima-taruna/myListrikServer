const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const {User} = require('../models/user');
const {City} = require('../models/city');
const {Perusahaan} = require('../models/perusahaan');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
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
router.get(`/`, authJwt, async (req,res)=>{
    if (req.auth.role !== 'admin') {
        return res.status(401).json({message : 'anda tidak memiliki izin untuk mengakses laman ini',success:false});
    } else {
        const usersList = await User.find().select('-passwordHash').populate('city');

        if(!usersList) {
            res.status(500).json({success:false});
        }

        res.send(usersList);
    }  
});

//GETBYROLE = Teknisi and city
router.get(`/teknisi`, authJwt, async (req,res)=>{
    if (req.auth.role === 'user' || req.auth.role === 'teknisi') {
        return res.status(401).json({message : 'anda tidak memiliki izin untuk mengakses laman ini', success:false});
    } else {
        console.log(req.auth.city)
        const usersList = await User.findOne({role : 'teknisi', city : `${(req.auth.city)}`}).select('-passwordHash');

        if(!usersList) {
            res.status(500).json({success:false});
        }

        res.send(usersList);
    }  
});

//GETBYID
router.get(`/:id`,authJwt, async (req,res)=>{
    const user= await User.findById(req.params.id).populate('city').select('-passwordHash');

    if(!user) {
        res.status(500).json({message: 'user dengan id yang diberikan tidak ditemukan'});
    }

    res.status(200).send(user);
});

//POST
router.post(`/`,authJwt,uploadOptions.single('avatar'), async (req,res)=>{
    if (req.auth.role !== 'admin') {
        return res.status(401).json({message : 'anda tidak memiliki izin untuk mengakses laman ini',success:false});
    } else {
        const userExist = await User.findOne({ email: req.body.email });
        if (userExist) {
            return res.status(400).send({ message: "Email ini sudah didaftarkan" });
        } else {
            const city = await City.findById(req.body.city);
            if(!city) return res.status(400).send('data kota belum dipilih atau tidak ada');

            if (req.body.role !== 'user') {
                const perusahaan = await Perusahaan.findById(req.body.perusahaan);
                if(!perusahaan) return res.status(400).send('data perusahaan belum dipilih atau tidak ada');
            }
            
            const basePath = await cloudinary.uploader.upload(req.file.path)
            let user = new User({
                name : req.body.name,
                avatar : basePath.secure_url,
                email : req.body.email,
                noHp : req.body.noHp,
                alamat : req.body.alamat,
                passwordHash : bcrypt.hashSync(req.body.password, 10),
                city : req.body.city,
                perusahaan : req.body.perusahaan,
                role : req.body.role,
                cloudinary_id : basePath.public_id
            });

            user = await user.save();

            if(!user) {
                return res.status(400).send('user gagal dibuat');
            }

            res.send(user); 
        }}
});

//POSTRegister
router.post(`/register`,uploadOptions.single('avatar'), async (req,res)=>{
    const userExist = await User.findOne({ email: req.body.email });
    if (userExist) {
        return res.status(400).send({ message: "Email ini sudah didaftarkan" });
    } else {
    const city = await City.findById(req.body.city);
    if(!city) return res.status(400).send('data kota belum dipilih atau tidak ada');

    if (req.body.role !== 'user') {
        const perusahaan = await Perusahaan.findById(req.body.perusahaan);
        if(!perusahaan) return res.status(400).send('data perusahaan belum dipilih atau tidak ada');
    }
    
    const basePath = await cloudinary.uploader.upload(req.file.path)

    let user = new User({
        name : req.body.name,
        avatar : basePath.secure_url,
        email : req.body.email,
        noHp : req.body.noHp,
        alamat : req.body.alamat,
        passwordHash : bcrypt.hashSync(req.body.password, 10),
        city : req.body.city,
        perusahaan : req.body.perusahaan,
        role : req.body.role,
        cloudinary_id : basePath.public_id
    });

    user = await user.save();

    if(!user) {
        return res.status(400).send('user gagal dibuat');
    }

    res.send(user);
}
});


//POSTLogin
router.post(`/login`, async (req,res)=>{
    const user = await User.findOne({email : req.body.email});
    const secret = process.env.secret;
    if (!user) {
        return res.status(400).send('user tidak ditemukan')
    }

    if (user && bcrypt.compareSync(req.body.password, user.passwordHash)) {
        const token = jwt.sign({
            userId : user.id,
            role : user.role,
            city : user.city,
            perusahaan : user.perusahaan
        }, secret, {expiresIn:'1d'})

        res.status(200).send({user: user.email, token : token});
    } else {
        res.status(400).send('password salah');
    }
});

router.delete(`/:id`,authJwt, async (req,res)=>{
    try {
        if (req.auth.role !== 'admin') {
            return res.status(401).json({message : 'anda tidak memiliki izin untuk mengakses laman ini', success:false});
        } 
         
        let user = await User.findById(req.params.id);
        await cloudinary.uploader.destroy(user.cloudinary_id);
        await user.remove();
        res.json(user);
    } catch (err) {
        console.log(err)
    }  
});

router.put(`/customer/:id`,authJwt,uploadOptions.single('avatar'), async (req,res)=>{
    try {
        let user = await User.findById(req.params.id);
        await cloudinary.uploader.destroy(user.cloudinary_id);
        const basePath = await cloudinary.uploader.upload(req.file.path);
        const userData =  {
            name : req.body.name || user.name , 
            avatar : basePath.secure_url || user.avatar,
            email : req.body.email || user.email,
            noHp : req.body.noHp || user.noHp,
            alamat : req.body.alamat || user.alamat,
            city : req.body.city || user.city.id,
            perusahaan : req.body.perusahaan || user.perusahaan,
            role : req.body.role || user.role,
            cloudinary_id : basePath.public_id || user.cloudinary_id
        };
        user = await User.findByIdAndUpdate(req.params.id, userData, {new:true})
        res.json(user)
    } catch (err) {
        console.log(err)
    }
});

router.put(`/:id`,authJwt,uploadOptions.single('avatar'), async (req,res)=>{
    try {
        const userExist = await User.findOne({ email: req.body.email });
        if (req.auth.role !== 'admin') {
            return res.status(401).json({message : 'anda tidak memiliki izin untuk mengakses laman ini',success:false});
        }
        if (userExist) {
            return res.status(400).send({ message: "Email ini sudah didaftarkan" });
        } else {
        let user = await User.findById(req.params.id);
        await cloudinary.uploader.destroy(user.cloudinary_id);
        const basePath = await cloudinary.uploader.upload(req.file.path);
        const userData =  {
            name : req.body.name,
            avatar : basePath.secure_url,
            email : req.body.email,
            noHp : req.body.noHp,
            alamat : req.body.alamat,
            passwordHash : bcrypt.hashSync(req.body.password, 10),
            city : req.body.city,
            perusahaan : req.body.perusahaan,
            role : req.body.role,
            cloudinary_id : basePath.public_id
        };
        user = await User.findByIdAndUpdate(req.params.id, userData, {new:true})
        res.json(user)
    }} catch (err) {
        console.log(err)
    }
});



module.exports = router;