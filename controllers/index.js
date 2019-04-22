const fs = require('fs');
const _path = require('path');
const util = require('util');
const verifyForm = require('../libs/verify');
const psw = require('../libs/password')
const db = require('../models/db')

const nodemailer = require('nodemailer');
const config = require('../email_config.json');

const rename = util.promisify(fs.rename);
const unlink = util.promisify(fs.unlink);

module.exports.index = async (ctx, next) => {
    ctx.render('pages/index', {
        authorised: ctx.session.isAuthorized
    });
}

module.exports.myWorks = async (ctx, next) => {
    const works = db
        .getState()
        .works || [];

    ctx.render('pages/my-work', {
        items: works,
        authorised: ctx.session.isAuthorized
    });
}

module.exports.uploadWork = async (ctx, next) => {
    const {projectName, projectUrl, text} = ctx.request.body.fields;
    const {name, size, path} = ctx.request.body.files.file;
    let responseError = verifyForm(projectName, projectUrl, text);
    if (responseError) {
        await unlink(path);
        return ctx.body = responseError;
    }
    if (name === "" || size === 0) {
        await unlink(path);
        return (ctx.body = {
            mes: 'Не загружена картинка проекта',
            status: 'Error'
        });
    }

    let fileName = _path.join(process.cwd(), 'public/upload', name);

    const errUpload = await rename(path, fileName);

    if (errUpload) {
        return (ctx.body = {
            mes: "При загрузке проекта произошла ошибка rename file",
            status: "Error"
        });
    }
    db
        .get("works")
        .push({
            name: projectName,
            link: projectUrl,
            desc: text,
            picture: _path.join('upload', name)
        })
        .write();
    ctx.body = {
        mes: "Проект успешно загружен",
        status: "OK"
    };
}

module.exports.contactMe = async (ctx, next) => {
    ctx.render('pages/contact-me',
        {
            authorised: ctx.session.isAuthorized
        });
}


module.exports.contactMe_sendmail = async (ctx, next) => {

    console.log(ctx.request.body.name);
    console.log(ctx.request.body.email);
    console.log(ctx.request.body.message);

    //требуем наличия имени, обратной почты и текста
    if (!ctx.request.body.name || !ctx.request.body.email || !ctx.request.body.message) {
        ctx.body = {
            mes: "Все поля нужно заполнить!",
            status: "Error"
        };
        ctx.redirect('/contact-me');
    }

    //инициализируем модуль для отправки писем и указываем данные из конфига
    let smtpTransport;
    try {
        smtpTransport = nodemailer.createTransport(config.mail.smtp);

    } catch (e) {
        return console.log('Error: ' + e.name + ":" + e.message);
    }
    console.log('SMTP Configured');


    const mailOptions = {
        from: `${ctx.request.body.name} <${ctx.request.body.email}>`,
        to: config.mail.smtp.auth.user,
        subject: config.mail.subject,
        text:
        ctx.request.body.message.trim().slice(0, 500) +
        `\n Отправлено с: <${ctx.request.body.email}>`
    };
    console.log('mailOptions Configured');


    //отправляем почту
    console.log('Start sending Mail ... ');



    // smtpTransport.sendMail(mailOptions, function (error, info) {
    //     //если есть ошибки при отправке - сообщаем об этом
    //     if (!error) {
    //         console.log("Message response: " + info.response);
    //         console.log('Message sent: %s', info.messageId);
    //         console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
    //
    //         ctx.body = {
    //             mes: "Письмо успешно отправлено!",
    //             status: "OK"
    //         };
    //     } else {
    //         console.log(error);
    //         ctx.body = {
    //             mes: `При отправке письма произошла ошибка!: ${error}`,
    //             status: "Error"
    //         };
    //     }
    //     smtpTransport.close();
    // });

            ctx.body = {
                mes: "Письмо успешно отправлено!",
                status: "OK"
            };

    console.log('-----------------------');

}


module.exports.login = async (ctx, next) => {

    if (ctx.session.isAuthorized == true)
        ctx.redirect('/admin');

    ctx.render('pages/login',
        {
            authorised: ctx.session.isAuthorized
        });
}

module.exports.logout = async (ctx, next) => {
    ctx.session.isAuthorized = false;
    ctx.body = {
        mes: "Вы вышли из административной части!",
        status: "OK"
    };
    ctx.redirect('/');
}

module.exports.auth = async (ctx, next) => {
    const {login, password} = ctx.request.body;
    const user = db
        .getState()
        .user;

    if (user.login === login && psw.validPassword(password)) {
        ctx.session.isAuthorized = true;
        ctx.body = {
            mes: "Aвторизация успешна!",
            status: "OK"
        };
    } else {
        ctx.body = {
            mes: "Логин и/или пароль введены неверно!",
            status: "Error"
        };
        ctx.render('pages/login');
    }
}