'use strict';

/**
 * @param {Egg.Application} app - egg application
 */
module.exports = app => {
    const { router, controller } = app;
    router.get('/', controller.home.index);
    //鉴权
    router.get('/api/redirect', controller.home.redirect);
    //获取用户openid
    router.get('/api/getOpenId', controller.home.getOpenId);
    //根据openid获取用户信息
    router.get('/api/getUserInfo', controller.home.getUserInfo);
    //jssdk接口
    router.get('/api/jssdk', controller.home.jssdk)

    //小程序支付部分
    //获取openid
    router.get('/api/mp/getOpenId', controller.mp.getMpOpenId)
        //小程序支付接口
    router.get('/api/mp/mpPay', controller.mp.mpPay)
        //小程序支付回调接口
    router.get('/api/mp/payCallBack', controller.mp.payCallBack)
        //订单查询
    router.get('/api/mp/getMpOrderInfo', controller.mp.getMpOrderInfo)
};