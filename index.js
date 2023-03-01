const express = require('express');
const app = express();
const bodyparser = require('body-parser');
const mysql = require('mysql')
const expressSession = require('express-session');
const cookies = require('cookie-parser');
const fileupload = require('express-fileupload');

app.set("view engine", "ejs");
app.use(express.static(__dirname + "/public"));
app.use(bodyparser.urlencoded({ extended : false }));
app.use(fileupload())

const sessionConfig = {
    secret: 'askfnkasfnkasn',
    resave: false,
    saveUninitialized: true,
    cookie: {
        httpOnly: true,
        secure: false,
        path: '/',
        maxAge: 1000 * 60 * 60 * 24
    }
};
app.use(expressSession(sessionConfig));
app.use(cookies());

const connection = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "<@PKv#789$on>",
    database: "testdb"
});

connection.connect(function(error){
    if(error){
        console.log('unable to connect database');
    }else {
        console.log('database connected');
    }
});

app.get('/',async function(req, res){
    let Data = {
        pagetitle: "home page",
        pageName: "homepage",
        isUserLooggedIn: false,
        products: "",
    }
    if(req.cookies && req.cookies.token){
        Data.isUserLooggedIn = true
    };
    const product = await getallproduct()
    Data.products = product;
    res.render('template', Data);
});

app.get('/buy-product',async function(req, res){
    let Data = {
        pagetitle: "Buy Product",
        pageName: "buy-product",
        isUserLooggedIn: false,
        product: "",
        message: "",
    };
    if(req.cookies && req.cookies.token){
        Data.isUserLooggedIn = true
    };
    console.log('req.query', req.query);
    const id = req.query.productid;
    const product = await getproduct(id)
    console.log('products', product);
    Data.product = product;
    res.render('template', Data);
})

app.post('/create-order',async function(req, res){
    console.log('req.body', req.body);
    const bodydata = {
        fullname: req.body.fullName,
        email: req.body.email,
        contact: req.body.contact,
        shippingAddress: req.body.shippingAddress,
        shippingPincode: req.body.shippingPincode,
        billingAddress: req.body.billingAddress,
        billingPincode: req.body.billingPincode,
        productId: req.body.productId,
        tatalamount: req.body.totalAmount,
        paymentMethod: req.body.paymentMethod,
        userid: req.cookies.token,
    }
    console.log('bodydata', bodydata);
    const result = await createOrder(bodydata);
    if(result == true){
        res.redirect('/')
    }else {
        res.redirect('/buy-product')
    }
})
/////////panding work
function createOrder(bodydata){
    return new Promise(function(resolve, reject){
        let orderplaced = `INSERT INTO order(fullname, email, contact, sAddress, sPincode, bAddress, bPincode, productid, totalamount, paymentMethod, userid) VALUES('${bodydata.fullname}', '${bodydata.email}', '${bodydata.contact}', '${bodydata.shippingAddress}', '${bodydata.shippingPincode}', '${bodydata.billingAddress}', '${bodydata.billingPincode}', '${bodydata.productId}', '${bodydata.tatalamount}', '${bodydata.paymentMethod}', '${bodydata.userid}')`;
        connection.query(orderplaced, function(error, result){
            if(error){
                reject(error)
            }else{
                resolve(true)
            }
        })
    })
}
//to inser user
function insertuser(bodyData){
    return new Promise(function(resolve, reject){
        let insertuser = `INSERT INTO users(fname, lname, dob, gender, email, contact, password) VALUES('${bodyData.firstName}', '${bodyData.lastName}', '${bodyData.dob}', '${bodyData.gender}', '${bodyData.email}', '${bodyData.contact}', '${bodyData.password}')`;
        connection.query(insertuser, function(error, result){
            if(error){
                reject(error)
            }else {
                resolve(true)
            };
        });
    });
};

function getproduct(id){
    return new Promise(function(resolve, reject){
        let getpro = `SELECT * FROM products WHERE id='${id}'`;
        connection.query(getpro, function(error, result){
            if(error){
                reject(error)
            }else {
                resolve(result[0])
            }
        })
    })
};

app.get('/sign-up', function(req, res){
    let Data = {
        pagetitle: "register page",
        pageName: "register",
        isUserLooggedIn: false
    };
    if(req.cookies && req.cookies.token){
        Data.isUserLooggedIn = true
    };
    res.render('template', Data);
});

app.get('/log-in', function(req, res){
    let Data = {
        pagetitle: "sign in portal",
        pageName: "sign-in",
        status: "",
        message: "",
        isUserLooggedIn: false
    }
    if(req.cookies && req.cookies.token){
        Data.isUserLooggedIn = true
    };
    if(req.session.status && req.session.message){
        Data.status = req.session.status;
        Data.message = req.session.message;
        delete req.session.status, req.session.message;
    }
    res.render('template', Data);
})

