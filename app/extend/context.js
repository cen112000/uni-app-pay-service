const createHash = require('create-hash')
const wxConfig = require('../service/wx-config')
const xml = require('xml2js')
module.exports = {
    // api返回成功
    apiSuccess(data = '', msg = 'ok', code = 200) {
        this.status = 200;
        // this.body = { msg, data };
        this.body = {
            code: 0,
            data,
            message: msg
        }
    },
    // api返回失败
    apiFail(data = '', msg = 'fail', code = 400) {
        // this.body = { msg, data };
        this.status = code;
        this.body = {
            code: 1001,
            data,
            message: msg
        }
    },
    //统一订单接口
    order(appid, attach, body, openid, total_fee, notify_url, ip) {
        return new Promise(async(resolve, reject) => {
            let nonce_str = this.createNonceStr()
            let out_trade_no = this.getTradeId('mp')
            let sign = this.getPrePaySign(appid, attach, body, openid, total_fee, notify_url, ip, nonce_str, out_trade_no)
            let sendData = this.wxSendData(appid, attach, body, openid, total_fee, notify_url, ip, nonce_str, out_trade_no, sign)
                // console.log('xml 数据', sendData)
                //微信统一下单接口
            let url = 'https://api.mch.weixin.qq.com/pay/unifiedorder';
            // console.log('----', this.curl)
            let result = await this.curl(url, {
                method: 'POST',
                data: sendData,
            })

            let str = result.data.toString('utf-8')
            let json = xml.parseString(str, (err, { xml }) => {
                // console.log('json', xml)
                // return_code: ['SUCCESS'],
                //     return_msg: ['OK'],
                //     appid: ['wx450b396755a432bb'],
                //     mch_id: ['1512077821'],
                //     nonce_str: ['aw64jDrpipA1sH5i'],
                //     sign: ['B0DA3651C522C4C2391CCD0935A1EFC5'],
                //     result_code: ['SUCCESS'],
                //     prepay_id: ['wx0615552613376364f77c5f9dda9f3b0000'],
                //     trade_type: ['JSAPI']
                if (xml.return_code[0] === 'SUCCESS' && xml.result_code[0] === 'SUCCESS') {
                    let prepay_id = xml.prepay_id || [];
                    let payResult = this.getPayParams(appid, prepay_id[0], out_trade_no);
                    // console.log('订单号', out_trade_no)
                    // payResult.out_trade_no = out_trade_no
                    // console.log('订单', payResult)
                    resolve(payResult)
                } else {
                    reject(xml)
                }

            })
        })
    },
    // 生成随机数
    createNonceStr() {
        return Math.random().toString(36).substr(2, 15);
    },
    // 生成时间戳
    createTimeStamp() {
        return parseInt(new Date().getTime() / 1000) + ''
    },
    // 生成签名
    getSign(params, key) {
        let string = this.raw(params) + '&key=' + key;
        let sign = createHash('md5').update(string).digest('hex');
        return sign.toUpperCase();
    },
    // 生成系统的交易订单号
    getTradeId(type = 'wx') {
        let date = new Date().getTime().toString();
        let text = '';
        let possible = '0123456789';
        for (let i = 0; i < 5; i++) {
            text += possible.charAt(Math.floor(Math.random() * possible.length))
        }
        return (type == 'wx' ? 'ImoocWxJuZi' : 'ImoocMpJuZi') + date + text;
    },
    // Object 转换成json并排序
    raw(args) {
        let keys = Object.keys(args).sort();
        let obj = {};
        keys.forEach((key) => {
                obj[key] = args[key];
            })
            // {a:1,b:2} =>  &a=1&b=2
            // 将对象转换为&分割的参数
        let val = '';
        for (let k in obj) {
            val += '&' + k + '=' + obj[k];
        }
        return val.substr(1);
    },
    //生成预支付签名
    getPrePaySign(appid, attach, body, openid, total_fee, notify_url, ip, nonce_str, out_trade_no) {
        let params = {
            appid,
            attach,
            body,
            mch_id: wxConfig.mch.mchID,
            nonce_str,
            notify_url,
            openid,
            out_trade_no,
            spbill_create_ip: ip,
            total_fee,
            trade_type: 'JSAPI'
        }
        let string = this.raw(params) + '&key=' + wxConfig.mch.apisecret;
        let sign = createHash('md5').update(string).digest('hex');
        return sign.toUpperCase();
    },
    //生成XML格式数据
    wxSendData(appid, attach, body, openid, total_fee, notify_url, ip, nonce_str, out_trade_no, sign) {
        let data = '<xml>' +
            '<appid><![CDATA[' + appid + ']]></appid>' +
            '<attach><![CDATA[' + attach + ']]></attach>' +
            '<body><![CDATA[' + body + ']]></body>' +
            '<mch_id><![CDATA[' + wxConfig.mch.mchID + ']]></mch_id>' +
            '<nonce_str><![CDATA[' + nonce_str + ']]></nonce_str>' +
            '<notify_url><![CDATA[' + notify_url + ']]></notify_url>' +
            '<openid><![CDATA[' + openid + ']]></openid>' +
            '<out_trade_no><![CDATA[' + out_trade_no + ']]></out_trade_no>' +
            '<spbill_create_ip><![CDATA[' + ip + ']]></spbill_create_ip>' +
            '<total_fee><![CDATA[' + total_fee + ']]></total_fee>' +
            '<trade_type><![CDATA[JSAPI]]></trade_type>' +
            '<sign><![CDATA[' + sign + ']]></sign>' +
            '</xml>'
        return data;
    },
    async getPayParams(appId, prepay_id, out_trade_no) {
        let params = {
            appId,
            timeStamp: this.createTimeStamp(),
            nonceStr: this.createNonceStr(),
            package: 'prepay_id=' + prepay_id,
            signType: 'MD5',

        }
        let paySign = this.getSign(params, wxConfig.mch.apisecret);
        params.paySign = paySign;
        params.out_trade_no = out_trade_no

        return params;
    },

    //查询订单接口
    getMpOrderInfo(appid, mch_id, out_trade_no) {
        return new Promise(async(resolve, reject) => {
            let url = `https://api.mch.weixin.qq.com/pay/orderquery`
            let nonce_str = this.createNonceStr()

            let params = {
                appid,
                mch_id,
                nonce_str,
                out_trade_no
            }
            let string = this.raw(params) + '&key=' + wxConfig.mch.apisecret;
            let sign = createHash('md5').update(string).digest('hex');
            sign = sign.toUpperCase();

            //XML
            let data = '<xml>' +
                '<appid><![CDATA[' + appid + ']]></appid>' +
                '<mch_id><![CDATA[' + wxConfig.mch.mchID + ']]></mch_id>' +
                '<nonce_str><![CDATA[' + nonce_str + ']]></nonce_str>' +
                '<out_trade_no><![CDATA[' + out_trade_no + ']]></out_trade_no>' +
                '<sign><![CDATA[' + sign + ']]></sign>' +
                '</xml>'
            let result = await this.curl(url, {
                method: 'POST',
                data
            })
            console.log('查询订单', result.data.toString('utf-8'))
            let str = result.data.toString('utf-8')
            xml.parseString(str, (err, { xml }) => {
                console.log('xml', xml)
                if (xml.return_code[0] === 'SUCCESS' && xml.result_code[0] === 'SUCCESS') {
                    resolve(xml)
                } else {
                    reject(xml)
                }
            })
        })

    }
}