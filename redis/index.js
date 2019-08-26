// 建立连接 
var redis = require('redis');
var client = redis.createClient('6379','127.0.0.1');

// redis 连接错误
client.on("error",function(error){
    console.log(error);
});

// redis 验证(redis.conf未开启验证，此项可不需要)
// client.auth('foobared')


// 引入数据库连接 npm包
var pg = require('pg');
var config = {
    host:'127.0.0.1',
    user: 'postgres',
    database: 'chat',
    password:'123456',
    port: '5432',

    // 扩展属性
    max: 20,//连接池最大连接数
    idleTimeoutMillis: 30000,// 连接最大空闲时间 30s
}
//  创建连接池    // pg模块种有两种数据库连接方式   1.连接池模式  new pg.Pool() 2.不使用连接池 new pg.Client();
var pool = new pg.Pool(config);

function pgPool(sql,payload,callback){
pool.connect(function(err,pgClient,done){
    if(err){
        return console.error('数据库连接出错',err);
    }
    pgClient.query(sql = 'SELECT $1::varchar AS OUT',payload = ["Hello World"],function(err,result){
        done();// 释放连接(将其返回给连接池)
        callback(err,result);
        // if(err) {
        //     return console.error('查询出错',err);
        // }
        // console.log(result.rows[0].out); 
    })
})
}
module.exports = {
    client:client,
    ip:'http://127.0.0.1:3000',
    pgPool
}