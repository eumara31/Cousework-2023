const express = require("express");
const hbs = require('hbs');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bodyParser = require('body-parser');
const mime = require('mime-types');
const session = require('express-session');
const {
    getSystemErrorMap
} = require("util");
const multer = require('multer');
const nodemailer = require("nodemailer");
const e = require("express");

const app = express();
const port = 3000;

const db = new sqlite3.Database('./mydb.db')

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, './views/images')
    },
    filename: function (req, file, cb) {
        cb(null, file.originalname)
    }
})

const upload = multer({
    storage: storage
})

const transporter = nodemailer.createTransport({
    host: "smtp.mail.ru",
    port: 465,
    secure: true,
    auth: {
        user: "artursshop@mail.ru",
        pass: "1BcjiSL1Yef1sTYLyVUk",
    },
});

function sendMail(email, order) {
    main(email, order)
    async function main(eml, ord) {

        const info = await transporter.sendMail({
            from: '"Константин Разбежкин" <artursshop@mail.ru>',
            to: eml,
            subject: "Ваш заказ уже в пути!",
            text: '',
            html: ord
        });

        console.log("Почтовое сообщение отправлено: %s", info.messageId)
    }
}
const passKey = 'root';

app.use(session({
    secret: 'ASJNdaw45634212',
    saveUninitialized: false,
    resave: false,
    cookie: {
        maxAge: 60000 * 60 * 24,
    }
}));
app.set("view engine", "hbs");
app.use(express.static(path.join(__dirname, 'views')));
app.use(bodyParser.urlencoded({
    extended: true
}));

generatePageRoutes('Clothes');
generatePageRoutes('Accesories');

//нужно сделать: главную страницу, страницу логина, страницу вещи, корзину.
//на главную страницу циклом будет рендерится несколько блоков с товарами, каждому будет подставляться ссылка /idI, где I - номер итерации цикла. на сервере будет выполнятся цикл app.get(/I),
//который будет генерировать рауты для разных товаров, которые будут возвращать render с параметрами о товаре в виде массива, которые будут вытаскиваться из базы данных.

//вещи в корзине должны будут сохраняться с помощью сессий

//с технической точки зрения вещи в корзине будут как массив айдишников в req.session.clothesArr, который будет обнуляться после покупки 
app.get('/', (req, res) => {
    db.all('SELECT * FROM Clothes;', (err, result) => {
        if (err) {
            throw err;
        }
        res.render("main.hbs", {
            resultArr: result,
            admin: req.session.admin,
            clothing_page: true,
        })
    })
})

app.post('/', upload.single('creationImage'), (req, res) => {
    let formattedCreationDescription;
    if (req.body.creationDescription) {
        if (req.body.creationDescription.length > 1000) {
            formattedCreationDescription = req.body.creationDescription.substring(0, 1000);
        } else {
            formattedCreationDescription = req.body.creationDescription;
        }
    }

    let formattedChangeDescription;
    if (req.body.changeDescription) {
        if (req.body.changeDescription.length > 1000) {
            formattedChangeDescription = req.body.changeDescription.substring(0, 1000);
        } else {
            formattedChangeDescription = req.body.changeDescription;
        }
    }
    if (req.body.creationName) {
        db.run(`INSERT INTO Clothes (Name, Description, Sizes, Price, Quantity, Image) VALUES ('${req.body.creationName}', '${formattedCreationDescription}', '${req.body.creationSizes}', '${req.body.creationPrice}', '${req.body.creationQuantity}', '${req.file.originalname}')`, (err, result) => {
            if (err) {
                throw err;
            }
            generatePageRoutes('Clothes');
            res.redirect("/");
        })
    }
    if (req.body.changeName) {
        db.run(`UPDATE Clothes set Description = '${formattedChangeDescription}', Sizes ='${req.body.changeSizes}',  Price = '${req.body.changePrice}', Quantity = '${req.body.changeQuantity}', Image = '${req.file.originalname}' WHERE Name = '${req.body.changeName}'`, (err, result) => {
            if (err) {
                throw err;
            }
            generatePageRoutes('Clothes');
            res.redirect("/")
        })
    }
    if (req.body.deletionName) {
        db.run(`DELETE FROM Clothes WHERE Name = '${req.body.deletionName}'`, (err, result) => {
            if (err) {
                throw err;
            }
            generatePageRoutes('Clothes');
            res.redirect("/")
        })
    }
})

