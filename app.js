const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const morgan = require('morgan');
const mongoose = require('mongoose');
require('dotenv/config');
const api = process.env.API_URL;
const errorHandler = require('./helpers/error-handler');
const servicesRouter = require('./routers/service');
const cityRouter = require('./routers/city');
const perusahaanRouter = require('./routers/perusahaan');
const userRouter = require('./routers/user');
const orderRouter = require('./routers/order');
const cors = require('cors');



//CORS
app.use(cors());
app.options('*', cors());


//Middleware
app.use(bodyParser.json());
app.use(morgan('tiny'));
app.use(errorHandler);


//Routers
app.use(`${api}/services`, servicesRouter);
app.use(`${api}/cities`, cityRouter);
app.use(`${api}/perusahaan`, perusahaanRouter);
app.use(`${api}/users`, userRouter);
app.use(`${api}/orders`, orderRouter);

mongoose.connect(process.env.CONNECTION_STRING, {
    useNewUrlParser : true,
    useUnifiedTopology: true,
    dbName: 'mylistrikdatabase'
})
.then(()=>{
    console.log('database ready')
})
.catch((err)=>{
    console.log(err)
})

// app.listen(3000, ()=> {
//     console.log(api);
//     console.log('the server is running di 3000')
// })

let server = app.listen(process.env.PORT || 3000, function(){
    let port = server.address().port;
    console.log('server berjalan di port ' + port)
})