app.post('/aurthentication', async function(req, res){
    console.log('req.body', req.body);
    const email = req.body.email;
    const password = req.body.password;
    const result = await getuser(email);
    console.log('result', result);
    if(result){
        if(result.password == password){
            res.cookie('token', result.id)
            res.redirect('/')
        }else {
            req.session.status = "passwordError";
            req.session.message = "Incorrect Password"
            res.redirect('/log-in')
        }
    }else {
            req.session.status = "emailError";
            req.session.message = "Invalid Email"
            res.redirect('/log-in')
    }
})

// to get user deteals
function getuser(email){
    return new Promise(function(resolve, reject){
        let getuser = `SELECT * FROM users WHERE email='${email}'`;
        connection.query(getuser, function(error, result){
            if(error){
                reject(error)
            }else {
                resolve(result[0])
            }
        })
    })
}

app.post('/registration', async function(req, res){
    console.log('req.body', req.body);
    const bodyData = {
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        dob: req.body.dob,
        gender: req.body.gender,
        email: req.body.email,
        contact: req.body.contact,
        password: req.body.password
    }
    const result = await insertuser(bodyData);
    console.log('result', result);
    if(result == true){
        res.redirect('/');
    }
});



// *********************************************  ADMIN PANEL CODE  ********************************************

app.get('/admin', function(req, res){
    let Data = {
        pagetitle: "home page",
        pageName: "homepage",
        isAdminLooggedIn: false
    }
    if(req.cookies && req.cookies.tokenadmin){
        Data.isAdminLooggedIn = true
    }
    console.log("Data", Data);
    res.render('admin/template', Data);
});

app.get('/admin/sign-up', function(req, res){
    let Data = {
        pagetitle: "registration page",
        pageName: "register",
        isAdminLooggedIn: false
    };
    if(req.cookies && req.cookies.tokenadmin){
        Data.isAdminLooggedIn = true
    }
    console.log("Data")
    res.render('admin/template', Data);
})

app.get('/admin/sign-in-admin', function(req, res){
    let Data = {
        pagetitle: "log in portal admin",
        pageName: "sign-in",
        status: "",
        message: "",
        isAdminLooggedIn: false
    };
    if(req.cookies && req.cookies.tokenadmin){
        Data.isAdminLooggedIn = true
    }
    if(req.session.status && req.session.message){
        Data.status = req.session.status;
        Data.message = req.session.message;
        delete req.session.status, req.session.message;
    }
    res.render('admin/template', Data);
});

app.get('/admin/all-product',async function(req, res){
    let Data = {
        pagetitle: "All product",
        pageName: "products",
        product: "",
        isAdminLooggedIn: false,
    }
    if(req.cookies && req.cookies.tokenadmin){
        Data.isAdminLooggedIn = true
    }
    const products = await getallproduct();
    console.log('products ', products);
    Data.product = products
    res.render('admin/template', Data);
});

//to get all products
function getallproduct(){
    return new Promise(function(resolve, reject){
        let getpro = `SELECT * FROM products`;
        connection.query(getpro, function(error, result){
            if(error){
                reject(error)
            }else {
                resolve(result)
            }
        })
    })
};

app.get('/delete-product', async function(req, res){
    console.log('req.query', req.query);
    const id = req.query.proID;
    const result = await deleteproduct(id);
    if(result){
        res.redirect('admin/all-product');
    }
})

function deleteproduct(id){
    return new Promise(function(resolve, reject){
        let deletepro = `DELETE FROM products WHERE id='${id}'`;
        connection.query(deletepro, function(error, result){
            if(error){
                reject(error)
            }else {
                resolve(true)
            }
        })
    })
}

app.get('/edit-product',async function(req, res){
    let Data = {
        pagetitle: "Edit product",
        pageName: "edit-product",
        prodata: "",
        isAdminLooggedIn: false,
    };
    if(req.cookies && req.cookies.tokenadmin){
        Data.isAdminLooggedIn = true
    }
    console.log('req.query', req.query);
    const id = req.query.proID;
    const product = await getproductdeteals(id);
    console.log('product deteals my', product);
    Data.prodata = product;
    res.render('admin/template', Data);
});

app.post('/updateproduct',async function(req, res){
    console.log('req.body', req.body);
    const productID = req.body.proID;
    const productimage = await uploadimage(req.files.productimage, 'product')
    const bodydata = {
        title: req.body.title,
        description: req.body.description,
        price: req.body.price,
        isfetured: req.body.isfetured,
        quantity: req.body.quantity,
        productimg: productimage
    };
    const updateproduct = await updatepro(bodydata, productID);
    console.log('updateproduct', updateproduct);
    if(updateproduct == true){
        res.redirect('/admin/all-product');
    }
})