//if req.session.visited {render admin prop}
app.get('/accesories', (req, res) => {
    db.all('SELECT * FROM Accesories;', (err, result) => {
        if (err) {
            throw err;
        }
        res.render("main.hbs", {
            resultArr: result,
            admin: req.session.admin,
            accesories_page: true,
        })
    })
})

app.post('/accesories', upload.single('creationImage'), (req, res) => {
    let formattedCreationDescription;
    if (req.body.creationDescription) {
        if (req.body.creationDescription.length > 1000) {
            formattedCreationDescription = req.body.creationDescription.substring(0, 1000);
        } else {
            formattedCreationDescription = req.body.creationDescription;
        }
    }

    let formattedChangeDescription;
    if (req.body.changeDescription) {
        if (req.body.changeDescription.length > 1000) {
            formattedChangeDescription = req.body.changeDescription.substring(0, 1000);
        } else {
            formattedChangeDescription = req.body.changeDescription;
        }
    }
    if (req.body.creationName) {
        db.run(`INSERT INTO Accesories (Name, Description, Sizes, Price, Quantity, Image) VALUES ('${req.body.creationName}', '${formattedCreationDescription}', '${req.body.creationSizes}', '${req.body.creationPrice}', '${req.body.creationQuantity}', '${req.file.originalname}')`, (err, result) => {
            if (err) {
                throw err;
            }
            generatePageRoutes('Accesories');
            res.redirect("/accesories")
        })
    }
    if (req.body.changeName) {
        db.run(`UPDATE Accesories set Description = '${formattedChangeDescription}', Sizes = '${req.body.changeSizes}', Price = '${req.body.changePrice}', Quantity = '${req.body.changeQuantity}', Image = '${req.file.originalname}' WHERE Name = '${req.body.changeName}'`, (err, result) => {
            if (err) {
                throw err;
            }
            generatePageRoutes('Accesories');
            res.redirect("/accesories")
        })
    }
    if (req.body.deletionName) {
        db.run(`DELETE FROM Accesories WHERE Name = '${req.body.deletionName}'`, (err, result) => {
            if (err) {
                throw err;
            }
            generatePageRoutes('Accesories');
            res.redirect("/accesories")
        })
    }
})

app.get('/login', (req, res) => {
    res.render('login.hbs')
});

app.post('/login', (req, res) => {
    if (req.body.pass == passKey) {
        req.session.admin = true;
        res.redirect('/');
    } else {
        res.render('login.hbs')
    }

});

//проход по всем айдишникам в Clothe и Accesories для генерации раутов вида /clothing_id
//это запускается только при запуске сервера, надо сделать коллбек

db.all(`SELECT id from Accesories`, (err, result) => {
    if (err) {
        throw err;
    }

    let resultFormatted = result.map(a => a['id']);
    for (let idIndex in resultFormatted) {
        app.get(`/accesories_${resultFormatted[idIndex]}`, (req, res) => {
            db.all(`SELECT * from Accesories where id='${resultFormatted[idIndex]}'`, (err, resultArr) => {
                if (err) {
                    throw err;
                }
                res.render('clothing.hbs', {
                    clothingArr: resultArr,
                })
            })
        })
    }
})

app.get('/clothing', (req, res) => {
    res.render('clothing.hbs')
})

function generatePageRoutes(type) {
    db.all(`SELECT id from ${type}`, (err, result) => {
        let route;
        if (err) {
            throw err;
        }

        if (type == 'Clothes') {
            route = 'clothing';
        } else {
            route = 'accesories';
        }

        let resultFormatted = result.map(a => a['id']);

        for (let idIndex in resultFormatted) {
            app.get(`/${route}_${resultFormatted[idIndex]}`, (req, res) => {
                db.all(`SELECT * from ${type} where id='${resultFormatted[idIndex]}'`, (err, resultArr) => {
                    let sizes = resultArr[0]['Sizes'];
                    sizesFormatted = sizes.split(', ');
                    if (err) {
                        throw err;
                    }
                    res.render('clothing.hbs', {
                        clothingArr: resultArr,
                        sizesArr: sizesFormatted,
                    })
                })
            })

            app.post(`/${route}_${resultFormatted[idIndex]}`, (req, res) => {
                if (route == 'clothing') {
                    req.session.clothingArr += `|${resultFormatted[idIndex]}`;
                } else {
                    req.session.accesoriesArr += `|${resultFormatted[idIndex]}`;
                }

                req.session.sizeArr += `|${req.body.sizeRadio}`;

                res.redirect('/bin');
            })
        }
    })
}

