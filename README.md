## 微信支付后端代码说明
## 获取用户openid
>获取用户openid 返回给前端
> //根据code 获取openid 
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

## 小程序支付（开发环境为‘本地’）
		## 统一下单接口：参数说明
>appid, //小程序appid
> attach, //附加数据
> body, //支付主体说明
>  openid, //用户的openid
>  total_fee, //金额，以分为单位
>  notify_url, //支付回调地址，确保该地址可以访问
>  ip, //你的服务器ip
>  nonce_str, //随机字符串
>  out_trade_no //商户订单号
>
	## 组合成微信要求的XML格式数据
```javascript
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
```
## 关于订单查询接口
	请求的XML格式如下
	

```javascript
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
                   // 
                }
            })
```![查询订单，可以看到订单已经支付完成](https://img-blog.csdnimg.cn/20200906203511596.png#pic_center)

