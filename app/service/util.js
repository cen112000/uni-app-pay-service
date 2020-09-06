'use strict';

const Service = require('egg').Service;
const utility = require('utility')
const wxConfig = require('./wx-config')
class Util extends Service {
    //微信开发接入
    wxCheckApi(ctx) {
            let { signature, echostr, timestamp, nonce } = ctx.query
            let arr = [wxConfig.token, timestamp, nonce].sort()
            let str = arr.join('')
            let sha1 = utility.sha1(str)

            if (sha1 === signature) {
                ctx.body = echostr + ''
                console.log('消息来自微信服务器')
                return true
            } else {
                // ctx.throw(400, '消息不是来自微信服务器');
                console.log('消息不是来自微信服务器')
                return false
            }
            // console.log('123')
        }
        //获取网页的access_token
    async getAccessToken(ctx, code) {
        let token_url = `https://api.weixin.qq.com/sns/oauth2/access_token?appid=${wxConfig.appID}&secret=${wxConfig.appsecret}&code=${code}&grant_type=authorization_code`;
        let token = await ctx.curl(token_url, {
            method: 'GET',
            dataType: 'json'
        })
        return token
    }
    async getUserInfo(ctx, access_token, openId) {
            let url = `https://api.weixin.qq.com/sns/userinfo?access_token=${access_token}&openid=${openId}&lang=zh_CN`;
            let res = await ctx.curl(url, {
                method: 'GET',
                dataType: 'json'
            })
            return res
        }
        //获取基本的token,非网页用的access_token
    async getToken(ctx) {
            let url = `https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=${wxConfig.appID}&secret=${wxConfig.appsecret}`;
            let res = await ctx.curl(url, {
                method: 'GET',
                dataType: 'json'
            })
            return res
        }
        //根据微信基础token，获取ticket
    async getTicket(ctx, token) {
        let url = `https://api.weixin.qq.com/cgi-bin/ticket/getticket?access_token=${token}&type=jsapi`;
        let res = await ctx.curl(url, {
            method: 'GET',
            dataType: 'json'
        })
        return res
    }

}
module.exports = Util