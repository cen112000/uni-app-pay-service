'use strict';

const Controller = require('egg').Controller;
const wxConfig = require('../service/wx-config')
const tool = require('../service/tool')
const cache = require('memory-cache')
const utility = require('utility')
const createHash = require('create-hash')
class HomeController extends Controller {
    async index() {
        const { ctx } = this;
        ctx.body = 'hi, egg';
        ctx.service.util.wxCheckApi(ctx)
    }
    async redirect() {
        const { ctx, app } = this
        console.log('redirect')
        let callback = `${wxConfig.localUrl}/api/getOpenId`
        console.log('call', callback)
        let authorizeUrl = `https://open.weixin.qq.com/connect/oauth2/authorize?appid=${wxConfig.appID}&redirect_uri=${callback}&response_type=code&scope=${wxConfig.scope}&state=STATE#wechat_redirect`
        ctx.redirect(authorizeUrl)
    }
    async getOpenId() {
        const { ctx, app } = this
        let { code } = ctx.query
        if (!code) {
            ctx.apiFail('获取授权失败')
            return
        }
        let expire_time = 1000 * 60 * 60 * 2 - 1000 * 60 * 5
        let { data } = await ctx.service.util.getAccessToken(ctx, code)
            //如果获取token成功
        if (data && data.access_token && data.refresh_token) {
            let cookie = ctx.cookies.get('openId')
                // console.log('token--', data, cookie)
            cache.put('access_token', data.access_token, expire_time);
            cache.put('openId', data.openid, expire_time);
            ctx.cookies.set('openId', data.openid, { maxAge: expire_time });
            let openId = data.openid;
            ctx.redirect(`${wxConfig.clientUrl}?auth=true`)

        }
    }
    async getUserInfo() {
            const { ctx, app } = this

            let access_token = cache.get('access_token'),
                openId = cache.get('openId')
                // console.log('get user info', access_token, openId)
            let userInfo = await ctx.service.util.getUserInfo(ctx, access_token, openId)
                // console.log(userInfo)
            if (userInfo && userInfo.data && userInfo.data.openid) {
                ctx.apiSuccess(userInfo.data)
            } else {
                ctx.apiFail('获取用户信息失败')
            }
        }
        //jssdk接口
    async jssdk() {
        const { ctx, app } = this
        console.log('jssdk', ctx.query.url)
        const url = ctx.query.url
        let res = await ctx.service.util.getToken(ctx)
        if (res && res.data.access_token) {
            let expire_time = 1000 * 7200 - 300 * 1000
            let token = res.data.access_token
            cache.put('token', token, expire_time)
                // console.log('token', token)
            let ticket = await ctx.service.util.getTicket(ctx, token)
                // console.log('ticket', ticket)
            if (ticket.data && ticket.data.errcode === 0) {
                let tk = ticket.data.ticket
                cache.put('ticket', tk, expire_time)
                let t = cache.get('ticket')
                    // console.log('t', t)
                let params = {
                        noncestr: tool.createNonceStr(),
                        jsapi_ticket: tk,
                        timestamp: tool.createTimeStamp(),
                        url
                    }
                    // console.log('params', params)
                let raw = tool.raw(params)
                    // console.log('raw', raw)
                let sha1 = utility.sha1(raw)
                    // console.log('sha1', sha1)

                // let sign = createHash('sha1').update(raw).digest('hex');
                // console.log('hasg', sign)
                let code = {
                    appId: wxConfig.appID, // 必填，公众号的唯一标识
                    timestamp: params.timestamp, // 必填，生成签名的时间戳
                    nonceStr: params.noncestr, // 必填，生成签名的随机串
                    signature: sha1, // 必填，签名
                    jsApiList: [
                            'updateAppMessageShareData',
                            'updateTimelineShareData',
                            'onMenuShareTimeline',
                            'onMenuShareAppMessage',
                            'onMenuShareQQ',
                            'onMenuShareQZone',
                            'chooseWXPay'
                        ] // 必填，需要使用的JS接口列表
                }
                ctx.apiSuccess(code)

            }
        }


    }

}

module.exports = HomeController;