function updatepro(bodydata, id){
    return new Promise(function(resolve, reject){
        let updatepro = `UPDATE products SET title=('${bodydata.title}'), description=('${bodydata.description}'), price=('${bodydata.price}'), isfetured=('${bodydata.isfetured}'), quantity=('${bodydata.quantity}'), productimage=('${bodydata.productimg}') WHERE id='${id}'`;
        connection.query(updatepro, function(error, result){
            if(error){
                reject(error)
            }else {
                resolve(true)
            };
        })
    })
}

function getproductdeteals(id){
    return new Promise(function(resolve, reject){
        let getproduct = `SELECT * FROM products WHERE id='${id}'`;
        connection.query(getproduct, function(error, result){
            if(error){
                reject(error)
            }else {
                resolve(result[0])
            };
        })
    })
}

app.get('/admin/all-users',async function(req, res){
    let Data = {
        pagetitle: "All users",
        pageName: "users",
        isAdminLooggedIn: false,
        users: "",
    };
    if(req.cookies && req.cookies.tokenadmin){
        Data.isAdminLooggedIn = true
    }
    const user = await getallusers();
    console.log('users', user);
    Data.users = user;
    res.render('admin/template', Data);
})

function getallusers(){
    return new Promise(function(resolve, reject){
        let getalluser = `SELECT * FROM users`;
        connection.query(getalluser, function(error, result){
            if(error){
                reject(error)
            }else {
                resolve(result);
            };
        })
    })
}
 

app.post('/uploadproduct', async function(req, res){
    console.log('req.body', req.body);
    console.log('req.files', req.files);
    let productimagenewname = await uploadimage(req.files.productimage, 'product');
    let bodydata = {
        title: req.body.title,
        description: req.body.description,
        price: req.body.price,
        isfetured: req.body.isfetured,
        quantity: req.body.quantity,
        productimage: productimagenewname
    };
    let result = await insertproduct(bodydata);
    if(result){
        res.redirect('/admin/all-product');
    }else {
        res.redirect('/admin/all-product');
    }
})



function insertproduct(bodydata){
    return new Promise(function(resolve, reject){
        let insertproduct = `INSERT INTO products(title, description, price, isfetured, quantity, productimage) VALUES('${bodydata.title}','${bodydata.description}', '${bodydata.price}', '${bodydata.isfetured}', '${bodydata.quantity}', '${bodydata.productimage}')`;
        connection.query(insertproduct, function(error, result){
            if(error){
                reject(error)
            }else {
                resolve(true)
            }
        })
    })
}

function uploadimage(image, path){
    return new Promise(function(resolve, reject){
        let imgExt = image.name.split('.').splice(-1);
        console.log('imgExt', imgExt);
        let currentdate = new Date;
        let imagenewname = `${currentdate.getTime()}__${Math.random(1111, 99999) * 1000}__.${imgExt}`;
        let uploadpath = `./public/images/${path}/` + imagenewname;
        image.mv(uploadpath, function(error){
            if(error){
                reject(error);
            }else {
                resolve(imagenewname);
            };
        });
    });
}

app.post('/aurthentication-admin',async function(req, res){
    console.log('req.body', req.body);
    const email = req.body.email;
    const password = req.body.password;
    const result = await getadmin(email);
    console.log('result', result);
    if(result){
        if(result.password == password){
            res.cookie('tokenadmin', result.id)
            res.redirect('/admin')
        }else {
            req.session.status = "passwordError";
            req.session.message = "Incorrect Password"
            res.redirect('/admin/sign-in-admin')
        }
    }else {
            req.session.status = "emailError";
            req.session.message = "Invalid Email"
            res.redirect('/admin/sign-in-admin')
    }
});


//to get admin
function getadmin(email){
    return new Promise(function(resolve, reject){
        let getadmin = `SELECT * FROM admin WHERE email='${email}'`;
        connection.query(getadmin, function(error, result){
            if(error){
                reject(error)
            }else {
                resolve(result[0])
            }
        })
    })
}


app.post('/registrationadmin',async  function(req, res){
    const bodyData = {
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        dob: req.body.dob,
        gender: req.body.gender,
        email: req.body.email,
        contact: req.body.contact,
        password: req.body.password
    }
    const result = await insertadmin(bodyData);
    console.log('result', result);
    if(result == true){
        res.redirect('/');
    }
})

// to insert admin 
function insertadmin(bodyData){
    return new Promise(function(resolve, reject){
        let insertadmin = `INSERT INTO admin(fname, lname, dob, gender, email, contact, password) VALUES('${bodyData.firstName}', '${bodyData.lastName}', '${bodyData.dob}', '${bodyData.gender}', '${bodyData.email}', '${bodyData.contact}', '${bodyData.password}')`;
        connection.query(insertadmin, function(error, result){
            if(error){
                reject(error)
            }else {
                resolve(true)
            };
        });
    });
};

const port = 3002;
app.listen(port, function(){
    console.log(`server started at port ${port}`)
});