app.get('/bin', (req, res) => {
    let clothingIdsFormatted;
    if (req.session.clothingArr) {
        clothingIdsFormatted = req.session.clothingArr;
        clothingIdsFormatted = clothingIdsFormatted.split('|');
        if (clothingIdsFormatted[0] == 'undefined') {
            clothingIdsFormatted.shift();

        }
    }
    let accesoriesIdsFormatted;
    if (req.session.accesoriesArr) {
        accesoriesIdsFormatted = req.session.accesoriesArr;
        accesoriesIdsFormatted = accesoriesIdsFormatted.split('|');
        if (accesoriesIdsFormatted[0] == 'undefined') {
            accesoriesIdsFormatted.shift();

        }
    }
    let sizesIdsFormatted;
    if (req.session.sizeArr) {
        sizesIdsFormatted = req.session.sizeArr;
        sizesIdsFormatted = req.session.sizeArr.split('|');
        if (sizesIdsFormatted[0] == 'undefined') {
            sizesIdsFormatted.shift();

        }
    }
    //будет два цикла, первый добавляет в unitedquery вещи, второй аксессураы, потом запрос выполняется и рендерится корзина
    let unitedQuery = ``;
    let clothingQuery = ``;
    let accesoriesQuery = ``;

    if (req.session.clothingArr) {
        for (let orderId in clothingIdsFormatted) {
            if (orderId == 0) {
                clothingQuery += `SELECT * FROM Clothes WHERE id = ${clothingIdsFormatted[orderId]}`;
            } else {
                clothingQuery += ` UNION ALL SELECT * FROM Clothes WHERE id = ${clothingIdsFormatted[orderId]}`;
            }
        }
    }

    if (req.session.accesoriesArr) {
        for (let orderId in accesoriesIdsFormatted) {
            if (orderId == 0) {
                accesoriesQuery += `SELECT * FROM Accesories WHERE id = ${accesoriesIdsFormatted[orderId]}`;
            } else {
                accesoriesQuery += ` UNION ALL SELECT * FROM Accesories WHERE id = ${accesoriesIdsFormatted[orderId]}`;
            }
        }
    }
    if (clothingQuery) {
        unitedQuery += clothingQuery;
        if (accesoriesQuery) {
            unitedQuery += ` UNION ALL ${accesoriesQuery}`;
        }
    } else {
        unitedQuery += accesoriesQuery;
    }

    if (unitedQuery) {
        db.all(unitedQuery, (err, result) => {
            if (err) {
                console.log(err);
            }

            for (let sizeId in sizesIdsFormatted) {
                result[sizeId].Size = sizesIdsFormatted[sizeId];
            }

            res.render('bin.hbs', {
                ordersArr: result,
            })
        })
    } else {
        res.render('bin.hbs', {})
    }

    app.post('/bin', (req, res) => {
        if (req.body.toOrder) {
            let formData;
            if (!(typeof req.body.toOrder == 'string')) {
                formData = req.body.toOrder.join(', ');
            } else {
                formData = req.body.toOrder;
            }
            db.run(`INSERT INTO Orders (Name, Timestamp) VALUES ('${formData}', '${getTime()}');`, (err, result) => {
                if (err) {
                    console.log(err);
                }
            });

            db.all(`SELECT id FROM Orders WHERE Name = '${formData}';`, (err, result) => {
                let resultFormatted = result.map(a => a['id']);
                if (err) {
                    console.log(err);
                }
                console.log(resultFormatted[resultFormatted.length - 1])
                let message = `<h1>Благодарим вас за покупку в нашем магазине! </h1>
            <p>Заказы ${formData} будут доставлены по адресу:</p>
           <p> ${req.body.adress},</p>
           <p>курьер свяжется с вами по номеру ${req.body.phone}</p>
           <p>Номер заказа: #${resultFormatted[resultFormatted.length-1]}</p>`
                sendMail(req.body.email, message);
                db.run('UPDATE ')
                req.session.clothingArr = undefined;
                req.session.accesoriesArr = undefined;
                req.session.sizeArr = undefined;
                res.redirect('/');
            });
        }
        else {
            res.redirect('/');
        }
    })
})

app.get('/exit', (req, res) => {
    req.session.admin = false;
    res.redirect('/')
})

function getTime() {
    let date = new Date();
    let timestamp = `${date.getDate()}.${date.getMonth() + 1}.${date.getFullYear()} ${date.getHours()}:${date.getMinutes()}:${date.getSeconds()}.${date.getMilliseconds()}`;
    return timestamp;
}

app.listen(port, () => {
    console.log('Server runs at', port)
});