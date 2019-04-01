const Koa = require('koa');
const app = new Koa();

const Router = require('koa-router');
const router = new Router();

router.get('/', async (ctx) => {
    console.log('----------------');
    console.log(ctx.request);
    console.log('----------------');
    console.log(ctx.response);
    console.log('----------------');
    console.log(ctx.app);

    ctx.throw(400, 'Big BUG :D');
    ctx.body = 'Hello World';
});

app.use(router.routes());

app.listen(3000);
