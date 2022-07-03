const {expressjwt : jwt}  = require('express-jwt');
const secret = process.env.secret;
const api = process.env.API_URL;
const authJwt = jwt({
    secret,
    algorithms: ["HS256"]
}).unless({
    path : [
        {url : /\/public\/uploads(.*)/ , methods :['GET','OPTIONS']}
    ]
})


module.exports = authJwt