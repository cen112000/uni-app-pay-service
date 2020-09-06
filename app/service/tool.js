module.exports = {
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
        // let string = this.raw(params) + '&key=' + key;
        // let sign = createHash('md5').update(string).digest('hex');
        // return sign.toUpperCase();
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
}