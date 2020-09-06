'use strict';

const Controller = require('egg').Controller;
const wxConfig = require('../service/wx-config')
const tool = require('../service/tool')
const cache = require('memory-cache')
const utility = require('utility')
const createHash = require('create-hash')
class MpController extends Controller {

    async getMpOpenId() {
        const { ctx, app } = this

        let code = ctx.query.code

        // console.log('get openid', code)
        //根据code 获取openid 
        let url = `https://api.weixin.qq.com/sns/jscode2session?appid=${wxConfig.mp.appID}&secret=${wxConfig.mp.appsecret}&js_code=${code}&grant_type=authorization_code`

        let result = await ctx.curl(url, {
                method: 'GET',
                dataType: 'json'
            })
            // console.log(result)
        if (result.status === 200 && !result.data.errcode) {
            ctx.apiSuccess(result.data)
            return
        }
        return ctx.apiFail('获取用户openid失败')
    }

    async mpPay() {
        const { ctx, app } = this
        console.log('小程序支付接口', ctx.query.openid)

        let openid = ctx.query.openid

        let appId = wxConfig.mp.appID
        let attach = "小程序"
        let body = "小程序支付"
        let total_fee = 10; //支付总金额 单位分
        let rurl = 'https://8a9db58b5eb8.ngrok.io'
        let notify_url = "http://localhost:7001/api/mp/payCallBack"

        let ip = "47.106.113.181";
        let data = await ctx.order(appId, attach, body, openid, total_fee, rurl, ip)
        console.log('统一下单接口订单', data)
        ctx.apiSuccess(data)
    }

    async payCallBack() {
        const { ctx, app } = this
        console.log('支付回调')
        let xml = `<xml>
        <return_code><![CDATA[SUCCESS]]></return_code>
        <return_msg><![CDATA[OK]]></return_msg>
        </xml>`
        ctx.body = xml
    }

    //查询订单接口
    async getMpOrderInfo() {
        const { ctx, app } = this
        let orderId = ctx.query.orderId
        console.log('订单号', orderId)


        let appid = wxConfig.mp.appID;
        let mch_id = wxConfig.mch.mchID;
        let out_trade_no = orderId

        //nonce_str , sign,sign_type(默认MD5)
        let data = await ctx.getMpOrderInfo(appid, mch_id, out_trade_no)
        if (data) {
            ctx.apiSuccess(data)
        }


    }
}
module.exports = MpController