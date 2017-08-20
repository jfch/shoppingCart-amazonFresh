# amazon fresh

## 启动项目
1. 运行mq
2. cd middleware/farm目录下, 运行npm install 然后运行node app.js
3. 回到项目根目录，运行npm install 然后运行node bin/www

## 注意
1. 每次启动middleware/farm会清空数据库, 并创建admin账户wenghaoda@gmail.com, 密码1
2. 使用export NODE_DO_INIT='ture';node bin/www 运行程序(代替上面步骤3的node bin/www)可以自动生成几个帐户, 几个产品, 1个order