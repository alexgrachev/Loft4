const _path = require('path');
const util = require('util');
const fs = require('fs');

const db = require('../models/db');
const rename = util.promisify(fs.rename);


const skills = db
    .getState()
    .skills || [];


module.exports.admin = async (ctx, next) => {

    if (ctx.session.isAuthorized == false)
        ctx.redirect('/');


    ctx.render('pages/admin',
        {
            authorised: ctx.session.isAuthorized,
            skills: skills
        });
};



module.exports.setSkills = async (ctx, next) => {
    const {age, concerts, cities, years} = ctx.request.body;
    const fildsName = ['age', 'concerts', 'cities', 'years'];
    const data = db.getState().skills;

    let ee = db.getState().skills[0].number;
    console.log(ee);

    let isValid = true;
    console.log(ctx.request.body);

    [age, concerts, cities, years].forEach((item, i) => {
        const isNotNumber = parseInt(item, 10) === NaN;
        if (item < 0 || isNotNumber) {
            isValid = false;
            return;
        }
        db.getState().skills[i].number = item;
    });

    if (!isValid) {
        return ctx.redirect('/admin/?msgskill=incorrect');
    }
    db.write();

    ctx.redirect('/admin');
};



module.exports.setUpload = async (ctx, next) => {
    console.log(ctx.request.files.file);

    const {description, price} = ctx.request.body;
    const {name, size, path} = ctx.request.files.file;

    let fileName = _path.join(process.cwd(), '/public/assets/img/products', name);

    await rename(path, fileName);

    db
        .get('pics')
        .push({
            description: description,
            price: price,
            photo: _path.join('./assets/img/products', name)
        })
        .write();
    ctx.body = {
        mes: 'Проект успешно загружен',
        status: 'OK'
    };

};

